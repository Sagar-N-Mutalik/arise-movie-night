import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .config import settings
from .routers import auth, bookings, payments, admin, webhooks
from .models import Event

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Official Digital Event Ticketing & QR Access Management Platform for NIE Movie Night 2026."
)

# Enable CORS for frontend Vite/React access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def init_event_data():
    """Ensure event record exists, database starts empty from 0 registrations."""
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == settings.EVENT_ID).first()
        if not event:
            event = Event(
                id=settings.EVENT_ID,
                event_name=settings.EVENT_NAME,
                event_date=settings.EVENT_DATE,
                venue=settings.EVENT_VENUE,
                ticket_price=settings.TICKET_PRICE_INR,
                capacity=settings.MAX_CAPACITY,
                max_tickets_per_student=settings.MAX_TICKETS_PER_STUDENT,
                booking_open=True,
                status="ACTIVE"
            )
            db.add(event)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "ONLINE",
        "event": settings.EVENT_NAME,
        "date": settings.EVENT_DATE,
        "venue": settings.EVENT_VENUE,
        "ticket_price_inr": settings.TICKET_PRICE_INR,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
