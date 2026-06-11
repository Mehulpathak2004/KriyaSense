import re
import os
import csv
import io
import uuid
import shutil
import random
import asyncio
import json
import pandas as pd
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx

from database import connect_to_mongo, close_mongo_connection, get_db
from inference import load_models, run_inference, predict_emotions #, transcribe_audio
from models import AnalyzeRequest, ReportRequest, ContactRequest, UserCreate, UserLogin, DevAnalyzeRequest, SendOTPRequest, BlockUserRequest, AdminReplyRequest, ForgotPasswordRequest, ResetPasswordRequest, SettingsUpdate
from auth import get_password_hash, verify_password, create_access_token, get_current_user_token, SECRET_KEY, ALGORITHM

from email_service import send_otp_email, send_welcome_email, send_block_notice, send_unblock_notice, send_contact_reply, send_password_reset_email, send_csv_job_complete, send_csv_job_failed

# --- CSV Config ---
CSV_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "csv_uploads")
CSV_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "csv_outputs")
MAX_CSV_SIZE = 10 * 1024 * 1024  # 10MB
MAX_CSV_ROWS = 5000
DAILY_CSV_LIMIT = 5
os.makedirs(CSV_UPLOAD_DIR, exist_ok=True)
os.makedirs(CSV_OUTPUT_DIR, exist_ok=True)

# --- CSV Job Queue ---
csv_job_queue: asyncio.Queue = asyncio.Queue()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="KriyaSense API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://kriyasense.kriyanto.com",
        "http://kriyasense.kriyanto.com"
    ],
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
    try:
        await db.csv_jobs.drop_index("expires_at_1")
    except Exception:
        pass
    load_models()
    # Start background workers
    asyncio.create_task(csv_queue_worker())
    asyncio.create_task(csv_cleanup_task())

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# --- CSV Background Queue Worker ---
async def csv_queue_worker():
    """Processes CSV prediction jobs from the asyncio queue."""
    while True:
        job_id = await csv_job_queue.get()
        try:
            await _process_csv_job(job_id)
        except Exception as e:
            print(f"[CSV Worker] Error processing job {job_id}: {e}")
            db = get_db()
            await db.csv_jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"status": "failed", "error_message": str(e)}}
            )
        finally:
            csv_job_queue.task_done()

