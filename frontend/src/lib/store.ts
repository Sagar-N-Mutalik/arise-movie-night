'use client';

import { TicketData, Branch, ScanResult } from '@/types';

export const INITIAL_TICKETS: TicketData[] = [
  {
    ticketId: 'NIE26-000001',
    bookingId: 'BK-992140',
    fullName: 'Sagar N Mutalik',
    usn: '4NI23IS175',
    branch: 'ISE',
    email: '2023is_sagarmutalik_c@nie.ac.in',
    mobile: '+91 98451 23456',
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload: 'NIE26-000001-SEC-F8A29B',
    status: 'CONFIRMED',
    issuedAt: '2026-11-10T14:32:00Z',
  },
  {
    ticketId: 'NIE26-000002',
    bookingId: 'BK-992141',
    fullName: 'Ananya Rao',
    usn: '4NI22IS008',
    branch: 'ISE',
    email: 'ananyarao@nie.ac.in',
    mobile: '+91 98450 11223',
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload: 'NIE26-000002-SEC-E4C10D',
    status: 'USED',
    issuedAt: '2026-11-10T15:10:00Z',
    scannedAt: '2026-11-18T18:15:22Z',
    scannedBy: 'Organizer Gate A',
  },
  {
    ticketId: 'NIE26-000003',
    bookingId: 'BK-992142',
    fullName: 'Rahul Sharma',
    usn: '4NI22CS094',
    branch: 'CSE',
    email: 'rahul.sharma@nie.ac.in',
    mobile: '+91 99887 66554',
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload: 'NIE26-000003-SEC-A91B33',
    status: 'CONFIRMED',
    issuedAt: '2026-11-11T09:40:00Z',
  },
  {
    ticketId: 'NIE26-000004',
    bookingId: 'BK-992143',
    fullName: 'Pooja Hegde',
    usn: '4NI23EC045',
    branch: 'ECE',
    email: 'pooja.ec@nie.ac.in',
    mobile: '+91 94481 99001',
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload: 'NIE26-000004-SEC-D27E89',
    status: 'USED',
    issuedAt: '2026-11-11T12:05:00Z',
    scannedAt: '2026-11-18T18:22:45Z',
    scannedBy: 'Organizer Gate B',
  },
  {
    ticketId: 'NIE26-000005',
    bookingId: 'BK-992144',
    fullName: 'Karthik V',
    usn: '4NI23AI012',
    branch: 'AIML',
    email: 'karthik.ai@nie.ac.in',
    mobile: '+91 97412 34567',
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload: 'NIE26-000005-SEC-C73A12',
    status: 'CONFIRMED',
    issuedAt: '2026-11-12T10:14:00Z',
  }
];

const STORAGE_KEY = 'nie_pass_tickets_v1';
const CURRENT_TICKET_KEY = 'nie_pass_active_ticket';

export function getTickets(): TicketData[] {
  if (typeof window === 'undefined') return INITIAL_TICKETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading tickets from storage:', err);
    return INITIAL_TICKETS;
  }
}

export function saveTicket(ticket: TicketData): void {
  if (typeof window === 'undefined') return;
  const list = getTickets();
  const existingIdx = list.findIndex(t => t.ticketId === ticket.ticketId);
  if (existingIdx >= 0) {
    list[existingIdx] = ticket;
  } else {
    list.unshift(ticket);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  localStorage.setItem(CURRENT_TICKET_KEY, JSON.stringify(ticket));
}

export function getActiveTicket(): TicketData | null {
  if (typeof window === 'undefined') return INITIAL_TICKETS[0];
  try {
    const raw = localStorage.getItem(CURRENT_TICKET_KEY);
    if (!raw) return INITIAL_TICKETS[0];
    return JSON.parse(raw);
  } catch {
    return INITIAL_TICKETS[0];
  }
}

export function setActiveTicket(ticket: TicketData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_TICKET_KEY, JSON.stringify(ticket));
}

export function verifyAndScanTicket(tokenOrId: string, scannerName = 'Organizer Gate A'): ScanResult {
  const list = getTickets();
  const cleanQuery = tokenOrId.trim();

  // Match by ticketId or QR payload or USN
  const ticketIndex = list.findIndex(t => 
    t.ticketId.toLowerCase() === cleanQuery.toLowerCase() ||
    t.qrPayload.toLowerCase() === cleanQuery.toLowerCase() ||
    t.usn.toLowerCase() === cleanQuery.toLowerCase()
  );

  const nowISO = new Date().toISOString();

  if (ticketIndex === -1) {
    return {
      status: 'INVALID',
      message: `Ticket token "${cleanQuery}" not recognized in database. Entry denied.`,
      timestamp: nowISO,
      scannerName,
    };
  }

  const ticket = list[ticketIndex];

  if (ticket.status === 'USED') {
    return {
      status: 'ALREADY_USED',
      message: `DUPLICATE ENTRY DETECTED! Ticket was already scanned on ${new Date(ticket.scannedAt || nowISO).toLocaleTimeString()} by ${ticket.scannedBy || 'Gate Staff'}.`,
      ticket,
      timestamp: nowISO,
      scannerName,
    };
  }

  if (ticket.status === 'CANCELLED') {
    return {
      status: 'INVALID',
      message: 'This ticket was cancelled or refunded. Entry denied.',
      ticket,
      timestamp: nowISO,
      scannerName,
    };
  }

  // Atomically update ticket to USED
  const updatedTicket: TicketData = {
    ...ticket,
    status: 'USED',
    scannedAt: nowISO,
    scannedBy: scannerName,
  };

  list[ticketIndex] = updatedTicket;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // If it's active ticket, update it
    const active = getActiveTicket();
    if (active && active.ticketId === updatedTicket.ticketId) {
      localStorage.setItem(CURRENT_TICKET_KEY, JSON.stringify(updatedTicket));
    }
  }

  return {
    status: 'VALID',
    message: `ENTRY APPROVED: Welcome ${updatedTicket.fullName}! Pass verified successfully.`,
    ticket: updatedTicket,
    timestamp: nowISO,
    scannerName,
  };
}

export function generateNewTicket(data: {
  fullName: string;
  usn: string;
  branch: Branch;
  email: string;
  mobile: string;
}): TicketData {
  const tickets = getTickets();
  const nextSeq = tickets.length + 1;
  const seqStr = String(nextSeq).padStart(6, '0');
  const ticketId = `NIE26-${seqStr}`;
  const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const qrPayload = `${ticketId}-SEC-${randomHex}`;

  const newTicket: TicketData = {
    ticketId,
    bookingId,
    fullName: data.fullName,
    usn: data.usn.toUpperCase(),
    branch: data.branch,
    email: data.email.toLowerCase(),
    mobile: data.mobile,
    eventName: 'NIE-ISE Movie Night',
    eventDate: '18 Nov 2026 · 6:00 PM',
    venue: 'Diamond Jubilee Complex · South Campus',
    amount: 149,
    qrPayload,
    status: 'CONFIRMED',
    issuedAt: new Date().toISOString(),
  };

  saveTicket(newTicket);
  return newTicket;
}

