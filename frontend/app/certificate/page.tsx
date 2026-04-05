'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { isAuthenticated, apiGetMe, apiGetHistory, leagueToLevel, type UserMe } from '@/lib/api';

// Explicit hex values matching CSS variables
const C = {
  bg:     '#080c10',
  bg2:    '#0f1923',
  bg3:    '#1a2535',
  green:  '#00ff41',
  cyan:   '#00e5ff',
  yellow: '#ffe600',
  white:  '#e8f0e8',
  gray:   '#3a4a5a',
};

export default function CertificatePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [homeCompleted, setHomeCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    Promise.all([apiGetMe(), apiGetHistory()])
      .then(([u, hist]) => {
        setUser(u);
        setHomeCompleted(hist.sessions.some(s => s.location === 'home'));
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDownloadPDF = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297;
      const H = 210;

      // ── Background ──────────────────────────────────────────────────
      doc.setFillColor(8, 12, 16);
      doc.rect(0, 0, W, H, 'F');

      // Inner card
      doc.setFillColor(15, 25, 35);
      doc.rect(10, 10, W - 20, H - 20, 'F');

      // Outer border (green)
      doc.setDrawColor(0, 255, 65);
      doc.setLineWidth(1);
      doc.rect(10, 10, W - 20, H - 20);

      // Inner border (cyan)
      doc.setDrawColor(0, 229, 255);
      doc.setLineWidth(0.4);
      doc.rect(14, 14, W - 28, H - 28);

      // Corner accent lines (cyan)
      const corners = [
        [10, 10, 28, 10, 10, 28],
        [W-10, 10, W-28, 10, W-10, 28],
        [10, H-10, 28, H-10, 10, H-28],
        [W-10, H-10, W-28, H-10, W-10, H-28],
      ] as [number,number,number,number,number,number][];
      doc.setDrawColor(0, 229, 255);
      doc.setLineWidth(0.8);
      corners.forEach(([x1,y1,x2,y2,x3,y3]) => {
        doc.line(x1, y1, x2, y2);
        doc.line(x1, y1, x3, y3);
      });

      // Grid overlay (very subtle — skip for PDF clarity)

      // ── Logo ────────────────────────────────────────────────────────
      // Shield emoji approximate
      doc.setFontSize(14);
      doc.setTextColor(0, 255, 65);
      const logoBox = { x: W/2 - 30, y: 22, w: 60, h: 10 };
      doc.setFillColor(0, 255, 65, 0.08 * 255); // won't work as alpha, use draw
      doc.setDrawColor(0, 255, 65);
      doc.setLineWidth(0.4);
      doc.rect(logoBox.x, logoBox.y, logoBox.w, logoBox.h);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 255, 65);
      doc.text('CYBER', W/2 - 6, logoBox.y + 6.5, { align: 'center' });
      doc.setTextColor(0, 229, 255);
      doc.text('GUARD', W/2 + 6, logoBox.y + 6.5, { align: 'center' });

      // ── Title ────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 230, 0);
      doc.text('СЕРТИФИКАТ', W / 2, 48, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(58, 74, 90);
      doc.text('ОБ УСПЕШНОМ ПРОХОЖДЕНИИ', W / 2, 55, { align: 'center' });

      // ── Divider ──────────────────────────────────────────────────────
      doc.setDrawColor(0, 255, 65);
      doc.setLineWidth(0.6);
      doc.line(30, 60, W - 30, 60);
      doc.setDrawColor(0, 229, 255);
      doc.setLineWidth(0.3);
      doc.line(30, 61, W - 30, 61);

      // ── Body ─────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(58, 74, 90);
      doc.text('НАСТОЯЩИЙ СЕРТИФИКАТ ПОДТВЕРЖДАЕТ, ЧТО', W / 2, 72, { align: 'center' });

      // Name box
      const fullName = [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(' ');
      const hasFullName = !!fullName;
      const nameText = hasFullName ? fullName.toUpperCase() : '[ ЗАПОЛНИТЕ ФИО В ЛИЧНОМ КАБИНЕТЕ ]';
      const nameBoxY = 76;
      doc.setDrawColor(hasFullName ? 0 : 26, hasFullName ? 229 : 37, hasFullName ? 255 : 53);
      doc.setLineWidth(0.5);
      doc.rect(60, nameBoxY, W - 120, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(hasFullName ? 14 : 9);
      doc.setTextColor(hasFullName ? 232 : 58, hasFullName ? 240 : 74, hasFullName ? 232 : 90);
      doc.text(nameText, W / 2, nameBoxY + 9, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(58, 74, 90);
      doc.text('УСПЕШНО ПРОШЁЛ(А) ОБРАЗОВАТЕЛЬНЫЙ СИМУЛЯТОР', W / 2, 100, { align: 'center' });
      doc.text('ПО ЗАЩИТЕ ЛИЧНЫХ ДАННЫХ И КИБЕРБЕЗОПАСНОСТИ', W / 2, 107, { align: 'center' });
      doc.setTextColor(0, 255, 65);
      doc.text('CYBERGUARD', W / 2 - 18, 114, { align: 'center' });
      doc.setTextColor(58, 74, 90);
      doc.text('— ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА БАНКА «ЦЕНТР-ИНВЕСТ»', W / 2 + 16, 114, { align: 'center' });

      // ── Stats ─────────────────────────────────────────────────────────
      const statsY = 128;
      const level = leagueToLevel(user.league);
      const stats = [
        { label: 'УРОВЕНЬ', value: `LVL ${level}`, color: [0, 229, 255] as [number,number,number] },
        { label: 'ЛИГА', value: user.league, color: [255, 230, 0] as [number,number,number] },
        { label: 'ОЧКИ', value: String(user.total_score), color: [0, 255, 65] as [number,number,number] },
      ];
      stats.forEach(({ label, value, color }, idx) => {
        const cx = W / 2 + (idx - 1) * 50;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(value, cx, statsY, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(58, 74, 90);
        doc.text(label, cx, statsY + 6, { align: 'center' });
      });

      // ── Divider 2 ─────────────────────────────────────────────────────
      doc.setDrawColor(26, 37, 53);
      doc.setLineWidth(0.3);
      doc.line(30, 142, W - 30, 142);

      // ── Footer ────────────────────────────────────────────────────────
      const footerY = 153;
      const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

      // Date
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(58, 74, 90);
      doc.text('ДАТА ВЫДАЧИ', 35, footerY);
      doc.setFontSize(8);
      doc.setTextColor(232, 240, 232);
      doc.text(today, 35, footerY + 6);

      // Verification code
      const code = user.id?.slice(0, 8).toUpperCase() ?? '--------';
      doc.setFontSize(6);
      doc.setTextColor(58, 74, 90);
      doc.text('КОД ВЕРИФИКАЦИИ', W / 2, footerY, { align: 'center' });
      doc.setDrawColor(26, 37, 53);
      doc.setLineWidth(0.4);
      doc.rect(W / 2 - 20, footerY + 2, 40, 8);
      doc.setFontSize(8);
      doc.setTextColor(0, 229, 255);
      doc.text(code, W / 2, footerY + 7.5, { align: 'center' });

      // Organisation
      doc.setFontSize(6);
      doc.setTextColor(58, 74, 90);
      doc.text('ОРГАНИЗАЦИЯ', W - 35, footerY, { align: 'right' });
      doc.setFontSize(8);
      doc.setTextColor(0, 255, 65);
      doc.text('CYBERGUARD EDU', W - 35, footerY + 6, { align: 'right' });
      doc.setFontSize(6);
      doc.setTextColor(58, 74, 90);
      doc.text('Банк «Центр-инвест»', W - 35, footerY + 11, { align: 'right' });

      doc.save('CyberGuard_Certificate.pdf');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center" style={{ background: 'var(--px-bg)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>
      </div>
    );
  }

  if (!homeCompleted) {
    return (
      <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="px-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', border: '2px solid var(--px-red)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: 'var(--px-red)', marginBottom: '12px' }}>
              СЕРТИФИКАТ ЗАБЛОКИРОВАН
            </div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2', marginBottom: '20px' }}>
              Пройдите уровень ДОМ для получения сертификата
            </div>
            <a href="/missions" className="px-btn px-btn-outline" style={{ textDecoration: 'none' }}>← К МИССИЯМ</a>
          </div>
        </div>
      </div>
    );
  }

  const fullName = user
    ? [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(' ')
    : '';
  const hasFullName = !!fullName;
  const level = user ? leagueToLevel(user.league) : 1;
  const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {!hasFullName && (
          <div style={{
            maxWidth: '600px', width: '100%', padding: '14px 20px',
            border: '2px solid var(--px-yellow)', background: 'rgba(255,230,0,0.05)',
            fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-yellow)', textAlign: 'center',
          }}>
            ⚠ Заполните ФИО в{' '}
            <a href="/profile" style={{ color: 'var(--px-cyan)', textDecoration: 'underline' }}>личном кабинете</a>
            {' '}— оно появится на сертификате
          </div>
        )}
      </main>

      {/* Certificate preview */}
      <div className="flex justify-center px-4 pb-8" style={{ marginTop: hasFullName ? '32px' : '0' }}>
        <div id="certificate" style={{
          width: '700px', maxWidth: '100%',
          background: 'var(--px-bg2)',
          border: '4px solid var(--px-green)',
          boxShadow: '0 0 40px rgba(0,255,65,0.2), inset 0 0 60px rgba(0,255,65,0.03)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Corner decorations */}
          {[
            { top: 0, left: 0, borderTop: '3px solid var(--px-cyan)', borderLeft: '3px solid var(--px-cyan)' },
            { top: 0, right: 0, borderTop: '3px solid var(--px-cyan)', borderRight: '3px solid var(--px-cyan)' },
            { bottom: 0, left: 0, borderBottom: '3px solid var(--px-cyan)', borderLeft: '3px solid var(--px-cyan)' },
            { bottom: 0, right: 0, borderBottom: '3px solid var(--px-cyan)', borderRight: '3px solid var(--px-cyan)' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: '40px', height: '40px', ...style }} />
          ))}

          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(var(--px-green) 1px, transparent 1px), linear-gradient(90deg, var(--px-green) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <div style={{ position: 'relative', padding: '48px 52px' }}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', border: '2px solid var(--px-green)',
                background: 'rgba(0,255,65,0.08)',
              }}>
                <span style={{ fontSize: '14px' }}>🛡️</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-green)', letterSpacing: '3px' }}>
                  CYBER<span style={{ color: 'var(--px-cyan)' }}>GUARD</span>
                </span>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: '22px',
                color: 'var(--px-yellow)', textShadow: '0 0 20px rgba(255,230,0,0.4)',
                letterSpacing: '4px', marginBottom: '8px',
              }}>
                СЕРТИФИКАТ
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', letterSpacing: '2px' }}>
                ОБ УСПЕШНОМ ПРОХОЖДЕНИИ
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--px-green), var(--px-cyan), var(--px-green), transparent)', marginBottom: '32px' }} />

            {/* Body */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', letterSpacing: '1px', marginBottom: '20px' }}>
                НАСТОЯЩИЙ СЕРТИФИКАТ ПОДТВЕРЖДАЕТ, ЧТО
              </div>

              {/* Name */}
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: hasFullName ? '16px' : '11px',
                color: hasFullName ? 'var(--px-white)' : 'var(--px-gray)',
                textShadow: hasFullName ? '0 0 12px rgba(255,255,255,0.2)' : 'none',
                padding: '16px 24px',
                border: `2px solid ${hasFullName ? 'var(--px-cyan)' : 'var(--px-bg3)'}`,
                background: hasFullName ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)',
                letterSpacing: '2px', marginBottom: '20px',
                minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {hasFullName ? fullName.toUpperCase() : '[ ЗАПОЛНИТЕ ФИО В ЛИЧНОМ КАБИНЕТЕ ]'}
              </div>

              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2.2' }}>
                УСПЕШНО ПРОШЁЛ(А) ОБРАЗОВАТЕЛЬНЫЙ СИМУЛЯТОР<br />
                ПО ЗАЩИТЕ ЛИЧНЫХ ДАННЫХ И КИБЕРБЕЗОПАСНОСТИ<br />
                <span style={{ color: 'var(--px-green)' }}>CYBERGUARD</span> — ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА Банка «Центр-инвест»
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              {[
                { label: 'УРОВЕНЬ', value: `LVL ${level}`, color: 'var(--px-cyan)' },
                { label: 'ЛИГА', value: user?.league ?? '—', color: 'var(--px-yellow)' },
                { label: 'ОЧКИ', value: String(user?.total_score ?? 0), color: 'var(--px-green)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color, textShadow: `0 0 10px ${color}`, marginBottom: '4px' }}>
                    {value}
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--px-bg3), transparent)', marginBottom: '24px' }} />

            {/* Footer */}
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)', marginBottom: '4px' }}>ДАТА ВЫДАЧИ</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)' }}>{today}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)', marginBottom: '6px' }}>КОД ВЕРИФИКАЦИИ</div>
                <div style={{
                  padding: '6px 12px', border: '2px solid var(--px-bg3)',
                  background: 'var(--px-bg)',
                  fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-cyan)', letterSpacing: '2px',
                }}>
                  {user?.id?.slice(0, 8).toUpperCase() ?? '--------'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)', marginBottom: '4px' }}>ОРГАНИЗАЦИЯ</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>CYBERGUARD EDU</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)' }}>Банк «Центр-инвест»</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 flex-wrap justify-center pb-8">
        <button
          className="px-btn px-btn-green"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? '⏳ ГЕНЕРАЦИЯ...' : '📥 СКАЧАТЬ PDF'}
        </button>
        <a href="/profile" className="px-btn px-btn-outline" style={{ textDecoration: 'none' }}>
          ← ЛИЧНЫЙ КАБИНЕТ
        </a>
        <a href="/dashboard" className="px-btn px-btn-outline" style={{ textDecoration: 'none' }}>
          ← БАЗА
        </a>
      </div>
    </div>
  );
}
