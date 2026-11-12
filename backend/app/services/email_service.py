import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # e.g. youremail@gmail.com
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # e.g. 16-character Google App Password
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "arise2026@nie.ac.in")

def send_real_otp_email(to_email: str, otp_code: str, student_name: str = "Student") -> tuple[bool, str]:
    """
    Sends actual email with 6-digit OTP code to the student.
    Uses TLS encryption over port 587.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL SERVICE WARNING] SMTP_USER or SMTP_PASSWORD not set in .env.")
        print(f"[OTP DISPATCHED TO CONSOLE] Email: {to_email} | OTP: {otp_code}")
        return False, "SMTP credentials not configured in backend/.env. Check console for OTP."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"ArISE 2026 Movie Night - Verification Code: {otp_code}"
        msg["From"] = f"ArISE 2026 <{SMTP_FROM}>"
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

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        server.quit()

        print(f"[REAL EMAIL SENT SUCCESSFULLY] Transmitted OTP {otp_code} to {to_email}")
        return True, f"Verification code sent directly to {to_email}"
    except Exception as e:
        print(f"[EMAIL SENDING ERROR] {str(e)}")
        return False, f"Failed to send email via SMTP: {str(e)}"

