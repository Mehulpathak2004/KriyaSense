import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your_email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your_app_password")

def send_email(to_email: str, subject: str, html_content: str):
    # If using placeholders, just print to console for development
    if SMTP_USERNAME == "your_email@gmail.com" or not SMTP_USERNAME:
        print(f"--- MOCK EMAIL TO: {to_email} ---")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}")
        print("---------------------------------")
        return True

    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

def send_otp_email(to_email: str, otp: str):
    subject = "Verify your KriyaSense Account"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3da8b0;">Welcome to KriyaSense!</h2>
        <p>Thank you for signing up. Please use the following code to verify your account:</p>
        <div style="font-size: 24px; font-weight: bold; color: #3da8b0; padding: 10px; background: #f4f4f4; border-radius: 5px; text-align: center; margin: 20px 0;">
            {otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Thanks,<br/>The KriyaSense Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_welcome_email(to_email: str, username: str):
    subject = "Welcome to KriyaSense!"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3da8b0;">Hi {username},</h2>
        <p>Thank you for creating an account with KriyaSense. Your account has been verified successfully.</p>
        <p>You can now explore all the features of our platform, including our advanced sentiment and emotion analysis.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Thanks,<br/>The KriyaSense Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_block_notice(to_email: str, message: str):
    subject = "Account Suspended - KriyaSense"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Notice of Suspension</h2>
        <p>Your KriyaSense API access has been suspended by an administrator.</p>
        <p><strong>Reason:</strong> {message}</p>
        <p>If you believe this is a mistake, please contact our support team.</p>
        <p>Thanks,<br/>The KriyaSense Admin Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_unblock_notice(to_email: str):
    subject = "Account Restored - KriyaSense"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Access Restored</h2>
        <p>Your KriyaSense API access has been restored. You can now use your API keys normally.</p>
        <p>Thanks,<br/>The KriyaSense Admin Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_contact_reply(to_email: str, admin_reply: str, original_message: str):
    subject = "Re: Your KriyaSense Inquiry"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <p>Hello,</p>
        <p>{admin_reply}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="color: #666; font-size: 12px;"><strong>Original Message:</strong><br/>{original_message}</p>
        <p>Thanks,<br/>The KriyaSense Support Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_csv_job_complete(to_email: str, username: str, filename: str, processed_rows: int, error_rows: int, status: str):
    is_success = status == "completed"
    subject = f"CSV Batch Job {'Completed' if is_success else 'Failed'} — KriyaSense"
    status_color = "#10b981" if is_success else "#ef4444"
    status_text = "Completed Successfully" if is_success else "Failed"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: {status_color};">CSV Batch Prediction {status_text}</h2>
        <p>Hi {username},</p>
        <p>Your batch prediction job has {status_text.lower()}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">File</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">{filename}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Rows Processed</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">{processed_rows}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Errors</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: {'#ef4444' if error_rows > 0 else '#10b981'};">{error_rows}</td></tr>
        </table>
        <p>Log in to your dashboard to download the results. Output files are available for <strong>24 hours</strong>.</p>
        <p>Thanks,<br/>The KriyaSense Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_csv_job_failed(to_email: str, username: str, filename: str, error_message: str):
    subject = "CSV Batch Job Failed — KriyaSense"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">CSV Batch Prediction Failed</h2>
        <p>Hi {username},</p>
        <p>Unfortunately, your batch prediction job for <strong>{filename}</strong> has failed.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <strong style="color: #ef4444;">Error:</strong> <span style="color: #991b1b;">{error_message}</span>
        </div>
        <p>Please check your CSV file and try again. If the issue persists, contact our support team.</p>
        <p>Thanks,<br/>The KriyaSense Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)

def send_password_reset_email(to_email: str, otp: str):
    subject = "Reset your KriyaSense Password"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3da8b0;">Password Reset Request</h2>
        <p>We received a request to reset your password. Please use the following code to proceed:</p>
        <div style="font-size: 24px; font-weight: bold; color: #3da8b0; padding: 10px; background: #f4f4f4; border-radius: 5px; text-align: center; margin: 20px 0;">
            {otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Thanks,<br/>The KriyaSense Team</p>
    </div>
    """
    return send_email(to_email, subject, html_content)
