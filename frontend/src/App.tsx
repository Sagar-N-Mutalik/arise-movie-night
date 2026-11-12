import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, MapPin, Ticket as TicketIcon, Clock, 
  Film, Music, Coffee, Camera, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CountdownTimer } from './components/CountdownTimer';
import { StudentAuthModal } from './components/StudentAuthModal';
import { CheckoutView } from './components/CheckoutView';
import { TicketView } from './components/TicketView';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { StudentAuthData, TicketData } from './types';
import { getActiveTicket } from './lib/store';

export default function App() {
  // Navigation / View states: 'landing' | 'checkout' | 'ticket' | 'admin'
  const [currentView, setCurrentView] = useState<'landing' | 'checkout' | 'ticket' | 'admin'>('landing');
  
  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<StudentAuthData | null>(null);
  
  // Active Ticket
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    const existing = getActiveTicket();
    if (existing) {
      setActiveTicket(existing);
    }
  }, []);

  const handleOpenAuth = () => {
    setIsAuthOpen(true);
  };

  const handleStudentVerified = (student: StudentAuthData) => {
    setVerifiedStudent(student);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSuccess = (ticket: TicketData) => {
    setActiveTicket(ticket);
    setCurrentView('ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Checkout View
  if (currentView === 'checkout' && verifiedStudent) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onOpenAdmin={() => setCurrentView('admin')}
          onViewTicket={() => setCurrentView('ticket')}
          activeTicket={activeTicket}
        />
        <CheckoutView
          student={verifiedStudent}
          onBack={() => setCurrentView('landing')}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  // If in Digital Ticket View
  if (currentView === 'ticket' && activeTicket) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onOpenAdmin={() => setCurrentView('admin')}
          onViewTicket={() => setCurrentView('ticket')}
          activeTicket={activeTicket}
        />
        <TicketView
          ticket={activeTicket}
          onReturnHome={() => setCurrentView('landing')}
          onOpenScanner={() => setCurrentView('admin')}
        />
      </div>
    );
  }

  // If in Organizer Dashboard View
  if (currentView === 'admin') {
    return (
      <OrganizerDashboard
        onClose={() => setCurrentView('landing')}
        activeTicket={activeTicket}
      />
    );
  }

  // DEFAULT: Landing Page
  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenAdmin={() => setCurrentView('admin')}
        onViewTicket={() => setCurrentView('ticket')}
        activeTicket={activeTicket}
      />

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          
          {/* Ambient Cinema Lighting Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headlines & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-left">
                
                {/* Association Subtitle */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-[11px] font-bold tracking-widest text-[#e6ca65] uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>The NIE-ISE Association Presents</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-white tracking-tight leading-[1.08]">
                  Where the campus <br />
                  <span className="italic text-[#e6ca65] font-serif pr-2">meets</span>
                  cinema.
                </h1>

                {/* Subtext */}
                <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                  An evening of cinema, community and campus memories — exclusively for the NIE student community.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <button
                    onClick={handleOpenAuth}
                    className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base transition-all shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:shadow-[0_0_45px_rgba(59,130,246,0.7)] flex items-center gap-2 group cursor-pointer"
                  >
                    <span>⚡ Book your pass</span>
                  </button>

                  <a
                    href="#experience"
                    className="px-6 py-3.5 rounded-xl text-slate-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5 group cursor-pointer"
                  >
                    <span>Explore the night</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>

                {/* Key Metadata Badges */}
                <div className="pt-8 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>18 NOVEMBER 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>DIAMOND JUBILEE COMPLEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketIcon className="w-4 h-4 text-emerald-400" />
                    <span>₹149 PER PASS</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Cinema Poster Frame */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#111c34] to-[#070b14] p-1.5 border border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] group hover:border-amber-400/60 transition-all">
                  
                  {/* Outer Frame with Gold Corner Accents */}
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-[#03060c] flex flex-col justify-between p-6">
                    
                    {/* Background Cinema Visual */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:opacity-50 transition-opacity"
                      style={{
                        backgroundImage: `radial-gradient(circle at 50% 40%, rgba(30, 58, 138, 0.4) 0%, rgba(3, 6, 12, 0.95) 100%), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop')`
                      }}
                    />

                    {/* Top Poster Header */}
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#e6ca65]">
                          NIE PASS
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                          EXCLUSIVE SCREENING
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-[#e6ca65]">
                        LIMITED 500
                      </div>
                    </div>

                    {/* Center Poster Title */}
                    <div className="relative z-10 text-center space-y-1">
                      <div className="text-[11px] font-mono tracking-widest text-blue-400 uppercase">
                        ANNUAL MOVIE FEST
                      </div>
                      <h3 className="text-3xl font-serif text-white tracking-wider">
                        NIE MOVIE NIGHT
                      </h3>
                      <div className="text-xs text-slate-300 font-serif italic">
                        Diamond Jubilee Auditorium
                      </div>
                    </div>

                    {/* Bottom Date & Entry Stamp */}
                    <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4">
                      <div>
                        <div className="text-4xl font-serif font-bold text-white tracking-tight">
                          18
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[#e6ca65]">
                          NOV 2026
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-mono">DOORS OPEN</div>
                        <div className="text-xs font-bold text-white font-mono">6:00 PM IST</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* REAL-TIME COUNTDOWN SECTION */}
        <CountdownTimer targetDateISO="2026-11-18T18:00:00+05:30" />

        {/* "THE EVENING" SECTION */}
        <section id="experience" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-[#e6ca65] font-semibold block mb-1">
              The Evening
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              More than a screening.
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Come for the film. Stay for the shared experience. A signature night built for the NIE community.
            </p>
          </div>

          {/* 3 Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Doors Open */}
            <div className="p-7 rounded-2xl bg-[#0c1424] border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#e6ca65]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  DOORS OPEN
                </span>
                <h3 className="text-2xl font-serif font-bold text-white mt-1">
                  6:00 PM
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Wednesday, 18 November 2026
                </p>
              </div>
            </div>

            {/* Card 2: The Venue */}
            <div className="p-7 rounded-2xl bg-[#0c1424] border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  THE VENUE
                </span>
                <h3 className="text-xl font-serif font-bold text-white mt-1">
                  Diamond Jubilee Complex
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  South Campus · NIE, Mysuru
                </p>
              </div>
            </div>

            {/* Card 3: Your Pass */}
            <div className="p-7 rounded-2xl bg-[#0c1424] border border-amber-500/30 hover:border-amber-400/50 shadow-[0_0_30px_rgba(230,202,101,0.06)] transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#e6ca65]">
                <TicketIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  YOUR PASS
                </span>
                <h3 className="text-3xl font-serif font-bold text-[#e6ca65] mt-1">
                  ₹ 149
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Non-refundable · Limited capacity · 1 pass/student
                </p>
              </div>
            </div>

          </div>

          {/* Highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
              <Film className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">4K Cinematic Projection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Large-format theater screen with high-lumen clarity installed specially for Movie Night.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
              <Music className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Auditorium Acoustics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tuned surround sound arrays in Diamond Jubilee Hall delivering punchy theater audio.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
              <Coffee className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Snacks & Beverages</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Campus canteen popcorn stalls, snacks, and refreshments ready before curtain call.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">Photo Booth & Memories</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exclusive red-carpet photo zone with custom NIE Movie Night backdrops.
              </p>
            </div>

          </div>

        </section>

        {/* VENUE & LOCATION MAP SECTION */}
        <section id="venue" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#e6ca65] font-semibold block">
                Venue Directions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                Diamond Jubilee Complex
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Located on NIE South Campus, the Diamond Jubilee Complex offers state-of-the-art auditorium seating, ample parking, and fast-track digital QR access gates.
              </p>
              
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Main Entrance Gate A & Gate B dedicated for QR scanning</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Physical NIE Student ID card verification mandatory</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Entry begins at 6:00 PM; screening commences promptly at 6:45 PM</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#0c1424] border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">The National Institute of Engineering</h4>
                    <p className="text-xs text-slate-400">Manandavadi Road, Mysuru, Karnataka 570008</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    South Campus
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-xs space-y-2 text-slate-300">
                  <div className="font-semibold text-white">Important Event Advisory:</div>
                  <p className="text-slate-400 leading-relaxed">
                    All attendees must possess an active, verified NIE PASS QR code. Screenshot sharing or forwarded tickets will be rejected by the scanner system once scanned at the gate.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-[#e6ca65] font-semibold block mb-1">
              Guidelines
            </span>
            <h2 className="text-3xl font-serif text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-5 rounded-xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-semibold text-white">Who can register for NIE Movie Night?</h4>
              <p className="text-slate-400 leading-relaxed">
                Registration is open exclusively to enrolled students of The National Institute of Engineering across all engineering branches (ISE, CSE, AIML, AIDS, ECE, EEE, MECH, CIVIL). Valid <code className="text-[#e6ca65]">@nie.ac.in</code> email authentication is required.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-semibold text-white">Can I book more than 1 ticket?</h4>
              <p className="text-slate-400 leading-relaxed">
                No. To ensure fair access and prevent scalping, the platform enforces a strict limit of exactly one ticket per verified student. Quantity adjustment is hard-locked.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-semibold text-white">How does QR entry verification work at the gate?</h4>
              <p className="text-slate-400 leading-relaxed">
                Event organizers will scan your digital pass QR code using the web scanner. The backend performs an atomic check and permanently marks the ticket as USED. Duplicate scans of the same pass will trigger an immediate red alert.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-semibold text-white">What is the refund and cancellation policy?</h4>
              <p className="text-slate-400 leading-relaxed">
                Tickets are non-refundable. Exceptional circumstances such as event postponement or duplicate billing will be audited by the department committee.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#03060c] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#e6ca65] to-[#8c731f] flex items-center justify-center text-[#060911] font-bold text-sm">
              N
            </div>
            <div>
              <div className="text-sm font-bold text-white">NIE PASS</div>
              <div className="text-[10px] text-slate-400">The National Institute of Engineering, Mysuru</div>
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            Organized by Department of Information Science & Engineering (ISE) · ArISE
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('admin')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Organizer Portal
            </button>
            <span>·</span>
            <span className="text-[#e6ca65] font-semibold">One Campus. Every Event. One Pass.</span>
          </div>

        </div>
      </footer>

      {/* STUDENT AUTHENTICATION MODAL */}
      <StudentAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onVerified={handleStudentVerified}
      />

    </div>
  );
}

