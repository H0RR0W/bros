'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGetMe, apiLogout, leagueToLevel, type UserMe } from '@/lib/api';

export default function Navbar({ hp: hpProp, xp: xpProp, level: levelProp, username: usernameProp }: {
  hp?: number;
  xp?: number;
  level?: number;
  username?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    apiGetMe()
      .then(setUser)
      .catch(() => {
        // Token expired or missing — redirect to login
        apiLogout();
        router.push('/');
      });
  }, [router]);

  const hp = user?.hp ?? hpProp ?? 100;
  const level = user ? leagueToLevel(user.league) : (levelProp ?? 1);
  const username = user?.username ?? usernameProp ?? '...';
  const xp = user?.total_score ?? xpProp ?? 0;

  const hpColor = hp > 60 ? 'hp-bar-fill' : hp > 30 ? 'hp-bar-fill warning' : 'hp-bar-fill danger';

  const handleLogout = () => {
    apiLogout();
    router.push('/');
  };

  return (
    <nav className="px-border sticky top-0 z-50" style={{ background: 'var(--px-bg2)', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 no-underline group">
          <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 6px #00ff41)' }}>🛡️</span>
          <span className="px-title hidden sm:block" style={{ fontSize: '11px' }}>
            CYBER<span style={{ color: 'var(--px-cyan)' }}>GUARD</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink href="/dashboard" active={pathname === '/dashboard'} label="БАЗА" />
          <NavLink href="/missions" active={pathname.startsWith('/missions') || pathname.startsWith('/play')} label="МИССИИ" />
          <NavLink href="/leaderboard" active={pathname === '/leaderboard'} label="РЕЙТИНГ" />
          {user?.role === 'admin' && (
            <NavLink href="/admin" active={pathname.startsWith('/admin')} label="АДМИН" />
          )}
        </div>

        {/* Player stats */}
        <div className="flex items-center gap-4">
          {/* HP */}
          <div className="hidden sm:flex flex-col gap-1" style={{ minWidth: '120px' }}>
            <div className="flex items-center justify-between">
              <span className="px-text-dim" style={{ fontSize: '7px' }}>HP</span>
              <span style={{ color: 'var(--px-green)', fontSize: '8px', fontFamily: 'var(--font-pixel)' }}>{hp}%</span>
            </div>
            <div className="hp-bar-track" style={{ height: '10px' }}>
              <div className={hpColor} style={{ width: `${hp}%` }} />
            </div>
          </div>

          {/* Level */}
          <div className="flex flex-col items-center gap-1">
            <span className="px-text-dim" style={{ fontSize: '7px' }}>LVL</span>
            <span className="px-title" style={{ fontSize: '14px' }}>{level}</span>
          </div>

          {/* Username */}
          <Link
            href="/profile"
            className="px-badge px-badge-green"
            style={{ fontSize: '7px', textDecoration: 'none', cursor: 'pointer' }}
            title="Личный кабинет"
          >
            {username}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '7px',
              padding: '4px 8px',
              background: 'rgba(255,49,49,0.1)',
              color: 'var(--px-red)',
              border: '2px solid var(--px-red)',
              cursor: 'pointer',
            }}
            title="Выйти"
          >
            ⏻
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
        padding: '6px 12px',
        color: active ? 'var(--px-bg)' : 'var(--px-gray)',
        background: active ? 'var(--px-green)' : 'transparent',
        border: `2px solid ${active ? 'var(--px-green)' : 'transparent'}`,
        textDecoration: 'none',
        display: 'block',
        transition: 'all 0.1s',
      }}
      className="hover:border-[var(--px-green)] hover:text-[var(--px-green)]"
    >
      {label}
    </Link>
  );
}
