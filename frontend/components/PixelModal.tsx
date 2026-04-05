'use client';

import { useEffect, useState } from 'react';

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  explanation: string;
  hpDelta: number;
  onNext?: () => void;
  isLastStep?: boolean;
  cweId?: string;
  owaspCategory?: string;
}

export default function PixelModal({
  isOpen,
  onClose,
  type,
  title,
  explanation,
  hpDelta,
  onNext,
  isLastStep,
  cweId,
  owaspCategory,
}: PixelModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const colors = {
    success: { border: 'var(--px-green)', glow: 'rgba(0,255,65,0.3)', bg: 'rgba(0,255,65,0.06)', icon: '✓', iconColor: 'var(--px-green)' },
    danger:  { border: 'var(--px-red)',   glow: 'rgba(255,49,49,0.3)', bg: 'rgba(255,49,49,0.06)',  icon: '✗', iconColor: 'var(--px-red)' },
    warning: { border: 'var(--px-yellow)', glow: 'rgba(255,230,0,0.3)', bg: 'rgba(255,230,0,0.06)', icon: '!', iconColor: 'var(--px-yellow)' },
    info:    { border: 'var(--px-cyan)',   glow: 'rgba(0,229,255,0.3)', bg: 'rgba(0,229,255,0.06)',  icon: 'i', iconColor: 'var(--px-cyan)' },
  };
  const c = colors[type];

  const isPositive = hpDelta > 0;
  const hpText = isPositive ? `+${hpDelta} HP` : `${hpDelta} HP`;
  const hpColor = isPositive ? 'var(--px-green)' : 'var(--px-red)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.85)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg animate-spawn"
        style={{
          background: 'var(--px-bg2)',
          border: `3px solid ${c.border}`,
          boxShadow: `0 0 30px ${c.glow}, 0 0 60px ${c.glow}`,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: c.border,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-bg)' }}>
            {type === 'success' ? '[ ПРАВИЛЬНО ]' : type === 'danger' ? '[ АТАКА УСПЕШНА ]' : '[ ВНИМАНИЕ ]'}
          </span>
          <button
            onClick={onClose}
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-bg)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', background: c.bg }}>
          {/* Icon + title */}
          <div className="flex items-center gap-4 mb-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                border: `3px solid ${c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-pixel)',
                fontSize: '20px',
                color: c.iconColor,
                flexShrink: 0,
              }}
            >
              {c.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: c.iconColor, marginBottom: '4px' }}>
                {title}
              </div>
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '14px',
                color: hpColor,
                textShadow: `0 0 8px ${hpColor}`,
              }}>
                {hpText}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '9px',
            color: 'var(--px-white)',
            lineHeight: '2',
            padding: '12px',
            border: `2px solid ${c.border}`,
            background: 'var(--px-bg)',
            opacity: 0.9,
          }}>
            {explanation}
          </div>

          {/* CWE / OWASP badges */}
          {(cweId || owaspCategory) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {cweId && (
                <span style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '7px',
                  padding: '3px 8px',
                  background: 'rgba(0,229,255,0.1)',
                  border: '2px solid var(--px-cyan)',
                  color: 'var(--px-cyan)',
                }}>
                  {cweId}
                </span>
              )}
              {owaspCategory && (
                <span style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '7px',
                  padding: '3px 8px',
                  background: 'rgba(255,230,0,0.1)',
                  border: '2px solid var(--px-yellow)',
                  color: 'var(--px-yellow)',
                }}>
                  {owaspCategory}
                </span>
              )}
            </div>
          )}

          {/* Attack info */}
          {type === 'danger' && (
            <div className="px-notification-danger px-notification mt-3">
              ⚠ В реальности эта ошибка привела бы к компрометации данных
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: `2px solid ${c.border}` }}>
          {onNext && (
            <button className="px-btn px-btn-green" onClick={onNext}>
              {isLastStep ? 'ЗАВЕРШИТЬ МИССИЮ ▶' : 'СЛЕДУЮЩИЙ ШАГ ▶'}
            </button>
          )}
          {!onNext && (
            <button className="px-btn px-btn-outline" onClick={onClose}>
              ЗАКРЫТЬ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
