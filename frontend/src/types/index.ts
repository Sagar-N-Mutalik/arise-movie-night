export type Branch = 
  | 'ISE' 
  | 'CSE' 
  | 'ECE' 
  | 'EEE' 
  | 'MECH' 
  | 'CIVIL' 
  | 'AIML' 
  | 'AIDS';

export interface StudentAuthData {
  id: number;          // Backend student.id — required to create booking
  fullName: string;
  usn: string;
  email: string;
  branch: Branch;
  mobile: string;
}

export type TicketStatus = 'CONFIRMED' | 'USED' | 'CANCELLED';

export interface TicketData {
  ticketId: string;
  bookingId: string;
  fullName: string;
  usn: string;
  branch: Branch;
  email: string;
  mobile: string;
  eventName: string;
  eventDate: string;
  venue: string;
  amount: number;
  qrPayload: string;
  status: TicketStatus;
  issuedAt: string;
  scannedAt?: string;
  scannedBy?: string;
}

export interface ScanResult {
  status: 'VALID' | 'ALREADY_USED' | 'INVALID';
  message: string;
  ticket?: TicketData;
  timestamp: string;
  scannerName: string;
}

export interface EventDetails {
  title: string;
  subtitle: string;
  association: string;
  dateStr: string;
  doorsOpenStr: string;
  venue: string;
  venueSubtitle: string;
  ticketPrice: number;
  totalCapacity: number;
  ticketsSold: number;
  eventDateISO: string; // "2026-11-18T18:00:00"
}

