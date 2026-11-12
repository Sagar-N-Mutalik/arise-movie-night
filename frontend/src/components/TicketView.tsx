'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, ArrowLeft, ShieldCheck, Share2, ScanLine, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TicketData } from '@/types';

interface TicketViewProps {
  ticket: TicketData;
  onReturnHome: () => void;
  onOpenScanner: () => void;
}

export const TicketView: React.FC<TicketViewProps> = ({
  ticket,
  onReturnHome,
  onOpenScanner,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e6ca65', '#3b82f6', '#10b981', '#ffffff'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#060911',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [140, 210],
      });

      pdf.addImage(imgData, 'PNG', 10, 10, 190, 120);
      pdf.save(`${ticket.ticketId}_NIE_MovieNight_Pass.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback window print
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `🎟️ My NIE Movie Night 2026 Pass: ${ticket.ticketId} | Verified for ${ticket.fullName}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Success Badge */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Check className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
          Booking Confirmed
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight mt-1">
          Welcome to the <span className="italic text-[#e6ca65]">main event.</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md">
          Your pass is verified. Present this QR at the entrance with your student ID.
        </p>
      </div>

      {/* LUXURY BOARDING PASS TICKET CARD */}
      <div className="w-full max-w-2xl relative mb-8">
        
        <div
          ref={ticketRef}
          className="relative rounded-2xl bg-[#0c1424] border border-slate-700/70 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Gold Accent Vertical Left Stripe */}
          <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-[#e6ca65] via-blue-500 to-indigo-600" />

          <div className="pl-6 sm:pl-8 pr-6 sm:pr-8 pt-6 sm:pt-8 pb-6">
            
            {/* Ticket Header */}
            <div className="flex items-start justify-between border-b border-white/5 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e6ca65] block">
                  NIE PASS · {ticket.status}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
                  {ticket.eventName}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Exclusive Screening · Student Community
                </div>
              </div>

              {/* Date Box */}
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                  18
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  NOV 2026
                </div>
              </div>
            </div>

            {/* Perforation Line with Notches */}
            <div className="relative my-6">
              <div className="ticket-notch-left -top-3.5" />
              <div className="ticket-notch-right -top-3.5" />
              <div className="border-b border-dashed border-slate-700/80 w-full" />
            </div>

            {/* Ticket Body: Attendee & QR Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Attendee Info */}
              <div className="sm:col-span-7 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    ATTENDEE
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                    {ticket.fullName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      USN · BRANCH
                    </span>
                    <div className="text-xs font-mono text-slate-200 mt-0.5 font-semibold">
                      {ticket.usn} · {ticket.branch}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      BOOKING ID
                    </span>
                    <div className="text-xs font-mono text-slate-300 mt-0.5">
                      {ticket.bookingId}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    TICKET ID
                  </span>
                  <div className="text-sm font-mono font-bold text-blue-400 mt-0.5">
                    {ticket.ticketId}
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-white shadow-xl">
                <div className="p-1">
                  <QRCodeSVG
                    value={ticket.qrPayload}
                    size={135}
                    level="H"
                    includeMargin={false}
                    fgColor="#060911"
                    bgColor="#ffffff"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900 mt-1.5">
                  SCAN AT ENTRY
                </span>
              </div>

            </div>

            {/* Bottom Footer Bar */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Diamond Jubilee Complex · South Campus</span>
              </span>
              <span className="font-medium text-amber-300/90">
                Valid for one entry · Non-transferable
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
        
        {/* Download PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
        </button>

        {/* Test in Scanner */}
        <button
          onClick={onOpenScanner}
          className="py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          title="Verify entrance in Organizer Scanner"
        >
          <ScanLine className="w-4 h-4 text-[#e6ca65]" />
          <span>Test in Scanner</span>
        </button>

        {/* Share / Copy */}
        <button
          onClick={handleShare}
          className="py-3 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center cursor-pointer"
          title="Share Pass Details"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Return to Event */}
        <button
          onClick={onReturnHome}
          className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
        >
          Return to event
        </button>
      </div>

      {copiedLink && (
        <div className="mt-2 text-xs text-emerald-400 animate-in fade-in">
          Ticket details copied to clipboard!
        </div>
      )}

      {/* Disclaimers matching screenshot */}
      <p className="text-[11px] text-slate-400 text-center mt-6">
        PDF generation, email delivery, and payment gateway are configured for this release.
      </p>

    </div>
  );
};

