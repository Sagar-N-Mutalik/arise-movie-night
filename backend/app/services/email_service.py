import os
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Ensure backend/.env is loaded
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=backend_dir / ".env")
load_dotenv()

def get_smtp_settings():
    # Always reload .env with override=True so changes take effect immediately
    backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=backend_env, override=True)
    load_dotenv(override=True)

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_addr = os.getenv("SMTP_FROM", "").strip() or user or "arise2026@nie.ac.in"
    return host, port, user, password, from_addr

def send_real_otp_email(to_email: str, otp_code: str, student_name: str = "Student") -> tuple[bool, str]:
    """
    Sends actual email with 6-digit OTP code to the student.
    Uses TLS encryption over port 587 (or SSL if port 465).
    """
    host, port, user, password, from_addr = get_smtp_settings()

    if not user or not password:
        warning_msg = "SMTP credentials (SMTP_USER / SMTP_PASSWORD) are not configured in backend/.env."
        print(f"[EMAIL SERVICE WARNING] {warning_msg}")
        print(f"[OTP DISPATCHED TO CONSOLE FOR DEV] Email: {to_email} | OTP: {otp_code}")
        return False, warning_msg

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"ArISE 2026 Movie Night - Verification Code: {otp_code}"
        msg["From"] = f"ArISE 2026 <{from_addr}>"
        msg["To"] = to_email

        text_body = f"""Hello {student_name},

Your verification code for ArISE 2026 Movie Night is: {otp_code}

This one-time passcode is valid for 10 minutes. Please enter this code on the registration page to complete your identity verification.

Venue: Diamond Jubilee Complex, South Campus, NIE Mysuru
Date: 18 November 2026

Department of Information Science & Engineering (ISE)
The National Institute of Engineering, Mysuru
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #060911; color: #f1f5f9; padding: 20px; }}
    .card {{ max-width: 500px; margin: 0 auto; background: #0c1424; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; }}
    .header {{ font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #e6ca65; font-weight: bold; }}
    .title {{ font-size: 24px; color: #ffffff; margin-top: 8px; font-weight: bold; }}
    .otp-box {{ background: #111d35; border: 1px solid #2563eb; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }}
    .otp-code {{ font-size: 32px; letter-spacing: 8px; font-family: monospace; color: #e6ca65; font-weight: bold; }}
    .note {{ font-size: 12px; color: #94a3b8; line-height: 1.6; }}
    .footer {{ font-size: 10px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid #1e293b; padding-top: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">ArISE 2026 · Official Verification</div>
    <div class="title">Verify Your Student Pass</div>
    <p class="note">Hello {student_name}, please use the 6-digit access code below to verify your student email for NIE Movie Night 2026.</p>
    
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    
    <p class="note">This code is valid for 10 minutes. If you did not initiate this request, please contact your department coordinator.</p>
    
    <div class="footer">
      Diamond Jubilee Complex · South Campus, NIE Mysuru<br/>
      Department of Information Science & Engineering (ISE)
    </div>
  </div>
</body>
</html>"""

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=12)
            server.ehlo()
        else:
            server = smtplib.SMTP(host, port, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(user, password)
        server.sendmail(from_addr, [to_email], msg.as_string())
        server.quit()

        print(f"[REAL EMAIL SENT SUCCESSFULLY] Transmitted OTP {otp_code} to {to_email}")
        return True, f"Verification code sent directly to {to_email}"
    except Exception as e:
        print(f"[EMAIL SENDING ERROR] {str(e)}")
        return False, f"Failed to send email via SMTP: {str(e)}"

