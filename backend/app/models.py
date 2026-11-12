import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    usn = Column(String(20), unique=True, index=True, nullable=False)
    branch = Column(String(20), nullable=False)
    mobile = Column(String(20), nullable=False)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookings = relationship("Booking", back_populates="student")
    tickets = relationship("Ticket", back_populates="student")


class Event(Base):
    __tablename__ = "events"

    id = Column(String(50), primary_key=True)
    event_name = Column(String(150), nullable=False)
    event_date = Column(String(100), nullable=False)
    venue = Column(String(200), nullable=False)
    ticket_price = Column(Integer, default=149)
    capacity = Column(Integer, default=500)
    max_tickets_per_student = Column(Integer, default=1)
    booking_open = Column(Boolean, default=True)
    status = Column(String(20), default="ACTIVE")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    event_id = Column(String(50), ForeignKey("events.id"), nullable=False)
    quantity = Column(Integer, default=1) # Single ticket rule
    total_amount = Column(Integer, default=149)
    booking_status = Column(String(20), default="PENDING") # PENDING, CONFIRMED, PAYMENT_FAILED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="bookings")
    payment = relationship("Payment", uselist=False, back_populates="booking")
    tickets = relationship("Ticket", back_populates="booking")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    razorpay_order_id = Column(String(100), unique=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    amount = Column(Integer, default=149)
    payment_status = Column(String(20), default="CREATED") # CREATED, SUCCESS, FAILED
    verified_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="payment")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_reference = Column(String(50), unique=True, index=True, nullable=False) # e.g. NIE26-000001
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    attendee_student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    qr_token_hash = Column(String(128), unique=True, index=True, nullable=False)
    ticket_status = Column(String(20), default="CONFIRMED") # CONFIRMED, USED, CANCELLED
    scanned_at = Column(DateTime, nullable=True)
    scanned_by = Column(String(100), nullable=True)

    booking = relationship("Booking", back_populates="tickets")
    student = relationship("Student", back_populates="tickets")
    scan_logs = relationship("ScanLog", back_populates="ticket")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(30), default="ORGANIZER")
    active = Column(Boolean, default=True)


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    scanner_admin_id = Column(String(100), default="Gate A Staff")
    scan_result = Column(String(30), nullable=False) # VALID, ALREADY_USED, INVALID
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="scan_logs")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    provider_event_id = Column(String(100), unique=True, index=True)
    event_type = Column(String(50), nullable=False)
    processing_status = Column(String(20), default="PROCESSED")
    received_at = Column(DateTime, default=datetime.datetime.utcnow)