async def _process_csv_job(job_id: str):
    """Core logic for processing a single CSV prediction job."""
    db = get_db()
    job = await db.csv_jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return

    user = await db.users.find_one({"username": job["user"]})
    user_email = user.get("email", "") if user else ""

    # Update status to processing
    await db.csv_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "processing"}}
    )

    input_path = os.path.join(CSV_UPLOAD_DIR, job["user"], job["stored_filename"])
    if not os.path.exists(input_path):
        await db.csv_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "failed", "error_message": "Input file not found on server"}}
        )
        if user_email:
            send_csv_job_failed(user_email, job["user"], job["original_filename"], "Input file not found")
        return

    try:
        df = pd.read_csv(input_path)
    except Exception as e:
        await db.csv_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "failed", "error_message": f"Failed to read CSV: {str(e)}"}}
        )
        if user_email:
            send_csv_job_failed(user_email, job["user"], job["original_filename"], f"Failed to read CSV: {str(e)}")
        return

    column = job["selected_column"]
    model_name = job.get("model", "kriyacore")
    company_name = user.get("company_name") if user else None
    industry = user.get("industry") if user else None
    company_size = user.get("company_size") if user else None
    use_case = user.get("use_case") if user else None

    processed_rows = 0
    error_rows = 0
    error_details = []

    sentiments = []
    emotions_list = []
    pos_scores = []
    neg_scores = []
    neu_scores = []

    # Loyalty & Retention lists
    priority_scores = []
    urgency_levels = []
    recommended_offers = []

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    urgency_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    total_priority_score = 0.0
    total_points = 0
    candidates = []

    total_rows = len(df)
    update_interval = max(1, total_rows // 20)

    for idx, row in df.iterrows():
        text = row.get(column)
        # Handle empty/NaN cells
        if pd.isna(text) or str(text).strip() == "":
            error_rows += 1
            if len(error_details) < 20:
                error_details.append({"row": idx + 2, "error": "Empty or missing text"})
            sentiments.append("")
            emotions_list.append("")
            pos_scores.append("")
            neg_scores.append("")
            neu_scores.append("")
            priority_scores.append(0.0)
            urgency_levels.append("Low")
            recommended_offers.append("No text analyzed")
            continue

        text = str(text).strip()

        # Skip very long text
        if len(text) > 2000:
            error_rows += 1
            if len(error_details) < 20:
                error_details.append({"row": idx + 2, "error": "Text exceeds 2000 characters"})
            sentiments.append("")
            emotions_list.append("")
            pos_scores.append("")
            neg_scores.append("")
            neu_scores.append("")
            priority_scores.append(0.0)
            urgency_levels.append("Low")
            recommended_offers.append("Text too long")
            continue

        try:
            if model_name == "kriyasense":
                settings = await db.settings.find_one({"key": "kriyasense_v1_url"})
                qwen_url = settings["value"] if settings and settings.get("value") else None
                if not qwen_url:
                    raise Exception("KriyaSense-V1 URL not configured")
                if not qwen_url.startswith("http"):
                    qwen_url = f"https://{qwen_url}"
                qwen_url = qwen_url.strip()
                
                async with httpx.AsyncClient() as client:
                    headers = {
                        "ngrok-skip-browser-warning": "true",
                        "User-Agent": "KriyaSense-App/1.0"
                    }
                    payload = {
                        "text": text,
                        "company_name": company_name,
                        "industry": industry,
                        "company_size": company_size,
                        "use_case": use_case
                    }
                    
                    response = await client.post(qwen_url, json=payload, headers=headers, timeout=20.0)
                    
                    if response.status_code in [404, 405] and not qwen_url.endswith("/predict") and not qwen_url.endswith("/analyze"):
                        retry_url = f"{qwen_url.rstrip('/')}/predict"
                        try:
                            retry_response = await client.post(retry_url, json=payload, headers=headers, timeout=10.0)
                            if retry_response.status_code == 200:
                                response = retry_response
                        except:
                            pass
                    
                    if response.status_code != 200:
                        raise Exception(f"Colab API returned status {response.status_code}")
                        
                    sentiment_text = "neutral"
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            raw_val = data.get("sentiment") or data.get("label") or data.get("result") or data.get("prediction") or str(data)
                            sentiment_text = raw_val.lower()
                        else:
                            sentiment_text = str(data).lower()
                    except:
                        sentiment_text = response.text.lower()
                    
                    if any(word in sentiment_text for word in ["positive", "happy", "joy", "good"]):
                        final_sentiment = "positive"
                    elif any(word in sentiment_text for word in ["negative", "sad", "angry", "bad", "hate"]):
                        final_sentiment = "negative"
                    else:
                        final_sentiment = "neutral"
                    
                    loop = asyncio.get_event_loop()
                    emotions = await loop.run_in_executor(None, predict_emotions, text)
                    
                    result = {
                        "sentiment": {
                            "positive": 100 if final_sentiment == "positive" else 0,
                            "negative": 100 if final_sentiment == "negative" else 0,
                            "neutral": 100 if final_sentiment == "neutral" else 0
                        },
                        "emotions": emotions,
                        "dominant_sentiment": final_sentiment
                    }
            else:
                result = await run_inference(text)
            sentiment_label = result["dominant_sentiment"]
            emotions = result["emotions"]
            
            pos_score = result["sentiment"]["positive"]
            neg_score = result["sentiment"]["negative"]
            neu_score = result["sentiment"]["neutral"]
            
            def clean_score(val):
                try:
                    v = float(val)
                    return v / 100.0 if v > 1.0 else v
                except:
                    return 0.0
            
            p_val = clean_score(pos_score)
            n_val = clean_score(neg_score)
            nu_val = clean_score(neu_score)
            
            # Loyalty Priority Score calculation
            if sentiment_label == "negative":
                base = n_val
                boost = 0.0
                for emo in emotions:
                    emo_lower = emo.lower()
                    if any(term in emo_lower for term in ["anger", "frustration", "disappointed", "disappointment", "annoyance", "disgust"]):
                        boost += 0.20
                    elif any(term in emo_lower for term in ["sadness", "fear"]):
                        boost += 0.10
                priority_score = min(0.99, base + boost)
            elif sentiment_label == "neutral":
                priority_score = nu_val * 0.3
            else:
                priority_score = p_val * 0.05
            
            priority_pct = round(priority_score * 100, 1)
            
            # Offer recommendations
            if priority_pct >= 75:
                urgency = "Critical"
                offer = "50% Discount Coupon + 500 Loyalty Points (Immediate Outreach)"
                pts = 500
            elif priority_pct >= 50:
                urgency = "High"
                offer = "20% Discount Coupon + 200 Loyalty Points"
                pts = 200
            elif priority_pct >= 25:
                urgency = "Medium"
                offer = "10% Discount Coupon + 100 Loyalty Points"
                pts = 100
            else:
                urgency = "Low"
                offer = "Thank You Email + 10 Loyalty Points"
                pts = 10
            
            priority_scores.append(priority_pct)
            urgency_levels.append(urgency)
            recommended_offers.append(offer)

            sentiment_counts[sentiment_label] += 1
            urgency_counts[urgency.lower()] += 1
            total_priority_score += priority_pct
            total_points += pts
            
            if sentiment_label == "negative" or urgency in ["Critical", "High"]:
                candidates.append({
                    "row": idx + 2,
                    "text": text[:200] + ("..." if len(text) > 200 else ""),
                    "sentiment": sentiment_label,
                    "emotions": ", ".join(emotions),
                    "score": priority_pct,
                    "urgency": urgency,
                    "offer": offer
                })

            sentiments.append(sentiment_label)
            emotions_list.append(", ".join(emotions))
            pos_scores.append(result["sentiment"]["positive"])
            neg_scores.append(result["sentiment"]["negative"])
            neu_scores.append(result["sentiment"]["neutral"])
            processed_rows += 1
        except Exception as e:
            error_rows += 1
            if len(error_details) < 20:
                error_details.append({"row": idx + 2, "error": str(e)[:100]})
            sentiments.append("")
            emotions_list.append("")
            pos_scores.append("")
            neg_scores.append("")
            neu_scores.append("")
            priority_scores.append(0.0)
            urgency_levels.append("Low")
            recommended_offers.append("Error in analysis")

        # Update progress dynamically based on file size
        if (idx + 1) % update_interval == 0:
            await db.csv_jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"processed_rows": processed_rows, "error_rows": error_rows}}
            )

    # Build output DataFrame
    df["predicted_sentiment"] = sentiments
    df["sentiment_positive"] = pos_scores
    df["sentiment_negative"] = neg_scores
    df["sentiment_neutral"] = neu_scores
    df["predicted_emotions"] = emotions_list
    df["loyalty_priority_score"] = priority_scores
    df["retention_urgency"] = urgency_levels
    df["recommended_offer"] = recommended_offers

    # Save output
    user_output_dir = os.path.join(CSV_OUTPUT_DIR, job["user"])
    os.makedirs(user_output_dir, exist_ok=True)
    output_filename = f"{job['stored_filename'].replace('.csv', '')}_output.csv"
    output_path = os.path.join(user_output_dir, output_filename)
    df.to_csv(output_path, index=False)

    candidates.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = candidates[:10]
    avg_priority = round(total_priority_score / processed_rows, 1) if processed_rows > 0 else 0.0

    analytics_summary = {
        "sentiment_distribution": sentiment_counts,
        "urgency_distribution": urgency_counts,
        "average_priority_score": avg_priority,
        "total_points_recommended": total_points,
        "top_candidates": top_candidates
    }

    # Update job document with analytics
    await db.csv_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "completed",
            "processed_rows": processed_rows,
            "error_rows": error_rows,
            "error_details": error_details,
            "output_filename": output_filename,
            "analytics": analytics_summary
        }}
    )

    # Update user stats
    await db.users.update_one(
        {"username": job["user"]},
        {"$inc": {
            "total_csv_uploads": 1,
            "total_csv_rows_processed": processed_rows
        }}
    )

    # Send email notification
    if user_email:
        send_csv_job_complete(
            user_email, job["user"], job["original_filename"],
            processed_rows, error_rows, "completed"
        )

