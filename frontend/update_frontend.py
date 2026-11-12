import re
import os

file_path = r'c:\Users\sagar\OneDrive\Desktop\ArISE movie night\frontend\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Left Logo:
pattern_left = r'(?s)\{/\* Left Logo: College.*?</header>'
# Let's inspect where header is
# Replace the image tag for nie:
content = re.sub(
    r'(?s)<div className="flex items-center">\s*<div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white/0 border border-white/10">\s*<img\s*src="/nie\.jpeg"[^>]*/>\s*</div>\s*</div>',
    r'''<div className="flex items-center">
                  <img 
                    src="/nie.png" 
                    alt="The National Institute of Engineering" 
                    className="h-14 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>''',
    content
)

# 2. Replace right logos:
content = re.sub(
    r'(?s)\{/\* Right Logos: Department.*?</div>\s*</div>\s*</div>\s*\{/\* Book Pass CTA \*/\}',
    r'''{/* Right Logos: Department (dept.png) and ArISE (arise.png) */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src="/dept.png" 
                    alt="ISE Department Logo" 
                    className="h-12 w-12 object-contain rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <img 
                    src="/arise.png" 
                    alt="ArISE Logo" 
                    className="h-12 w-12 object-contain rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                {/* Book Pass CTA */}''',
    content
)

# 3. Replace footer text:
content = re.sub(
    r'<div>Department of Information Science & Engineering · ArISE 2026</div>\s*<div className="text-\[#e6ca65\] font-semibold">One Campus\. Every Event\. One Pass\.</div>',
    r'''<div className="text-center">
                <div>Department of Information Science & Engineering · ArISE 2026</div>
                <div className="mt-1 text-slate-400 font-medium">Made with love by ISE Students</div>
              </div>
              <div className="text-[#e6ca65] font-semibold">One Campus. Every Event. One Pass.</div>''',
    content
)

