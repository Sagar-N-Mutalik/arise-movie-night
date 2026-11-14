import re
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from .config import settings

class EmailVerifyRequest(BaseModel):
    email: str = Field(..., example="2023is_sagarmutalik_c@nie.ac.in")

    @field_validator("email")
    def validate_nie_email(cls, v: str) -> str:
        clean_email = v.strip().lower()
        if not re.match(settings.EMAIL_REGEX_PATTERN, clean_email):
            raise ValueError(f"Invalid email address: '{clean_email}'. Please provide a valid email.")
        return clean_email


class OTPVerifyRequest(BaseModel):
    full_name: str
    usn: str
    branch: str
    mobile: str
    email: str
    otp_code: str = Field(..., min_length=4, max_length=6)

    @field_validator("email")
    def validate_nie_email(cls, v: str) -> str:
        clean_email = v.strip().lower()
        if not re.match(settings.EMAIL_REGEX_PATTERN, clean_email):
            raise ValueError(f"Invalid email address: '{clean_email}'. Please provide a valid email.")
        return clean_email

    @field_validator("usn")
    def validate_usn(cls, v: str) -> str:
        return v.strip().upper()


class CreateOrderRequest(BaseModel):
    student_id: int
    quantity: int = Field(default=1, le=1, ge=1, description="Single ticket hard limit")


class PaymentVerifyRequest(BaseModel):
    booking_reference: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class ScanTicketRequest(BaseModel):
    token: str = Field(..., description="Ticket reference or raw QR token")
    scanner_name: Optional[str] = "Gate Scanner Staff"


class TicketResponse(BaseModel):
    ticket_id: str
    booking_id: str
    full_name: str
    usn: str
    branch: str
    email: str
    event_name: str
    event_date: str
    venue: str
    amount: int
    qr_payload: str
    status: str
    issued_at: str
    scanned_at: Optional[str] = None
    scanned_by: Optional[str] = None


class ScanResultResponse(BaseModel):
    status: str # VALID, ALREADY_USED, INVALID
    message: str
    ticket: Optional[TicketResponse] = None
    timestamp: str
    scanner_name: str


class DashboardStatsResponse(BaseModel):
    seating_capacity: int
    total_registered: int
    total_entered: int
    yet_to_come: int
    total_money_collected: int
