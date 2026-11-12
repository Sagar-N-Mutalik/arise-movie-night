# NIE PASS — Digital Event Ticketing & QR Access Management Platform

> **Project:** NIE Movie Night 2026  
> **Institution:** The National Institute of Engineering (NIE), Mysuru  
> **Host Department:** Information Science & Engineering (ISE) · ArISE Association  
> **Venue:** Diamond Jubilee Complex, South Campus, Mysuru  
> **Date:** 18 November 2026 · Doors open 6:00 PM IST  
> **Platform Version:** 1.0.0 (Full-Stack Production Release)  
> **Motto:** *One Campus. Every Event. One Pass.*

---

## 1. Executive Summary

**NIE PASS** is a high-performance, web-based digital event ticketing and gate access management platform built specifically for **NIE Movie Night 2026**. Taking inspiration from BookMyShow's fluid booking experiences, NIE PASS delivers a modern, dark glassmorphic interface coupled with strict academic access controls, server-verified payments, and tamper-proof QR entrance validation.

### Key Objectives Achieved
1. **Zero Manual Ticketing:** Automated student verification, ticket issuance, and gate scanning.
2. **Hard Single-Ticket Limit (BR-02):** Strict constraint ensuring verified students can only book **exactly one non-transferable pass**.
3. **Strict Academic Email Validation:** Real-time frontend and backend regex enforcement (`^[\w\.-]+@nie\.ac\.in$`).
4. **Server-Side Payment Signature Reconciliation:** Razorpay order generation and HMAC-SHA256 signature verification.
5. **Atomic QR Gate Clearance:** Cryptographic token hashing with atomic status transitions (`CONFIRMED` $\to$ `USED`), permanently preventing duplicate entry or screenshot sharing.
6. **Real-Time Organizer Dashboard:** Live attendance tracking, attendee directory, search/filtering, and CSV export.

---

## 2. System Architecture

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (React + Vite + Tailwind CSS)"]
        UI_Landing["Landing Page / Countdown"]
        UI_Gate["Student Gate Modal (Regex + OTP)"]
        UI_Checkout["Checkout View (Single Ticket Quota)"]
        UI_Ticket["Digital Boarding Pass (QR + PDF)"]
        UI_Admin["Organizer Dashboard & Web Scanner"]
    end

    subgraph Gateway ["Payment & Infrastructure"]
        RZP["Razorpay Checkout & Webhooks"]
    end

    subgraph BackendLayer ["Backend Layer (FastAPI Python)"]
        API_Auth["/api/auth (Regex check & OTP)"]
        API_Bookings["/api/bookings (Quota Enforcement)"]
        API_Payments["/api/payments (Signature Verification)"]
        API_Scanner["/api/admin/tickets/verify (Atomic Gate)"]
        API_Admin["/api/admin (Dashboard & Reports)"]
    end

    subgraph DataLayer ["Data Persistence"]
        DB[("PostgreSQL / SQLite (SQLAlchemy ORM)")]
    end

    UI_Landing --> UI_Gate
    UI_Gate --> API_Auth
    API_Auth --> UI_Checkout
    UI_Checkout --> API_Bookings
    API_Bookings --> RZP
    RZP --> API_Payments
    API_Payments --> UI_Ticket
    UI_Admin --> API_Scanner
    API_Scanner --> DB
    API_Payments --> DB
    API_Bookings --> DB
    API_Auth --> DB
    API_Admin --> DB
