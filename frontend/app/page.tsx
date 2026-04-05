'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogin, apiRegister, isAuthenticated } from '@/lib/api';

const TERMINAL_LINES = [
  '> Инициализация системы безопасности...',
  '> Загрузка модулей защиты... [OK]',
  '> Подключение к серверу обучения... [OK]',
  '> Обнаружено 47 активных угроз в сети.',
  '> Требуется обученный специалист.',
  '> Система готова к работе._',
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [glitch, setGlitch] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) router.push('/dashboard');
  }, [router]);

  // Typewriter terminal effect
  useEffect(() => {
    if (currentLine >= TERMINAL_LINES.length) return;
    const timer = setTimeout(() => {
      setTerminalLines(prev => [...prev, TERMINAL_LINES[currentLine]]);
      setCurrentLine(prev => prev + 1);
    }, 600 + currentLine * 200);
    return () => clearTimeout(timer);
  }, [currentLine]);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('> ОШИБКА: Заполните все поля');
      return;
    }
    if (mode === 'register' && !username.trim()) {
      setError('> ОШИБКА: Введите имя агента');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await apiLogin(email.trim(), password);
      } else {
        await apiRegister(email.trim(), username.trim(), password);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(`> ОШИБКА: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="px-grid-bg min-h-screen flex flex-col"
      style={{ background: 'var(--px-bg)' }}
    >
      {/* Top bar */}
      <div style={{
        background: 'var(--px-bg2)',
        borderBottom: '2px solid var(--px-bg3)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
          CYBERGUARD_v2.4.1
        </span>
        <div className="flex gap-3">
          {['🔴','🟡','🟢'].map((dot, i) => (
            <span key={i} style={{ fontSize: '8px' }}>{dot}</span>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
          <span className="animate-blink" style={{ color: 'var(--px-red)' }}>●</span> 47 УГРОЗ АКТИВНО
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — Hero */}
          <div className="flex flex-col gap-6 justify-center">
            {/* Title */}
            <div className={glitch ? 'animate-glitch' : ''}>
              <div className="px-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
                CYBER
              </div>
              <div className="px-title" style={{ fontSize: '28px', color: 'var(--px-cyan)', marginBottom: '4px' }}>
                GUARD
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-gray)', lineHeight: '2' }}>
                ОБРАЗОВАТЕЛЬНЫЙ СИМУЛЯТОР<br />
                ЗАЩИТЫ ЛИЧНЫХ ДАННЫХ
              </div>
            </div>

            {/* Shield art */}
            <div className="flex items-center gap-4">
              <div
                className="animate-float"
                style={{
                  fontSize: '64px',
                  filter: 'drop-shadow(0 0 12px var(--px-green)) drop-shadow(0 0 24px var(--px-green))',
                  lineHeight: 1,
                }}
              >
                🛡️
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)', lineHeight: '2.5' }}>
                <div>⚔ ФИШИНГ</div>
                <div>⚔ СОЦ. ИНЖЕНЕРИЯ</div>
                <div>⚔ MITM-АТАКИ</div>
                <div>⚔ ДИПФЕЙКИ</div>
              </div>
            </div>

            {/* Terminal */}
            <div className="px-terminal">
              <div className="px-terminal-bar">
                <span className="px-terminal-dot" style={{ background: 'var(--px-red)' }} />
                <span className="px-terminal-dot" style={{ background: 'var(--px-yellow)' }} />
                <span className="px-terminal-dot" style={{ background: 'var(--px-green)' }} />
                <span style={{ marginLeft: '8px' }}>terminal@cyberguard</span>
              </div>
              <div style={{ padding: '12px 16px', minHeight: '140px' }}>
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: line.includes('[OK]') ? 'var(--px-green)' : line.includes('угроз') ? 'var(--px-red)' : 'var(--px-white)',
                      lineHeight: '1.8',
                      opacity: 0.9,
                    }}
                  >
                    {line}
                  </div>
                ))}
                {currentLine < TERMINAL_LINES.length && (
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--px-green)' }}>
                    <span className="animate-blink">_</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '9', label: 'МИССИЙ' },
                { value: '5', label: 'ТИПОВ АТАК' },
                { value: '2К+', label: 'ИГРОКОВ' },
              ].map(({ value, label }) => (
                <div key={label} className="px-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <div className="px-title" style={{ fontSize: '18px', marginBottom: '6px' }}>{value}</div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Auth form */}
          <div className="flex flex-col justify-center">
            <div className="px-terminal" style={{ border: '3px solid var(--px-green)', boxShadow: '0 0 30px rgba(0,255,65,0.2)' }}>
              {/* Window bar */}
              <div className="px-terminal-bar">
                <span className="px-terminal-dot" style={{ background: 'var(--px-red)' }} />
                <span className="px-terminal-dot" style={{ background: 'var(--px-yellow)' }} />
                <span className="px-terminal-dot" style={{ background: 'var(--px-green)' }} />
                <span style={{ marginLeft: '8px' }}>
                  {mode === 'login' ? 'ВХОД В СИСТЕМУ' : 'РЕГИСТРАЦИЯ АГЕНТА'}
                </span>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Tab switcher */}
                <div className="flex mb-6">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setError(''); }}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '9px',
                        padding: '10px',
                        background: mode === m ? 'var(--px-green)' : 'var(--px-bg)',
                        color: mode === m ? 'var(--px-bg)' : 'var(--px-gray)',
                        border: `2px solid ${mode === m ? 'var(--px-green)' : 'var(--px-bg3)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                    >
                      {m === 'login' ? '[ ВОЙТИ ]' : '[ ВСТУПИТЬ ]'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', display: 'block', marginBottom: '6px' }}>
                      &gt; EMAIL_АГЕНТА:
                    </label>
                    <input
                      type="email"
                      className="px-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@cyberguard.ru"
                      autoComplete="email"
                    />
                  </div>

                  {/* Username — only for register */}
                  {mode === 'register' && (
                    <div>
                      <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', display: 'block', marginBottom: '6px' }}>
                        &gt; ИМЯ_АГЕНТА:
                      </label>
                      <input
                        type="text"
                        className="px-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="введите позывной..."
                        autoComplete="username"
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', display: 'block', marginBottom: '6px' }}>
                      &gt; ПАРОЛЬ:
                    </label>
                    <input
                      type="password"
                      className="px-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-notification px-notification-danger">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="px-btn px-btn-green"
                    style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '14px' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span>
                        <span className="animate-blink">■</span> АВТОРИЗАЦИЯ...
                      </span>
                    ) : (
                      mode === 'login' ? '▶ ВОЙТИ В СИСТЕМУ' : '▶ СОЗДАТЬ АГЕНТА'
                    )}
                  </button>
                </form>

                {/* Features */}
                <div style={{ marginTop: '20px' }}>
                  {[
                    { icon: '🎮', text: '3 окружения, 9+ сценариев' },
                    { icon: '🏆', text: 'Рейтинг и сертификаты' },
                    { icon: '🧠', text: 'Реальные техники атак' },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px' }}>{icon}</span>
                      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '2px solid var(--px-bg3)',
        padding: '8px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
      }}>
        {['TypeScript', 'Next.js', 'Tailwind CSS', 'FastAPI', 'PostgreSQL'].map(tech => (
          <span key={tech} style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-bg3)' }}>
            #{tech}
          </span>
        ))}
      </div>
    </div>
  );
}
