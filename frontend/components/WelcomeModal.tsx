'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const WELCOME_TEXT = 'Добро пожаловать, новичок. Чтобы стать реально крутым агентом, тебе нужно пройти 3 уровня — каждый из которых проверит твою подготовку в вопросах кибербезопасности. Офис, Дом, Wi-Fi. Каждый уровень сложнее предыдущего. Удачи, агент.';

const SEEN_KEY = 'cyberguard_welcomed';

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) {
      // slight delay so the dashboard renders first
      setTimeout(() => { setVisible(true); setTimeout(() => setShow(true), 50); }, 600);
    }
  }, []);

  // Typewriter
  useEffect(() => {
    if (!show) return;
    setTypedText('');
    setDone(false);
    let i = 0;
    // small initial pause before typing starts
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < WELCOME_TEXT.length) {
          setTypedText(WELCOME_TEXT.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, 28);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(start);
  }, [show]);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(SEEN_KEY, '1');
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.015) 3px, rgba(0,255,65,0.015) 4px)',
      }} />

      <div
        style={{
          maxWidth: '520px', width: '100%',
          background: 'var(--px-bg2)',
          border: '3px solid var(--px-green)',
          boxShadow: '0 0 60px rgba(0,255,65,0.25), 0 0 120px rgba(0,255,65,0.1)',
          transform: show ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Corner accents */}
        {[
          { top: 0, left: 0, borderTop: '3px solid var(--px-cyan)', borderLeft: '3px solid var(--px-cyan)' },
          { top: 0, right: 0, borderTop: '3px solid var(--px-cyan)', borderRight: '3px solid var(--px-cyan)' },
          { bottom: 0, left: 0, borderBottom: '3px solid var(--px-cyan)', borderLeft: '3px solid var(--px-cyan)' },
          { bottom: 0, right: 0, borderBottom: '3px solid var(--px-cyan)', borderRight: '3px solid var(--px-cyan)' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
        ))}

        {/* Header bar */}
        <div style={{
          background: 'var(--px-green)', padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-bg)', letterSpacing: '2px' }}>
            [ ВХОДЯЩЕЕ СООБЩЕНИЕ ]
          </span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-bg)', opacity: 0.7 }}>
            CYBERGUARD //
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 28px 24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Agent sprite */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: '112px', height: '144px',
              border: '3px solid var(--px-green)',
              boxShadow: '0 0 16px rgba(0,255,65,0.3)',
              overflow: 'hidden', position: 'relative',
              imageRendering: 'pixelated',
            }}>
              <Image
                src="/agent.svg"
                alt="Agent"
                fill
                style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
              />
            </div>
            {/* Name tag */}
            <div style={{
              marginTop: '8px', textAlign: 'center',
              padding: '4px 8px',
              border: '2px solid var(--px-cyan)',
              background: 'rgba(0,229,255,0.08)',
              fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-cyan)',
            }}>
              АГЕНТ X
            </div>
          </div>

          {/* Text panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Terminal box */}
            <div style={{
              background: 'var(--px-bg)',
              border: '2px solid var(--px-bg3)',
              padding: '14px',
              minHeight: '120px',
              position: 'relative',
            }}>
              {/* Terminal header */}
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: '7px',
                color: 'var(--px-green)', marginBottom: '10px', opacity: 0.7,
              }}>
                {'> BRIEFING //'}
              </div>
              <p style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '8px',
                color: 'var(--px-white)',
                lineHeight: '2.2',
                margin: 0,
              }}>
                {typedText}
                {!done && (
                  <span
                    style={{ color: 'var(--px-green)', animation: 'blink 0.7s step-end infinite' }}
                  >█</span>
                )}
              </p>
            </div>

            {/* CTA — только когда текст допечатан */}
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              opacity: done ? 1 : 0,
              transform: done ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s, transform 0.4s',
              pointerEvents: done ? 'auto' : 'none',
            }}>
              <button
                className="px-btn px-btn-green"
                onClick={handleDismiss}
                style={{ fontSize: '9px', letterSpacing: '2px' }}
              >
                ПРИНЯТЬ ЗАДАНИЕ ▶
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '7px',
                  color: 'var(--px-gray)', background: 'none',
                  border: 'none', cursor: 'pointer', opacity: 0.6,
                }}
              >
                пропустить
              </button>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{
          padding: '0 28px 20px',
          display: 'flex', gap: '4px',
        }}>
          {Array.from({ length: WELCOME_TEXT.length }).map((_, i) => null)}
          <div style={{
            height: '3px', flex: 1,
            background: 'var(--px-bg3)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'var(--px-green)',
              width: `${(typedText.length / WELCOME_TEXT.length) * 100}%`,
              transition: 'width 0.1s linear',
              boxShadow: '0 0 6px var(--px-green)',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
