from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=512)
    session_id: Optional[str] = None
    model: Optional[str] = "kriyacore" # "kriyacore" or "kriyasense"

class ReportRequest(BaseModel):
    prediction_id: str
    wrong_field: str  # "sentiment", "emotion", or "both"
    suggested_sentiment: Optional[str] = None
    suggested_emotions: Optional[List[str]] = None
    comment: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    otp: str
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    use_case: Optional[str] = None

class SendOTPRequest(BaseModel):
    email: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    is_blocked: bool = False
    block_message: Optional[str] = None

class DevAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=2000)
    session_id: Optional[str] = None
    model: Optional[str] = "kriyacore"

class BlockUserRequest(BaseModel):
    message: str

class AdminReplyRequest(BaseModel):
    reply_message: str
    status: str # active, replied, unnecessary

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class SettingsUpdate(BaseModel):
    kriyasense_v1_url: str
