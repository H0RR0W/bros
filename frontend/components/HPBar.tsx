'use client';

interface HPBarProps {
  current: number;
  max: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function HPBar({ current, max, label = 'HP', showPercent = true, size = 'md' }: HPBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const fillClass = pct > 60 ? 'hp-bar-fill' : pct > 30 ? 'hp-bar-fill warning' : 'hp-bar-fill danger';
  const heights = { sm: '10px', md: '16px', lg: '24px' };
  const fontSize = { sm: '7px', md: '9px', lg: '11px' };

  return (
    <div style={{ width: '100%' }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: fontSize[size], color: 'var(--px-gray)' }}>
          {label}
        </span>
        {showPercent && (
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: fontSize[size],
            color: pct > 60 ? 'var(--px-green)' : pct > 30 ? 'var(--px-yellow)' : 'var(--px-red)',
          }}>
            {current}/{max}
          </span>
        )}
      </div>
      <div className="hp-bar-track" style={{ height: heights[size] }}>
        <div className={fillClass} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = (current / max) * 100;
  return (
    <div style={{ width: '100%' }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)' }}>
          XP — УРОВЕНЬ {level}
        </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)' }}>
          {current}/{max}
        </span>
      </div>
      <div className="hp-bar-track" style={{ height: '12px' }}>
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
