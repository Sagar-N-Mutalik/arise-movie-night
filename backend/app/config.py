import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from backend/.env if present
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "ArISE 2026 - Movie Night"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nie_pass.db")
    
    EVENT_ID: str = "EVT-ARISE-2026"
    EVENT_NAME: str = "ArISE 2026 Movie Night"
    EVENT_DATE: str = "18 November 2026"
    EVENT_VENUE: str = "Diamond Jubilee Complex, South Campus, NIE Mysuru"
    TICKET_PRICE_INR: int = int(os.getenv("TICKET_PRICE_INR", "49"))
    MAX_CAPACITY: int = 500
    MAX_TICKETS_PER_STUDENT: int = 1  # Hard single-ticket rule
    
    # Allows official @nie.ac.in emails or standard valid emails
    EMAIL_REGEX_PATTERN: str = os.getenv("EMAIL_REGEX_PATTERN", r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$")
    
    # Razorpay Credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_NIEPASS2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_razorpay_secret_key_8829")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret_9918")
    
    # SMTP Email Credentials for Real OTP Delivery
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "")

settings = Settings()