# 4. Replace handleDownloadPDF function:
new_pdf_func = r'''      const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
          const { jsPDF } = window.jspdf;

          // A5 landscape: 210mm x 148mm
          const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
          const W = 210, H = 148;

          // ── BACKGROUND ──────────────────────────────────────────────
          pdf.setFillColor(4, 7, 17); // #040711
          pdf.rect(0, 0, W, H, 'F');

          // Left accent stripe
          const barColors = [[230, 202, 101], [59, 130, 246], [99, 102, 241]];
          const barH = H / barColors.length;
          barColors.forEach(([r, g, b], i) => {
            pdf.setFillColor(r, g, b);
            pdf.rect(0, i * barH, 4, barH, 'F');
          });

          // ── HELPER: LOAD IMAGES TO BASE64 DATA URL ──────────────────
          const loadImg = (src) => new Promise((res) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth; c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                res({ data: c.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
              } catch { res(null); }
            };
            img.onerror = () => res(null);
            img.src = src;
          });

          const [nieData, deptData, ariseData] = await Promise.all([
            loadImg('/nie.png'),
            loadImg('/dept.png'),
            loadImg('/arise.png'),
          ]);

          // ── TOP HEADER SECTION (y: 10 to 38) ─────────────────────────
          // 1. NIE Logo (Shield) at top left
          if (nieData) {
            const nieH = 20;
            const nieW = (nieData.width / nieData.height) * nieH;
            pdf.addImage(nieData.data, 'PNG', 12, 10, nieW, nieH);
          }

          // 2. Institution & Event Title
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6.5);
          pdf.setTextColor(230, 202, 101); // Gold
          pdf.text('THE NATIONAL INSTITUTE OF ENGINEERING', 32, 14);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184); // Slate-400
          pdf.text('DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING', 32, 18.5);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.setTextColor(255, 255, 255);
          pdf.text('ArISE 2026', 32, 26);

          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(12);
          pdf.setTextColor(230, 202, 101);
          pdf.text('Movie Night', 67, 26);

          // Status Badge
          pdf.setFillColor(16, 185, 129); // Emerald
          pdf.roundedRect(32, 29.5, 30, 4.8, 1.2, 1.2, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text('CONFIRMED PASS', 47, 33, { align: 'center' });

          // 3. Dept Logo & ArISE Logo at center-right (x = 133 to 166)
          const logoY = 11, logoSize = 15;
          if (deptData) {
            pdf.addImage(deptData.data, 'PNG', 133, logoY, logoSize, logoSize);
          }
          if (ariseData) {
            pdf.addImage(ariseData.data, 'PNG', 151, logoY, logoSize, logoSize);
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('ArISE 2026 PRESENTS', 149.5, 30, { align: 'center' });

          // 4. Date & Time Box (far right: x = 172, y = 9, w = 26, h = 27)
          pdf.setFillColor(10, 16, 31);
          pdf.setDrawColor(230, 202, 101);
          pdf.setLineWidth(0.4);
          pdf.roundedRect(172, 9, 26, 27, 2, 2, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(19);
          pdf.setTextColor(255, 255, 255);
          pdf.text('18', 185, 20, { align: 'center' });

          pdf.setFontSize(7.5);
          pdf.setTextColor(230, 202, 101);
          pdf.text('NOV 2026', 185, 26, { align: 'center' });

          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('6:00 PM IST', 185, 32, { align: 'center' });

          // ── PERFORATION DIVIDER (y = 40) ─────────────────────────────
          pdf.setDrawColor(51, 65, 85);
          pdf.setLineWidth(0.3);
          pdf.setLineDashPattern([2, 2], 0);
          pdf.line(12, 40, W - 12, 40);
          pdf.setLineDashPattern([], 0);

          // ── TICKET BODY (y: 45 to 130) ───────────────────────────────
          const leftX = 14;

          // Attendee Name
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('ATTENDEE STUDENT', leftX, 48);

          pdf.setFontSize(14);
          pdf.setTextColor(255, 255, 255);
          pdf.text(ticket.fullName || 'Student Attendee', leftX, 55);

          // Row 1: USN, Branch, Pass Tier (y = 64)
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('USN', leftX, 64);
          pdf.text('BRANCH', leftX + 46, 64);
          pdf.text('PASS TIER', leftX + 86, 64);

          pdf.setFont('courier', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text(ticket.usn || '—', leftX, 70);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(230, 202, 101);
          pdf.text(ticket.branch || 'ISE', leftX + 46, 70);

          pdf.setTextColor(255, 255, 255);
          pdf.text('STUDENT (1 PASS)', leftX + 86, 70);

          // Row 2: NIE Email, Mobile (y = 79)
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('NIE EMAIL', leftX, 79);
          pdf.text('MOBILE NUMBER', leftX + 66, 79);

          pdf.setFont('courier', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(147, 197, 253);
          pdf.text(ticket.email || '—', leftX, 85);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(ticket.mobile || '—', leftX + 66, 85);

          // Row 3: Ticket ID, Booking ID, Amount Paid (y = 94)
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('TICKET ID', leftX, 94);
          pdf.text('BOOKING ID', leftX + 46, 94);
          pdf.text('AMOUNT PAID', leftX + 86, 94);

          pdf.setFont('courier', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(96, 165, 250);
          pdf.text(ticket.ticketId || '—', leftX, 100);

          pdf.setTextColor(255, 255, 255);
          pdf.text(ticket.bookingId || '—', leftX + 46, 100);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(52, 211, 153);
          pdf.text('INR 149.00', leftX + 86, 100);

          // Row 4: Venue & Admission Notes Box (y = 106 to 127)
          pdf.setFillColor(10, 16, 31);
          pdf.setDrawColor(30, 41, 59);
          pdf.setLineWidth(0.2);
          pdf.roundedRect(leftX, 106, 114, 21, 2, 2, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.5);
          pdf.setTextColor(230, 202, 101);
          pdf.text('VENUE & ENTRY POLICY', leftX + 4, 111);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text('Diamond Jubilee Complex · South Campus, NIE Mysuru', leftX + 4, 116.5);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text('Strictly 1 non-transferable pass. Physical NIE Student ID mandatory at entrance gate.', leftX + 4, 122);

          // RIGHT: QR CODE CARD (x = 138, y = 46, w = 60, h = 81)
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(138, 46, 60, 81, 3, 3, 'F');

          // Header inside QR card
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text('OFFICIAL GATE PASS', 168, 52, { align: 'center' });

          // Live QR extraction
          let qrDataUrl = null;
          if (qrContainerRef.current) {
            const qrCanvas = qrContainerRef.current.querySelector('canvas');
            if (qrCanvas) {
              qrDataUrl = qrCanvas.toDataURL('image/png');
            }
          }
          if (!qrDataUrl) {
            try {
              const tmpDiv = document.createElement('div');
              document.body.appendChild(tmpDiv);
              await new Promise((res) => {
                new QRCode(tmpDiv, {
                  text: ticket.qrPayload,
                  width: 250, height: 250,
                  colorDark: '#040711', colorLight: '#ffffff',
                  correctLevel: QRCode.CorrectLevel.H
                });
                setTimeout(() => {
                  const c = tmpDiv.querySelector('canvas');
                  if (c) qrDataUrl = c.toDataURL('image/png');
                  document.body.removeChild(tmpDiv);
                  res();
                }, 200);
              });
            } catch {}
          }

          if (qrDataUrl) {
            pdf.addImage(qrDataUrl, 'PNG', 144, 56, 48, 48);
          }

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6);
          pdf.setTextColor(15, 23, 42);
          pdf.text('SCAN AT ENTRANCE', 168, 109, { align: 'center' });

          pdf.setFont('courier', 'bold');
          pdf.setFontSize(6);
          pdf.setTextColor(37, 99, 235);
          pdf.text(ticket.ticketId, 168, 113.5, { align: 'center' });

          // Single entry pill inside card
          pdf.setFillColor(4, 7, 17);
          pdf.roundedRect(148, 117, 40, 6, 1.5, 1.5, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5);
          pdf.setTextColor(52, 211, 153);
          pdf.text('SINGLE ENTRY ONLY', 168, 121, { align: 'center' });

          // ── FOOTER BAR (y: 135 to 148) ───────────────────────────────
          pdf.setFillColor(2, 5, 11);
          pdf.rect(0, 135, W, 13, 'F');
          pdf.setDrawColor(30, 41, 59);
          pdf.setLineWidth(0.2);
          pdf.line(0, 135, W, 135);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6);
          pdf.setTextColor(148, 163, 184);
          pdf.text('The National Institute of Engineering, Mysuru', 14, 142);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(230, 202, 101);
          pdf.text('Made with love by ISE Students', W / 2, 142, { align: 'center' });

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text(`Issued: ${new Date(ticket.issuedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, W - 14, 142, { align: 'right' });

          pdf.save(`${ticket.ticketId}_ArISE_2026_Pass.pdf`);
        } catch (err) {
          console.error('PDF error:', err);
          alert('PDF generation failed. Please try again.');
        } finally {
          setDownloading(false);
        }
      };'''

content = re.sub(
    r'(?s)const handleDownloadPDF = async \(\) => \{.*?pdf\.save\(`\$\{ticket\.ticketId\}_ArISE_2026_Pass\.pdf`\);\s*\}\s*catch\s*\(err\)\s*\{.*?\}\s*finally\s*\{.*?\}\s*\};',
    new_pdf_func,
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated frontend/index.html successfully!')

