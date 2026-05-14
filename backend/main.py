import re
import os
import uuid
import shutil
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import json

from database import connect_to_mongo, close_mongo_connection, get_db
from inference import load_models, run_inference, predict_emotions #, transcribe_audio
from models import AnalyzeRequest, ReportRequest, ContactRequest, UserCreate, UserLogin, DevAnalyzeRequest, SendOTPRequest, BlockUserRequest, AdminReplyRequest, ForgotPasswordRequest, ResetPasswordRequest, SettingsUpdate
from auth import get_password_hash, verify_password, create_access_token, get_current_user_token, SECRET_KEY, ALGORITHM

from email_service import send_otp_email, send_welcome_email, send_block_notice, send_unblock_notice, send_contact_reply, send_password_reset_email

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="KriyaSense API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security_optional = HTTPBearer(auto_error=False)
def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security_optional)):
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub")
        except JWTError:
            pass
    return None

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    db = get_db()
    await db.otps.create_index("createdAt", expireAfterSeconds=600)
    load_models()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

def strip_html(text: str) -> str:
    return re.sub(r'<[^>]*>', '', text)

# --- WEB ANALYZER ENDPOINTS ---

@app.post("/api/analyze")
@limiter.limit("30/minute")
async def analyze_text(request: Request, body: AnalyzeRequest, optional_user: str = Depends(get_optional_user)):
    clean_text = strip_html(body.text)
    
    if len(clean_text) < 3 or len(clean_text) > 512:
        raise HTTPException(status_code=400, detail="Text must be between 3 and 512 characters")
        
    db = get_db()
    
    if body.model == "kriyasense":
        # Get KriyaSense-V1 URL from settings
        settings = await db.settings.find_one({"key": "kriyasense_v1_url"})
        if not settings or not settings.get("value"):
            raise HTTPException(status_code=503, detail="KriyaSense-V1 model is currently unavailable (URL not configured)")
        
        qwen_url = settings["value"]
        if not qwen_url.startswith("http"):
            qwen_url = f"https://{qwen_url}"
        
        # We'll use the URL as provided, but if it doesn't contain a path, 
        # we might want to suggest /predict as a default if it fails.
        # For now, let's keep it as is but ensure it's clean.
        qwen_url = qwen_url.strip()
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "KriyaSense-App/1.0"
                }
                
                # Try the URL as provided first
                response = await client.post(qwen_url, json={"text": clean_text}, headers=headers, timeout=30.0)
                
                # Smart Retry: If root fails with 404 or 405, try common Colab sub-paths
                if response.status_code in [404, 405] and not qwen_url.endswith("/predict") and not qwen_url.endswith("/analyze"):
                    retry_url = f"{qwen_url.rstrip('/')}/predict"
                    try:
                        retry_response = await client.post(retry_url, json={"text": clean_text}, headers=headers, timeout=15.0)
                        if retry_response.status_code == 200:
                            response = retry_response
                            qwen_url = retry_url # Update for logs
                    except:
                        pass
                
                if response.status_code != 200:
                    detail_msg = f"KriyaSense-V1 API error ({response.status_code}) at {qwen_url}. "
                    if response.status_code == 405:
                        detail_msg += "Method Not Allowed. Check if your Colab endpoint supports POST requests."
                    elif response.status_code == 404:
                        detail_msg += "Not Found. Check if your Colab endpoint path is correct (e.g., /predict)."
                    else:
                        detail_msg += response.text[:100]
                    raise HTTPException(status_code=502, detail=detail_msg)
                
                # Robust parsing
                sentiment_text = "neutral"
                try:
                    data = response.json()
                    if isinstance(data, dict):
                        raw_val = data.get("sentiment") or data.get("label") or data.get("result") or data.get("prediction") or str(data)
                        sentiment_text = str(raw_val).lower()
                    else:
                        sentiment_text = str(data).lower()
                except:
                    sentiment_text = response.text.lower()
                
                # Normalize
                if any(word in sentiment_text for word in ["positive", "happy", "joy", "good"]):
                    final_sentiment = "positive"
                elif any(word in sentiment_text for word in ["negative", "sad", "angry", "bad", "hate"]):
                    final_sentiment = "negative"
                else:
                    final_sentiment = "neutral"
                
                loop = asyncio.get_event_loop()
                emotions = await loop.run_in_executor(None, predict_emotions, clean_text)
                
                inference_result = {
                    "sentiment": {
                        "positive": 100 if final_sentiment == "positive" else 0,
                        "negative": 100 if final_sentiment == "negative" else 0,
                        "neutral": 100 if final_sentiment == "neutral" else 0
                    },
                    "emotions": emotions,
                    "dominant_sentiment": final_sentiment
                }
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to KriyaSense-V1 API: {str(e)}")
    else:
        inference_result = await run_inference(clean_text)
    
    doc = {
        "text": clean_text,
        "sentiment": inference_result["sentiment"],
        "emotions": inference_result["emotions"],
        "dominant_sentiment": inference_result["dominant_sentiment"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "reported": False,
        "is_api_request": False,
        "owner_id": optional_user,
        "model_used": body.model
    }
    
    result = await db.predictions.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    
    return doc

# @app.post("/api/analyze/audio")
# @limiter.limit("10/minute")
# async def analyze_audio(request: Request, file: UploadFile = File(...), optional_user: str = Depends(get_optional_user)):
#     temp_dir = "temp_audio"
#     os.makedirs(temp_dir, exist_ok=True)
#     file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
#     
#     try:
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#             
#         transcribed_text = await transcribe_audio(file_path)
#         clean_text = strip_html(transcribed_text)
#         
#         if len(clean_text) < 3:
#              return {"error": "Audio too short or silent", "text": transcribed_text}
#              
#         # Only return the text, the frontend will populate the textarea
#         return {"text": clean_text}
#     except Exception as e:
#         return {"error": f"Audio processing failed: {str(e)}"}
#     finally:
#         if os.path.exists(file_path):
#             os.remove(file_path)

# --- AUTH & USER ENDPOINTS ---

@app.post("/api/auth/send-otp")
async def send_otp(body: SendOTPRequest):
    db = get_db()
    existing_user = await db.users.find_one({"email": body.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    otp_code = str(random.randint(100000, 999999))
    await db.otps.update_one(
        {"email": body.email},
        {"$set": {"otp": otp_code, "createdAt": datetime.utcnow()}},
        upsert=True
    )
    send_otp_email(body.email, otp_code)
    return {"message": "OTP sent to email"}

@app.post("/api/auth/register")
async def register(user: UserCreate):
    db = get_db()
    
    # Verify OTP
    otp_doc = await db.otps.find_one({"email": user.email, "otp": user.otp})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "user",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "api_keys": [],
        "total_api_calls": 0,
        "daily_api_calls": {},
        "is_blocked": False,
        "block_message": None,
        "last_api_call": None
    }
    await db.users.insert_one(user_doc)
    await db.otps.delete_one({"_id": otp_doc["_id"]})
    send_welcome_email(user.email, user.username)
    
    return {"message": "User created successfully"}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db = get_db()
    
    if user.email == "tbxadmin@gmail.com" and user.password == "tbxadmin123":
        access_token = create_access_token(data={"sub": "tbxadmin", "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin", "is_blocked": False}
        
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": db_user["username"], "role": db_user.get("role", "user")})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": db_user.get("role", "user"),
        "is_blocked": db_user.get("is_blocked", False),
        "block_message": db_user.get("block_message", None)
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user:
        return {"message": "If that email exists, an OTP has been sent."} 
        
    otp_code = str(random.randint(100000, 999999))
    await db.otps.update_one(
        {"email": body.email},
        {"$set": {"otp": otp_code, "createdAt": datetime.utcnow()}},
        upsert=True
    )
    send_password_reset_email(body.email, otp_code)
    return {"message": "If that email exists, an OTP has been sent."}

@app.post("/api/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    db = get_db()
    otp_doc = await db.otps.find_one({"email": body.email, "otp": body.otp})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    user = await db.users.find_one({"email": body.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed_password = get_password_hash(body.new_password)
    await db.users.update_one(
        {"email": body.email},
        {"$set": {"hashed_password": hashed_password}}
    )
    await db.otps.delete_one({"_id": otp_doc["_id"]})
    return {"message": "Password reset successfully"}

@app.get("/api/user/me")
async def get_my_details(token_payload: dict = Depends(get_current_user_token)):
    if token_payload.get("role") == "admin":
        return {"username": "tbxadmin", "role": "admin", "is_blocked": False}
        
    db = get_db()
    user = await db.users.find_one({"username": token_payload.get("sub")}, {"hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

# --- DEVELOPER API ---

@app.post("/api/developer/key")
async def generate_api_key(token_payload: dict = Depends(get_current_user_token)):
    db = get_db()
    user = await db.users.find_one({"username": token_payload.get("sub")})
    if user.get("is_blocked"):
         raise HTTPException(status_code=403, detail="Account is blocked")
         
    if len(user.get("api_keys", [])) >= 3:
        raise HTTPException(status_code=400, detail="Maximum of 3 API keys allowed per user.")
         
    new_key = f"sk_{uuid.uuid4().hex}"
    await db.users.update_one(
        {"username": token_payload.get("sub")},
        {"$push": {"api_keys": new_key}}
    )
    return {"api_key": new_key}

def get_api_key(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing API Key")
    return auth_header.split(" ")[1]

import asyncio
import json
from fastapi.responses import StreamingResponse

@app.post("/api/v1/analyze")
async def dev_analyze(request: Request, body: DevAnalyzeRequest):
    api_key = get_api_key(request)
    db = get_db()
    user = await db.users.find_one({"api_keys": api_key})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked by administrator.")
        
    now = datetime.utcnow()
    last_call = user.get("last_api_call")
    if last_call:
        if (now - last_call).total_seconds() < 10:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 1 request per 10 seconds.")
        
    today = now.strftime("%Y-%m-%d")
    daily_calls = user.get("daily_api_calls", {}).get(today, 0)
    
    if daily_calls >= 30:
        raise HTTPException(status_code=429, detail="Daily free API limit reached (30/30)")
        
    if len(body.text) > 2000:
        raise HTTPException(status_code=400, detail="Text exceeds maximum length of 2000 characters")
        
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_api_call": now}})
        
    async def event_stream():
        task_id = str(uuid.uuid4())
        yield f"data: {json.dumps({'status': 'queued', 'task_id': task_id})}\n\n"
        
        try:
            # Inline processing to avoid Celery/Redis
            chunk_size = 500
            text = body.text
            chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            
            total_pos, total_neg, total_neu = 0, 0, 0
            all_emotions = []
            num_chunks = len(chunks)
            
            for idx, chunk in enumerate(chunks):
                res = await run_inference(chunk)
                total_pos += res["sentiment"]["positive"]
                total_neg += res["sentiment"]["negative"]
                total_neu += res["sentiment"]["neutral"]
                all_emotions.extend(res["emotions"])
                
                progress_data = {
                    "status": "processing",
                    "chunk_index": idx + 1,
                    "total_chunks": num_chunks,
                    "sentiment_delta": res["sentiment"]
                }
                yield f"data: {json.dumps(progress_data)}\n\n"
                
            avg_sentiment = {
                "positive": round(total_pos / num_chunks, 1),
                "negative": round(total_neg / num_chunks, 1),
                "neutral": round(total_neu / num_chunks, 1),
            }
            
            dominant_sentiment = max(avg_sentiment, key=avg_sentiment.get)
            
            unique_emotions = []
            for e in all_emotions:
                if e not in unique_emotions:
                    unique_emotions.append(e)
                if len(unique_emotions) >= 5:
                    break
                    
            doc = {
                "text": text,
                "sentiment": avg_sentiment,
                "emotions": unique_emotions,
                "dominant_sentiment": dominant_sentiment,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "reported": False,
                "report_reason": None,
                "report_suggested_sentiment": None,
                "report_suggested_emotions": None,
                "report_comment": None,
                "session_id": body.session_id or "",
                "api_key": api_key,
                "is_api_request": True
            }
            
            result = await db.predictions.insert_one(doc)
            doc["_id"] = str(result.inserted_id)
            
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            await db.users.update_one(
                {"api_keys": api_key},
                {
                    "$inc": {
                        "total_api_calls": 1,
                        f"daily_api_calls.{today_str}": 1
                    }
                }
            )
            
            final_data = {
                "status": "completed",
                "result": doc
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# --- ADMIN ENDPOINTS ---

def verify_admin(token_payload: dict = Depends(get_current_user_token)):
    if token_payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_payload

@app.get("/api/tbxadmin/stats")
async def get_admin_stats(admin: dict = Depends(verify_admin)):
    db = get_db()
    total_web_analyses = await db.predictions.count_documents({"is_api_request": {"$ne": True}})
    total_api_analyses = await db.predictions.count_documents({"is_api_request": True})
    total_users = await db.users.count_documents({})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_api_calls"}}}]
    api_calls_cursor = db.users.aggregate(pipeline)
    total_api_calls = 0
    async for doc in api_calls_cursor:
        total_api_calls = doc.get("total", 0)
        
    return {
        "total_web_analyses": total_web_analyses,
        "total_api_analyses": total_api_analyses,
        "total_users": total_users,
        "total_api_calls_made": total_api_calls
    }

@app.get("/api/tbxadmin/users")
async def get_admin_users(admin: dict = Depends(verify_admin)):
    db = get_db()
    users = []
    today_date = datetime.utcnow().date()
    
    async for user in db.users.find({}, {"hashed_password": 0}):
        user["_id"] = str(user["_id"])
        daily_calls = user.get("daily_api_calls", {})
        
        today_total = 0
        week_total = 0
        month_total = 0
        
        for date_str, count in daily_calls.items():
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d").date()
                days_diff = (today_date - d).days
                if days_diff == 0:
                    today_total += count
                if days_diff < 7:
                    week_total += count
                if days_diff < 30:
                    month_total += count
            except:
                pass
                
        user["stats_today"] = today_total
        user["stats_week"] = week_total
        user["stats_month"] = month_total
        
        users.append(user)
    return users

@app.put("/api/tbxadmin/users/{user_id}/block")
async def block_user(user_id: str, body: BlockUserRequest, admin: dict = Depends(verify_admin)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_blocked": True, "block_message": body.message}}
    )
    if user.get("email"):
        send_block_notice(user["email"], body.message)
    return {"success": True}

@app.put("/api/tbxadmin/users/{user_id}/unblock")
async def unblock_user(user_id: str, admin: dict = Depends(verify_admin)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_blocked": False, "block_message": None}}
    )
    if user.get("email"):
        send_unblock_notice(user["email"])
    return {"success": True}

@app.delete("/api/tbxadmin/users/{user_id}")
async def delete_user_data(user_id: str, admin: dict = Depends(verify_admin)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.predictions.delete_many({"owner_id": user["username"]})
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"success": True}

@app.get("/api/tbxadmin/reports")
async def get_admin_reports(admin: dict = Depends(verify_admin)):
    db = get_db()
    reports = []
    async for rep in db.predictions.find({"reported": True}).sort("timestamp", -1):
        rep["_id"] = str(rep["_id"])
        reports.append(rep)
    return reports

@app.get("/api/tbxadmin/messages")
async def get_admin_messages(admin: dict = Depends(verify_admin)):
    db = get_db()
    messages = []
    async for msg in db.contacts.find().sort("timestamp", -1):
        msg["_id"] = str(msg["_id"])
        if "status" not in msg:
            msg["status"] = "active" 
        messages.append(msg)
    return messages

@app.post("/api/tbxadmin/messages/{msg_id}/reply")
async def reply_to_message(msg_id: str, body: AdminReplyRequest, admin: dict = Depends(verify_admin)):
    db = get_db()
    msg = await db.contacts.find_one({"_id": ObjectId(msg_id)})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    send_contact_reply(msg["email"], body.reply_message, msg["message"])
    
    await db.contacts.update_one(
        {"_id": ObjectId(msg_id)},
        {"$set": {"status": body.status, "admin_reply": body.reply_message}}
    )
    return {"success": True}

@app.put("/api/tbxadmin/messages/{msg_id}/status")
async def update_message_status(msg_id: str, status: str, admin: dict = Depends(verify_admin)):
    db = get_db()
    await db.contacts.update_one({"_id": ObjectId(msg_id)}, {"$set": {"status": status}})
    return {"success": True}

@app.get("/api/tbxadmin/settings")
async def get_admin_settings(admin: dict = Depends(verify_admin)):
    db = get_db()
    kriyasense_url = await db.settings.find_one({"key": "kriyasense_v1_url"})
    return {
        "kriyasense_v1_url": kriyasense_url["value"] if kriyasense_url else ""
    }

@app.post("/api/tbxadmin/settings")
async def update_admin_settings(body: SettingsUpdate, admin: dict = Depends(verify_admin)):
    db = get_db()
    await db.settings.update_one(
        {"key": "kriyasense_v1_url"},
        {"$set": {"value": body.kriyasense_v1_url}},
        upsert=True
    )
    return {"success": True}

# --- OTHER ENDPOINTS ---

@app.post("/api/report")
async def report_prediction(body: ReportRequest):
    db = get_db()
    try:
        obj_id = ObjectId(body.prediction_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")
        
    update_data = {
        "reported": True,
        "report_reason": body.wrong_field,
        "report_suggested_sentiment": body.suggested_sentiment,
        "report_suggested_emotions": body.suggested_emotions,
        "report_comment": body.comment
    }
    
    result = await db.predictions.update_one({"_id": obj_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    return {"success": True, "message": "Thank you, this helps improve our model"}

@app.post("/api/contact")
async def contact_us(body: ContactRequest):
    db = get_db()
    doc = {
        "name": body.name,
        "email": body.email,
        "subject": body.subject,
        "message": body.message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "active"
    }
    await db.contacts.insert_one(doc)
    return {"success": True}

@app.get("/api/health")
async def health_check():
    from inference import sentiment_model, emotion_model, whisper_model
    models_loaded = sentiment_model is not None and emotion_model is not None and whisper_model is not None
    return {
        "status": "ok",
        "models_loaded": models_loaded,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
