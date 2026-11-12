'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Search, CheckCircle2, XCircle, AlertTriangle, 
  Users, Ticket, IndianRupee, ScanLine, Camera, Download, 
  RefreshCw, Check, ShieldAlert, Activity, Database, Radio
} from 'lucide-react';
import { TicketData, ScanResult, Branch } from '@/types';
import { getTickets, verifyAndScanTicket } from '@/lib/store';

interface OrganizerDashboardProps {
  onClose: () => void;
  activeTicket?: TicketData | null;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  onClose,
  activeTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'attendees' | 'api'>('scanner');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannerLogs, setScannerLogs] = useState<ScanResult[]>([]);

  // Refresh ticket list from store
  const refreshData = () => {
    const list = getTickets();
    setTickets([...list]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Live Metrics
  const totalCapacity = 500;
  const ticketsSold = tickets.length;
  const totalRevenue = ticketsSold * 149;
  const checkedInCount = tickets.filter(t => t.status === 'USED').length;
  const remainingExpected = ticketsSold - checkedInCount;

  // Camera toggle handler
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Camera access error or permission denied:', err);
        alert('Camera access unavailable or permission denied. You can use the Quick Simulation Scanners below to test instant gate validation.');
      }
    }
  };

  // Perform Verification
  const executeScan = (tokenToScan: string) => {
    if (!tokenToScan.trim()) return;
    const result = verifyAndScanTicket(tokenToScan, 'Gate A - Scanner 01');
    setScanResult(result);
    setScannerLogs(prev => [result, ...prev].slice(0, 10));
    setScanInput('');
    refreshData();
  };

  // Quick Simulation Scanners
  const handleScanValid = () => {
    // Pick active ticket or first confirmed ticket
    const confirmed = tickets.find(t => t.status === 'CONFIRMED');
    if (confirmed) {
      executeScan(confirmed.ticketId);
    } else if (activeTicket) {
      executeScan(activeTicket.ticketId);
    } else {
      executeScan('NIE26-000001');
    }
  };

  const handleScanAlreadyUsed = () => {
    const used = tickets.find(t => t.status === 'USED');
    if (used) {
      executeScan(used.ticketId);
    } else {
      executeScan('NIE26-000002');
    }
  };

  const handleScanInvalid = () => {
    executeScan('INVALID-TOKEN-999999');
  };

  // Filtered Attendees
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === 'ALL' || t.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Booking ID', 'Student Name', 'USN', 'Branch', 'Email', 'Mobile', 'Status', 'Scanned At', 'Scanned By'];
    const rows = tickets.map(t => [
      t.ticketId,
      t.bookingId,
      `"${t.fullName}"`,
      t.usn,
      t.branch,
      t.email,
      t.mobile,
      t.status,
      t.scannedAt || 'N/A',
      t.scannedBy || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NIE_MovieNight_2026_Attendees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
                  Diamond Jubilee Complex
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Gate Control
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-0.5">
                Organizer & QR Access Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 5 Real-Time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          
          <div className="p-4 rounded-xl bg-[#0c1424] border border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Capacity
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {totalCapacity}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Diamond Jubilee Hall</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1424] border border-blue-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Tickets Sold
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {ticketsSold}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {Math.round((ticketsSold / totalCapacity) * 100)}% Booked
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1424] border border-amber-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#e6ca65]">
              Total Revenue
            </div>
            <div className="text-2xl font-bold font-mono text-[#e6ca65] mt-1">
              ₹ {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Razorpay Auto-Reconciled</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1424] border border-emerald-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Checked-In
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {checkedInCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Admitted through Gate</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1424] border border-indigo-500/20 col-span-2 lg:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Expected Remaining
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
              {remainingExpected}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pending Arrival</div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'scanner'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>QR Entrance Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('attendees')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'attendees'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bookings & Attendance ({filteredTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'api'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>FastAPI & Razorpay Diagnostics</span>
          </button>
        </div>

        {/* TAB 1: QR ENTRANCE SCANNER */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Viewfinder Column */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="relative rounded-2xl bg-black border border-slate-700/80 overflow-hidden aspect-[4/3] flex flex-col items-center justify-center shadow-2xl">
                
                {/* Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />

                {/* Laser scan animation line */}
                <div className="scanner-laser" />

                {/* Overlay Reticle */}
                <div className="relative z-10 w-64 h-64 border-2 border-dashed border-emerald-400/70 rounded-2xl flex flex-col items-center justify-between p-4 pointer-events-none shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <div className="w-full flex justify-between text-emerald-400">
                    <span className="text-[10px] font-mono tracking-widest">GATE-A</span>
                    <span className="text-[10px] font-mono tracking-widest">OPTICAL</span>
                  </div>
                  <div className="text-center text-xs text-emerald-400/80 font-mono">
                    ALIGN STUDENT QR HERE
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    DIAMOND JUBILEE GATE
                  </div>
                </div>

                {/* Camera Toggle Button */}
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    onClick={toggleCamera}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>{isCameraActive ? 'Disable Camera' : 'Enable Device Camera'}</span>
                  </button>
                </div>
              </div>

              {/* Manual Entry or Barcode Gun Input */}
              <div className="p-4 rounded-xl bg-[#0c1424] border border-slate-800/80 space-y-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Scan Input / USB Scanner Gun / Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeScan(scanInput)}
                    placeholder="Enter Ticket ID (e.g. NIE26-000001) or QR token"
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => executeScan(scanInput)}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Verify Pass
                  </button>
                </div>

                {/* Instant Simulation Test Buttons */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                    Quick Simulation Test Scenarios
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleScanValid}
                      className="py-2 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      ✓ Valid Ticket
                    </button>
                    <button
                      onClick={handleScanAlreadyUsed}
                      className="py-2 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      ⚠️ Duplicate (Already Used)
                    </button>
                    <button
                      onClick={handleScanInvalid}
                      className="py-2 px-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      ✕ Invalid Token
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Scan Outcome & History Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Scan Verification Result Banner */}
              {scanResult ? (
                <div className={`p-6 rounded-2xl border backdrop-blur-xl animate-in zoom-in-95 duration-200 ${
                  scanResult.status === 'VALID'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
                    : scanResult.status === 'ALREADY_USED'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                    : 'bg-red-950/40 border-red-500/40 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.25)]'
                }`}>
                  <div className="flex items-start gap-3.5">
                    {scanResult.status === 'VALID' && (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    )}
                    {scanResult.status === 'ALREADY_USED' && (
                      <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                    )}
                    {scanResult.status === 'INVALID' && (
                      <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                    )}

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {scanResult.status === 'VALID' ? 'ENTRY APPROVED' : 'ENTRY REJECTED'}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-0.5">
                        {scanResult.status === 'VALID' && 'Valid NIE Student Pass'}
                        {scanResult.status === 'ALREADY_USED' && 'Duplicate Ticket Attempt'}
                        {scanResult.status === 'INVALID' && 'Counterfeit or Unrecognized'}
                      </h3>
                      <p className="text-xs mt-1.5 leading-relaxed">
                        {scanResult.message}
                      </p>
                    </div>
                  </div>

                  {scanResult.ticket && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Student:</span>
                        <span className="font-semibold text-white">{scanResult.ticket.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">USN & Branch:</span>
                        <span className="font-mono text-white">{scanResult.ticket.usn} · {scanResult.ticket.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ticket ID:</span>
                        <span className="font-mono text-[#e6ca65]">{scanResult.ticket.ticketId}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#0c1424] border border-slate-800 text-center text-slate-400 text-xs">
                  <ScanLine className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  Ready to scan entrance tickets. Point scanner or click a test scenario on the left.
                </div>
              )}

              {/* Recent Scan History */}
              <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/80 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recent Scan Logs
                </h4>
                
                {scannerLogs.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    No recent scans yet this session.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {scannerLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'VALID' ? 'bg-emerald-400' :
                            log.status === 'ALREADY_USED' ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          <span className="font-mono font-semibold text-white">
                            {log.ticket?.ticketId || 'UNKNOWN'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {log.ticket?.fullName || 'Unregistered'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: BOOKINGS & ATTENDANCE DIRECTORY */}
        {activeTab === 'attendees' && (
          <div className="space-y-5">
            
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-xl bg-[#0c1424] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, USN, Ticket ID..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Branch filter */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Branches</option>
                  <option value="ISE">ISE</option>
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="AIDS">AIDS</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>

                {/* Status filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">CONFIRMED (Unused)</option>
                  <option value="USED">USED (Checked In)</option>
                </select>
              </div>

            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0c1424] overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">USN & Branch</th>
                    <th className="py-3 px-4">Institution Email</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Gate Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {filteredTickets.map((t) => (
                    <tr key={t.ticketId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {t.ticketId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {t.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {t.usn} · <span className="text-amber-300">{t.branch}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {t.email}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-mono font-semibold">
                        ₹ {t.amount}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                          t.status === 'USED'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {t.status === 'USED' ? 'USED (Admitted)' : 'CONFIRMED (Valid)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => executeScan(t.ticketId)}
                            className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Mark Checked-In
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(t.scannedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTickets.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No attendees matching current query.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: FASTAPI & RAZORPAY BACKEND DIAGNOSTICS */}
        {activeTab === 'api' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e6ca65] flex items-center gap-2">
                <Activity className="w-4 h-4" /> FastAPI Architecture Endpoints
              </h3>
              <p className="text-xs text-slate-400">
                The frontend is structured to bind to the modular FastAPI microservice monolith defined in Section 12 of the PRD:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-emerald-400">POST /api/auth/verify-otp</span>
                  <span className="text-slate-400">Domain check (^[\w\.-]+@nie\.ac\.in$)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-blue-400">POST /api/bookings</span>
                  <span className="text-slate-400">1-pass quota per student constraint</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-amber-400">POST /api/payments/create-order</span>
                  <span className="text-slate-400">Razorpay server order generator</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-purple-400">POST /api/webhooks/razorpay</span>
                  <span className="text-slate-400">Idempotent HMAC-SHA256 signature</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-cyan-400">POST /api/admin/tickets/verify</span>
                  <span className="text-slate-400">Atomic CONFIRMED → USED state change</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Database & Security Controls
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block">BR-02 & Constraint: Hard Single-Ticket Limit</span>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    Verified USN uniqueness constraint ensures a student cannot book additional passes or adjust quantities.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block">BR-05 & BR-06: Cryptographic QR Tokens</span>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    QR tokens contain salted hash secrets rather than plaintext PII. Scans are checked atomically with gate audit logs.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block">Supabase PostgreSQL Schema Ready</span>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    Includes students, events, bookings, payments, tickets, scan_logs, and webhook_events tables.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

