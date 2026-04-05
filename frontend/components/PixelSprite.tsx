'use client';

// CSS pixel art sprites using box-shadow technique
// Each "pixel" is a 4x4 unit shadow

export function PixelShield({ color = '#00ff41', size = 4 }: { color?: string; size?: number }) {
  const s = size;
  // 10x12 pixel shield shape
  const style: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${s}px`,
    height: `${s}px`,
    boxShadow: [
      // Row 1: ..XX XX..
      `${2*s}px ${0*s}px 0 ${s-1}px ${color}`,
      `${3*s}px ${0*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${0*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${0*s}px 0 ${s-1}px ${color}`,
      // Row 2: XXXXXXXXXX
      `${1*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${2*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${3*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${4*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${5*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${8*s}px ${1*s}px 0 ${s-1}px ${color}`,
      // Row 3-5
      `${0*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${9*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${0*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${9*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${0*s}px ${4*s}px 0 ${s-1}px ${color}`,
      `${9*s}px ${4*s}px 0 ${s-1}px ${color}`,
      // Row 6: converging
      `${1*s}px ${5*s}px 0 ${s-1}px ${color}`,
      `${8*s}px ${5*s}px 0 ${s-1}px ${color}`,
      `${2*s}px ${6*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${6*s}px 0 ${s-1}px ${color}`,
      `${3*s}px ${7*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${7*s}px 0 ${s-1}px ${color}`,
      `${4*s}px ${8*s}px 0 ${s-1}px ${color}`,
      `${5*s}px ${8*s}px 0 ${s-1}px ${color}`,
    ].join(', '),
  };

  return (
    <div style={{ padding: `${s * 2}px ${s * 2}px ${s * 11}px ${s * 2}px`, display: 'inline-block' }}>
      <div style={style} />
    </div>
  );
}

export function PixelStar({ color = '#ffe600', size = 3 }: { color?: string; size?: number }) {
  const s = size;
  const style: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${s}px`,
    height: `${s}px`,
    boxShadow: [
      `${4*s}px 0 0 ${s-1}px ${color}`,
      `${3*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${4*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${5*s}px ${1*s}px 0 ${s-1}px ${color}`,
      `${0*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${1*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${2*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${3*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${4*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${5*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${8*s}px ${2*s}px 0 ${s-1}px ${color}`,
      `${1*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${2*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${3*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${4*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${5*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${3*s}px 0 ${s-1}px ${color}`,
      `${2*s}px ${4*s}px 0 ${s-1}px ${color}`,
      `${6*s}px ${4*s}px 0 ${s-1}px ${color}`,
      `${1*s}px ${5*s}px 0 ${s-1}px ${color}`,
      `${7*s}px ${5*s}px 0 ${s-1}px ${color}`,
    ].join(', '),
  };

  return (
    <div style={{ padding: `${s * 2}px ${s * 2}px ${s * 8}px ${s * 2}px`, display: 'inline-block' }}>
      <div style={style} />
    </div>
  );
}

// Simple pixel character — "hacker" silhouette using text art styled with CSS
export function PixelHacker({ className }: { className?: string }) {
  return (
    <pre
      className={className}
      style={{
        fontFamily: 'monospace',
        fontSize: '8px',
        lineHeight: '1.2',
        color: 'var(--px-green)',
        textShadow: '0 0 6px var(--px-green)',
        userSelect: 'none',
        letterSpacing: '0px',
      }}
    >{`
 ▄████████▄
▐█ ▀██▀ █▐
▐█ ░  ░ █▐
 ▀██████▀
  ██████
 ▐██████▌
 ▐██████▌
  ██  ██
 ▐█▌  ▐█▌`}</pre>
  );
}

export function MatrixRain({ className }: { className?: string }) {
  const chars = '01アイウエオカキクケコ＄#@%';
  const columns = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className={`overflow-hidden select-none pointer-events-none ${className}`}>
      <div className="flex gap-3">
        {columns.map((col) => (
          <div
            key={col}
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: 'var(--px-green)',
              opacity: 0.15 + Math.random() * 0.3,
              animation: `matrix-fall ${2 + Math.random() * 4}s linear ${Math.random() * 3}s infinite`,
              writingMode: 'vertical-rl',
              letterSpacing: '4px',
            }}
          >
            {Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}
          </div>
        ))}
      </div>
    </div>
  );
}