```

---

## 3. End-to-End Booking & Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as NIE Student
    participant FE as React Frontend (NIE PASS)
    participant BE as FastAPI Backend
    participant RZP as Razorpay Gateway
    participant DB as Database (SQLAlchemy)
    actor Staff as Gate Organizer

    Note over Student,FE: Step 1: Student Verification
    Student->>FE: Enters Name, USN, Branch, Mobile & NIE Email
    FE->>FE: Live regex validation (^[\w\.-]+@nie\.ac\.in$)
    FE->>BE: POST /api/auth/verify-email
    BE-->>FE: 6-Digit OTP Dispatched
    Student->>FE: Enters 6-Digit OTP
    FE->>BE: POST /api/auth/verify-otp
    BE->>DB: Upsert verified Student record
    BE-->>FE: Identity Verified (Token Issued)

    Note over Student,RZP: Step 2: Single-Pass Allocation & Checkout
    Student->>FE: Proceeds to Checkout (Strict 1 Ticket Limit)
    FE->>BE: POST /api/bookings (student_id, quantity=1)
    BE->>DB: Check quota & reserve 1 pass (10m lock)
    BE->>BE: Create Razorpay Order (₹149)
    BE-->>FE: Returns razorpay_order_id
    Student->>RZP: Completes payment (UPI / Card / Netbanking)
    RZP-->>FE: Returns razorpay_payment_id & signature
    FE->>BE: POST /api/payments/verify
    BE->>BE: Verify HMAC-SHA256 signature
    BE->>DB: Atomically mark Booking CONFIRMED
    BE->>DB: Generate Ticket (NIE26-00000X) & salted QR hash
    BE-->>FE: Return Digital Ticket Data

    Note over Student,Staff: Step 3: Event Entrance & QR Gate Verification
    Student->>FE: Displays Digital Pass (QR code) + Physical ID
    Staff->>FE: Scans QR code via Organizer Web Scanner
    FE->>BE: POST /api/admin/tickets/verify (token, scanner_id)
    BE->>DB: Check status in DB
    alt Ticket is CONFIRMED
        BE->>DB: Atomically update status -> USED, record timestamp & gate
        BE-->>Staff: APPROVED (Green) - Attendee Admitted
    else Ticket is already USED
        BE-->>Staff: REJECTED (Amber) - Duplicate Entry Alert
    else Token unrecognized
        BE-->>Staff: REJECTED (Red) - Counterfeit / Invalid Token
    end
```

---

## 4. Ticket Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> RESERVED: Student selects pass (10-min lock)
    RESERVED --> PAYMENT_FAILED: Payment fails / times out
    PAYMENT_FAILED --> [*]: Inventory released
    
    RESERVED --> CONFIRMED: Razorpay signature verified
    CONFIRMED --> USED: Scanned at gate entrance
    CONFIRMED --> CANCELLED: Organizer refund / void
    
    USED --> [*]: Entry granted (Duplicate scans denied)
    CANCELLED --> [*]: Entry permanently denied
