'use client';

import React from 'react';
import { Lock, Ticket, Sparkles } from 'lucide-react';
import { TicketData } from '@/types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onViewTicket: () => void;
  activeTicket: TicketData | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenAdmin,
  onViewTicket,
  activeTicket,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#060911]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Subtitle */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#e6ca65] via-[#d4af37] to-[#8c731f] flex items-center justify-center text-[#060911] font-bold text-xl shadow-[0_0_15px_rgba(230,202,101,0.35)] transition-transform group-hover:scale-105">
            N
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-widest text-base text-white">NIE PASS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                2026
              </span>
            </div>
            <span className="text-[10px] tracking-widest text-slate-400 font-medium uppercase">
              NIE-ISE MOVIE NIGHT / 2026
            </span>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#experience" className="hover:text-amber-300 transition-colors">
            The experience
          </a>
          <a href="#venue" className="hover:text-amber-300 transition-colors">
            Venue
          </a>
          <a href="#schedule" className="hover:text-amber-300 transition-colors">
            Schedule
          </a>
          <a href="#faq" className="hover:text-amber-300 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Active Ticket Pill (if student already has one) */}
          {activeTicket && (
            <button
              onClick={onViewTicket}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Pass #{activeTicket.ticketId.slice(-4)}</span>
            </button>
          )}

          {/* Exclusive Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-[#e6ca65] tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e6ca65] animate-ping" />
            <span>Exclusive · NIE Students</span>
          </div>

          {/* Admin Lock Button */}
          <button
            onClick={onOpenAdmin}
            title="Organizer Gate & Scanner Portal"
            className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Main CTA */}
          <button
            onClick={onOpenAuth}
            className="relative group overflow-hidden px-4 sm:px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 relative z-10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Book Pass</span>
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};

