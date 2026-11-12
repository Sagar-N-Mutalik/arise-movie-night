import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "nie_pass.db")

if not os.path.exists(db_path):
    print("Database file does not exist yet.")
    exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Delete records in foreign key dependency order
tables = ["scan_logs", "tickets", "payments", "bookings", "students", "webhook_events"]

for table in tables:
    try:
        cur.execute(f"DELETE FROM {table};")
        print(f"[OK] Cleared table: {table}")
    except sqlite3.OperationalError as e:
        print(f"[SKIP] Table {table}: {e}")

# Reset auto-increment counters
try:
    cur.execute("DELETE FROM sqlite_sequence WHERE name IN ('students', 'bookings', 'payments', 'tickets', 'scan_logs', 'webhook_events');")
    print("[OK] Reset auto-increment ID counters")
except sqlite3.OperationalError:
    pass

conn.commit()
conn.close()
print("\nDatabase has been completely cleared and reset to fresh state!")