```

---

## 5. Entity-Relationship Diagram (Database Design)

```mermaid
erDiagram
    STUDENTS ||--o{ BOOKINGS : places
    STUDENTS ||--o{ TICKETS : owns
    EVENTS ||--o{ BOOKINGS : contains
    BOOKINGS ||--|| PAYMENTS : settles
    BOOKINGS ||--o{ TICKETS : issues
    TICKETS ||--o{ SCAN_LOGS : records

    STUDENTS {
        int id PK
        string full_name
        string email UK
        string usn UK
        string branch
        string mobile
        boolean email_verified
        datetime created_at
    }

    EVENTS {
        string id PK
        string event_name
        string event_date
        string venue
        int ticket_price
        int capacity
        int max_tickets_per_student
        boolean booking_open
        string status
    }

    BOOKINGS {
        int id PK
        string booking_reference UK
        int student_id FK
        string event_id FK
        int quantity
        int total_amount
        string booking_status
        datetime created_at
        datetime expires_at
    }

    PAYMENTS {
        int id PK
        int booking_id FK
        string razorpay_order_id UK
        string razorpay_payment_id
        int amount
        string payment_status
        datetime verified_at
    }

    TICKETS {
        int id PK
        string ticket_reference UK
        int booking_id FK
        int attendee_student_id FK
        string qr_token_hash UK
        string ticket_status
        datetime scanned_at
        string scanned_by
    }

    SCAN_LOGS {
        int id PK
        int ticket_id FK
        string scanner_admin_id
        string scan_result
        datetime scanned_at
    }
```

---

## 6. Business Rules Matrix

| Rule ID | Name | System Enforcement |
| :--- | :--- | :--- |
| **BR-01** | Student Eligibility | Verified against official institution domain regex `^[\w\.-]+@nie\.ac\.in$`. |
| **BR-02** | Single Ticket Limit | Hardcoded quota of **exactly 1 ticket per student**. Adjustment disabled. |
| **BR-03** | Gate Identification | Digital pass QR verification must be paired with official physical NIE Student ID. |
| **BR-04** | Payment Prerequisite | Digital tickets are generated and persisted only after server-side signature validation. |
| **BR-05** | Cryptographic QR Tokens | QR codes encode high-entropy unpredictable tokens; only salted SHA-256 hashes are stored. |
| **BR-06** | One-Time Use Prevention | Successfully scanned tickets are atomically updated from `CONFIRMED` to `USED`. |
| **BR-07** | Capacity Guard | System automatically locks sales once total confirmed bookings reach 500 tickets. |
| **BR-08** | Invalidation of Failures | Failed or expired payment attempts release reserved inventory and never issue tickets. |
| **BR-09** | Refund Transparency | Strict non-refundable policy displayed prior to order initiation and payment. |
| **BR-10** | Organizer Authorization | Gate scanner and administrative monitoring require authenticated credentials. |
| **BR-11** | Sybil Resistance | Unique constraints on student USN and email prevent multiple booking bypasses. |
| **BR-12** | Complete Audit Trail | All gate scan attempts (successful, duplicate, invalid) are timestamped and logged. |

---

## 7. API Specification (FastAPI Monolith)

### Public Student Endpoints
* `POST /api/auth/verify-email`: Validates institution email regex and dispatches OTP.
* `POST /api/auth/verify-otp`: Confirms 6-digit OTP passcode and upserts student profile.
* `POST /api/bookings`: Reserves 1 student pass and validates event capacity.
* `GET /api/bookings/{booking_reference}`: Retrieves booking state and allocated seat.
* `POST /api/payments/create-order`: Generates Razorpay server order.
* `POST /api/payments/verify`: Validates payment signature and triggers ticket creation.
* `POST /api/webhooks/razorpay`: Authoritative webhook reconciliation listener.

### Organizer & Gate Endpoints
* `GET /api/admin/dashboard`: Live stats (capacity, sold, revenue, checked-in, pending).
* `POST /api/admin/tickets/verify`: Real-time atomic gate verification engine.
* `GET /api/admin/bookings`: Full searchable directory with branch and status filtering.
* `GET /api/admin/reports`: Real-time attendance CSV export.

---

## 8. Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js v18+ & npm

### Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run server (Swagger docs available at http://localhost:8000/docs)
python run.py
```

### Frontend Setup (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 9. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | High-performance, zero-bloat SPA |
| **Styling** | Tailwind CSS + Lucide Icons | Dark mode glassmorphic BookMyShow aesthetic |
| **Ticketing & QR** | `qrcode.react` + `html2canvas` + `jsPDF` | Vector QR generation and 1-click PDF passes |
| **Backend** | FastAPI (Python) | High-concurrency async REST framework |
| **ORM & Database**| SQLAlchemy + SQLite / PostgreSQL | Atomic state transitions and robust relational schema |
| **Payment Gateway**| Razorpay API + HMAC Verification | Secure order creation and webhook verification |

---

## 10. Department Credits

* **Organizers:** Department of Information Science & Engineering (ISE)
* **Student Association:** ArISE Student Association
* **Venue:** Diamond Jubilee Complex, The National Institute of Engineering, South Campus, Mysuru

*One Campus. Every Event. One Pass.*