# --- CSV Cleanup Task (runs every hour) ---
async def csv_cleanup_task():
    """Deletes expired CSV files but keeps job records (24h TTL)."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        try:
            db = get_db()
            now = datetime.utcnow()
            # Find jobs that are expired and haven't had their files deleted yet
            expired_jobs = db.csv_jobs.find({
                "expires_at": {"$lt": now},
                "files_deleted": {"$ne": True}
            })
            deleted_count = 0
            async for job in expired_jobs:
                # Delete input file
                input_path = os.path.join(CSV_UPLOAD_DIR, job.get("user", ""), job.get("stored_filename", ""))
                if os.path.exists(input_path):
                    try:
                        os.remove(input_path)
                    except Exception as e:
                        print(f"[CSV Cleanup] Error removing input file {input_path}: {e}")
                # Delete output file
                if job.get("output_filename"):
                    output_path = os.path.join(CSV_OUTPUT_DIR, job.get("user", ""), job["output_filename"])
                    if os.path.exists(output_path):
                        try:
                            os.remove(output_path)
                        except Exception as e:
                            print(f"[CSV Cleanup] Error removing output file {output_path}: {e}")
                
                # Mark files as deleted in DB instead of deleting the doc
                await db.csv_jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"files_deleted": True}}
                )
                deleted_count += 1
            if deleted_count > 0:
                print(f"[CSV Cleanup] Purged physical files for {deleted_count} expired CSV job(s)")
        except Exception as e:
            print(f"[CSV Cleanup] Error: {e}")

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
        
        qwen_url = qwen_url.strip()
        
        # Get company context if optional_user is provided
        company_name = None
        industry = None
        company_size = None
        use_case = None
        if optional_user:
            user_doc = await db.users.find_one({"username": optional_user})
            if user_doc:
                company_name = user_doc.get("company_name")
                industry = user_doc.get("industry")
                company_size = user_doc.get("company_size")
                use_case = user_doc.get("use_case")
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "KriyaSense-App/1.0"
                }
                
                payload = {
                    "text": clean_text,
                    "company_name": company_name,
                    "industry": industry,
                    "company_size": company_size,
                    "use_case": use_case
                }
                
                # Try the URL as provided first
                response = await client.post(qwen_url, json=payload, headers=headers, timeout=30.0)
                
                # Smart Retry: If root fails with 404 or 405, try common Colab sub-paths
                if response.status_code in [404, 405] and not qwen_url.endswith("/predict") and not qwen_url.endswith("/analyze"):
                    retry_url = f"{qwen_url.rstrip('/')}/predict"
                    try:
                        retry_response = await client.post(retry_url, json=payload, headers=headers, timeout=15.0)
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

# --- MODEL HEALTH CHECK ---

@app.get("/api/health/models")
async def check_model_health():
    """Check availability of all analysis models."""
    db = get_db()
    kriyasense_available = False
    try:
        settings = await db.settings.find_one({"key": "kriyasense_v1_url"})
        colab_url = settings.get("value", "") if settings else ""
        if colab_url:
            if not colab_url.startswith("http"):
                colab_url = f"https://{colab_url}"
            colab_url = colab_url.strip()
            
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "KriyaSense-App/1.0"
                }
                resp = await client.get(colab_url, headers=headers)
                kriyasense_available = resp.status_code == 200
    except Exception as e:
        print(f"[Health Check] Error checking kriyasense: {e}")
        kriyasense_available = False
    return {"kriyacore": True, "kriyasense": kriyasense_available}

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
        "daily_limit": 30,
        "is_blocked": False,
        "block_message": None,
        "last_api_call": None,
        "company_name": user.company_name,
        "industry": user.industry,
        "company_size": user.company_size,
        "use_case": user.use_case
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
    
    if daily_calls >= user.get("daily_limit", 30):
        daily_limit = user.get("daily_limit", 30)
        raise HTTPException(status_code=429, detail=f"Daily free API limit reached ({daily_limit}/{daily_limit})")
        
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
    
    # CSV stats
    total_csv_jobs = await db.csv_jobs.count_documents({})
    csv_completed = await db.csv_jobs.count_documents({"status": "completed"})
    csv_rows_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_csv_rows_processed"}}}]
    csv_rows_cursor = db.users.aggregate(csv_rows_pipeline)
    total_csv_rows = 0
    async for doc in csv_rows_cursor:
        total_csv_rows = doc.get("total", 0)
        
    return {
        "total_web_analyses": total_web_analyses,
        "total_api_analyses": total_api_analyses,
        "total_users": total_users,
        "total_api_calls_made": total_api_calls,
        "total_csv_jobs": total_csv_jobs,
        "csv_completed": csv_completed,
        "total_csv_rows_processed": total_csv_rows
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

@app.put("/api/tbxadmin/users/{user_id}/limit")
async def update_user_daily_limit(user_id: str, admin: dict = Depends(verify_admin), limit: int = 30):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"daily_limit": limit}}
    )
    return {"success": True, "new_limit": limit}

@app.get("/api/tbxadmin/recent-activity")
async def get_recent_activity(admin: dict = Depends(verify_admin)):
    db = get_db()
    activities = []
    async for pred in db.predictions.find({"is_api_request": True}).sort("timestamp", -1).limit(10):
        pred["_id"] = str(pred["_id"])
        # Find username from api_key
        if pred.get("api_key"):
            user = await db.users.find_one({"api_keys": pred["api_key"]}, {"username": 1, "email": 1})
            pred["user_info"] = {"username": user.get("username", "unknown"), "email": user.get("email", "")} if user else None
        activities.append(pred)
    return activities

# --- CSV BATCH PREDICTION ENDPOINTS ---

@app.post("/api/csv/upload")
async def csv_upload(request: Request, file: UploadFile = File(...), token_payload: dict = Depends(get_current_user_token)):
    username = token_payload.get("sub")
    db = get_db()
    
    # Check user exists and is not blocked
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")
    
    # Check daily CSV upload limit
    today = datetime.utcnow().strftime("%Y-%m-%d")
    today_uploads = await db.csv_jobs.count_documents({"user": username, "created_date": today})
    if today_uploads >= DAILY_CSV_LIMIT:
        raise HTTPException(status_code=429, detail=f"Daily CSV upload limit reached ({DAILY_CSV_LIMIT}/{DAILY_CSV_LIMIT})")
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    # Read file content and validate size
    content = await file.read()
    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Parse CSV to extract columns and validate
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text_content = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file. Please use UTF-8 encoding")
    
    try:
        df = pd.read_csv(io.StringIO(text_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to parse CSV file: {str(e)[:100]}")
    
    if len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="CSV has no columns")
    if len(df) == 0:
        raise HTTPException(status_code=400, detail="CSV has no data rows")
    if len(df) > MAX_CSV_ROWS:
        raise HTTPException(status_code=400, detail=f"CSV exceeds {MAX_CSV_ROWS} row limit. Your file has {len(df)} rows")
    
    # Save the file
    user_upload_dir = os.path.join(CSV_UPLOAD_DIR, username)
    os.makedirs(user_upload_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}.csv"
    file_path = os.path.join(user_upload_dir, stored_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create job document
    now = datetime.utcnow()
    job_doc = {
        "user": username,
        "original_filename": file.filename,
        "stored_filename": stored_filename,
        "columns": list(df.columns),
        "row_count": len(df),
        "status": "uploaded",
        "selected_column": None,
        "processed_rows": 0,
        "error_rows": 0,
        "error_details": [],
        "error_message": None,
        "output_filename": None,
        "files_deleted": False,
        "analytics": None,
        "created_at": now.isoformat() + "Z",
        "created_date": today,
        "expires_at": now + timedelta(hours=24)
    }
    
    result = await db.csv_jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)
    
    return {
        "job_id": job_id,
        "columns": list(df.columns),
        "row_count": len(df),
        "filename": file.filename
    }

@app.get("/api/csv/{job_id}/preview")
async def csv_column_preview(job_id: str, column: str, token_payload: dict = Depends(get_current_user_token)):
    """Preview first 5 rows of a selected column."""
    username = token_payload.get("sub")
    db = get_db()
    
    try:
        job = await db.csv_jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="CSV job not found")
    if job["user"] != username:
        raise HTTPException(status_code=403, detail="Access denied")
    if column not in job["columns"]:
        raise HTTPException(status_code=400, detail=f"Column '{column}' does not exist in the CSV")
    
    input_path = os.path.join(CSV_UPLOAD_DIR, username, job["stored_filename"])
    if not os.path.exists(input_path):
        raise HTTPException(status_code=500, detail="Input file not found on server")
    
    try:
        df = pd.read_csv(input_path, nrows=5)
        preview = df[column].fillna("").astype(str).tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read preview: {str(e)[:100]}")
    
    return {"column": column, "preview": preview}

@app.post("/api/csv/{job_id}/predict")
async def csv_predict(job_id: str, request: Request, token_payload: dict = Depends(get_current_user_token)):
    """Start batch prediction for a CSV job. Queues the job for async processing."""
    username = token_payload.get("sub")
    db = get_db()
    
    body = await request.json()
    column = body.get("column")
    if not column:
        raise HTTPException(status_code=400, detail="Column name is required")
    
    try:
        job = await db.csv_jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="CSV job not found")
    if job["user"] != username:
        raise HTTPException(status_code=403, detail="Access denied")
    if job["status"] != "uploaded":
        raise HTTPException(status_code=409, detail="This CSV has already been processed or is currently processing")
    if column not in job["columns"]:
        raise HTTPException(status_code=400, detail=f"Column '{column}' does not exist in the CSV")
    
    # Validate column has text data
    input_path = os.path.join(CSV_UPLOAD_DIR, username, job["stored_filename"])
    if not os.path.exists(input_path):
        raise HTTPException(status_code=500, detail="Input file not found on server")
    
    try:
        df = pd.read_csv(input_path)
        non_empty = df[column].dropna().astype(str).str.strip()
        non_empty = non_empty[non_empty != ""]
        if len(non_empty) == 0:
            raise HTTPException(status_code=400, detail="Selected column has no valid text data")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate column: {str(e)[:100]}")
    
    # Update job with selected column, model, and queue it
    await db.csv_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"selected_column": column, "model": body.get("model", "kriyacore"), "status": "queued"}}
    )
    
    # Add to processing queue
    await csv_job_queue.put(job_id)
    
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Job queued for processing. You will receive an email when it completes."
    }

@app.get("/api/csv/{job_id}/status")
async def csv_job_status(job_id: str, token_payload: dict = Depends(get_current_user_token)):
    """Poll the status of a CSV prediction job."""
    username = token_payload.get("sub")
    db = get_db()
    
    try:
        job = await db.csv_jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="CSV job not found")
    if job["user"] != username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    job["_id"] = str(job["_id"])
    if "expires_at" in job:
        job["expires_at"] = job["expires_at"].isoformat() + "Z" if hasattr(job["expires_at"], "isoformat") else str(job["expires_at"])
    
    return job

@app.get("/api/csv/{job_id}/download")
async def csv_download(job_id: str, token_payload: dict = Depends(get_current_user_token)):
    """Download the output CSV file."""
    username = token_payload.get("sub")
    db = get_db()
    
    try:
        job = await db.csv_jobs.find_one({"_id": ObjectId(job_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="CSV job not found")
    if job["user"] != username:
        raise HTTPException(status_code=403, detail="Access denied")
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job has not completed yet")
    if not job.get("output_filename"):
        raise HTTPException(status_code=500, detail="Output file not found. It may have expired")
    
    output_path = os.path.join(CSV_OUTPUT_DIR, username, job["output_filename"])
    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Output file not found. It may have expired")
    
    download_name = job["original_filename"].replace(".csv", "_predictions.csv")
    return FileResponse(
        path=output_path,
        filename=download_name,
        media_type="text/csv"
    )

@app.get("/api/csv/history")
async def csv_history(token_payload: dict = Depends(get_current_user_token)):
    """Get user's CSV job history."""
    username = token_payload.get("sub")
    db = get_db()
    
    jobs = []
    async for job in db.csv_jobs.find({"user": username}).sort("created_at", -1):
        job["_id"] = str(job["_id"])
        if "expires_at" in job and hasattr(job["expires_at"], "isoformat"):
            job["expires_at"] = job["expires_at"].isoformat() + "Z"
        jobs.append(job)
    
    return jobs

# --- ADMIN CSV ENDPOINTS ---

@app.get("/api/tbxadmin/csv-jobs")
async def get_admin_csv_jobs(admin: dict = Depends(verify_admin)):
    """Get all CSV jobs across all users for admin view."""
    db = get_db()
    jobs = []
    async for job in db.csv_jobs.find().sort("created_at", -1):
        job["_id"] = str(job["_id"])
        if "expires_at" in job and hasattr(job["expires_at"], "isoformat"):
            job["expires_at"] = job["expires_at"].isoformat() + "Z"
        jobs.append(job)
    return jobs

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
