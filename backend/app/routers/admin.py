import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Ticket, Booking, ScanLog, Student, Payment
from ..schemas import ScanTicketRequest, ScanResultResponse, DashboardStatsResponse
from ..security import hash_qr_token
from ..config import settings

router = APIRouter(prefix="/admin", tags=["Organizer & QR Scanner"])

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_super_admin_metrics(db: Session = Depends(get_db)):
    seating_capacity = settings.MAX_CAPACITY
    total_registered = db.query(Ticket).count()
    total_entered = db.query(Ticket).filter(Ticket.ticket_status == "USED").count()
    yet_to_come = max(0, total_registered - total_entered)
    total_money_collected = total_registered * settings.TICKET_PRICE_INR

    return {
        "seating_capacity": seating_capacity,
        "total_registered": total_registered,
        "total_entered": total_entered,
        "yet_to_come": yet_to_come,
        "total_money_collected": total_money_collected,
    }

@router.post("/reset-database")
def reset_database(db: Session = Depends(get_db)):
    """Super Admin privilege: resets all tickets, bookings, scan logs, and students to 0."""
    db.query(ScanLog).delete()
    db.query(Ticket).delete()
    db.query(Payment).delete()
    db.query(Booking).delete()
    db.query(Student).delete()
    db.commit()
    return {"status": "SUCCESS", "message": "All attendee registrations, tickets and scan logs reset to 0."}

@router.post("/tickets/verify", response_model=ScanResultResponse)
def verify_and_scan_entrance_ticket(payload: ScanTicketRequest, db: Session = Depends(get_db)):
    raw_query = payload.token.strip()
    now_utc = datetime.datetime.utcnow()
    query_hash = hash_qr_token(raw_query)

    # Find ticket
    ticket = db.query(Ticket).filter(
        (Ticket.ticket_reference == raw_query.upper()) |
        (Ticket.qr_token_hash == query_hash) |
        (Ticket.ticket_reference == raw_query)
    ).first()

    # Also search by USN fallback
    if not ticket:
        student = db.query(Student).filter(Student.usn == raw_query.upper()).first()
        if student and student.tickets:
            ticket = student.tickets[0]

    if not ticket:
        return {
            "status": "INVALID",
            "message": f"Security Alert: QR token '{raw_query}' is invalid or counterfeit. Entry denied.",
            "timestamp": now_utc.isoformat(),
            "scanner_name": payload.scanner_name,
        }

    # Duplicate check
    if ticket.ticket_status == "USED":
        scanned_time = ticket.scanned_at.strftime("%I:%M %p") if ticket.scanned_at else "Earlier"
        return {
            "status": "ALREADY_USED",
            "message": f"DUPLICATE PASS DETECTED: Ticket {ticket.ticket_reference} was ALREADY scanned at {scanned_time} by {ticket.scanned_by or 'Gate Staff'}. Entry denied.",
            "ticket": {
                "ticket_id": ticket.ticket_reference,
                "booking_id": ticket.booking.booking_reference,
                "full_name": ticket.student.full_name,
                "usn": ticket.student.usn,
                "branch": ticket.student.branch,
                "email": ticket.student.email,
                "event_name": settings.EVENT_NAME,
                "event_date": settings.EVENT_DATE,
                "venue": settings.EVENT_VENUE,
                "amount": ticket.booking.total_amount,
                "qr_payload": raw_query,
                "status": "USED",
                "issued_at": ticket.booking.created_at.isoformat(),
                "scanned_at": ticket.scanned_at.isoformat() if ticket.scanned_at else None,
                "scanned_by": ticket.scanned_by,
            },
            "timestamp": now_utc.isoformat(),
            "scanner_name": payload.scanner_name,
        }

    # Mark as USED atomically
    ticket.ticket_status = "USED"
    ticket.scanned_at = now_utc
    ticket.scanned_by = payload.scanner_name

    # Add audit log
    scan_log = ScanLog(
        ticket_id=ticket.id,
        scanner_admin_id=payload.scanner_name,
        scan_result="VALID",
        scanned_at=now_utc,
    )
    db.add(scan_log)
    db.commit()
    db.refresh(ticket)

    return {
        "status": "VALID",
        "message": f"ENTRY APPROVED: Welcome {ticket.student.full_name}! Digital pass verified.",
        "ticket": {
            "ticket_id": ticket.ticket_reference,
            "booking_id": ticket.booking.booking_reference,
            "full_name": ticket.student.full_name,
            "usn": ticket.student.usn,
            "branch": ticket.student.branch,
            "email": ticket.student.email,
            "event_name": settings.EVENT_NAME,
            "event_date": settings.EVENT_DATE,
            "venue": settings.EVENT_VENUE,
            "amount": ticket.booking.total_amount,
            "qr_payload": raw_query,
            "status": "USED",
            "issued_at": ticket.booking.created_at.isoformat(),
            "scanned_at": ticket.scanned_at.isoformat(),
            "scanned_by": ticket.scanned_by,
        },
        "timestamp": now_utc.isoformat(),
        "scanner_name": payload.scanner_name,
    }

@router.get("/bookings")
def get_all_bookings(
    search: str = Query(None),
    branch: str = Query("ALL"),
    status: str = Query("ALL"),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket).join(Student)
    
    if branch != "ALL":
        query = query.filter(Student.branch == branch)
    if status != "ALL":
        query = query.filter(Ticket.ticket_status == status)
    
    tickets = query.all()
    
    results = []
    for t in tickets:
        if search:
            s_low = search.lower()
            if (s_low not in t.student.full_name.lower() and
                s_low not in t.student.usn.lower() and
                s_low not in t.ticket_reference.lower() and
                s_low not in t.student.email.lower()):
                continue

        results.append({
            "ticket_id": t.ticket_reference,
            "booking_id": t.booking.booking_reference,
            "full_name": t.student.full_name,
            "usn": t.student.usn,
            "branch": t.student.branch,
            "email": t.student.email,
            "status": t.ticket_status,
            "amount": t.booking.total_amount,
            "issued_at": t.booking.created_at.isoformat(),
            "scanned_at": t.scanned_at.isoformat() if t.scanned_at else None,
            "scanned_by": t.scanned_by,
        })

    return results
