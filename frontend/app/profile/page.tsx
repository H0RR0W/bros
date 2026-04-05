'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  isAuthenticated,
  apiGetMe,
  apiUpdateProfile,
  apiChangePassword,
  leagueToLevel,
  type UserMe,
} from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    apiGetMe()
      .then(u => {
        setUser(u);
        setFirstName(u.first_name ?? '');
        setLastName(u.last_name ?? '');
        setPatronymic(u.patronymic ?? '');
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await apiUpdateProfile({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        patronymic: patronymic.trim() || null,
      });
      setUser(updated);
      setProfileMsg({ ok: true, text: 'ДАННЫЕ СОХРАНЕНЫ' });
    } catch (err: unknown) {
      setProfileMsg({ ok: false, text: err instanceof Error ? err.message : 'ОШИБКА СОХРАНЕНИЯ' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'ПАРОЛИ НЕ СОВПАДАЮТ' });
      return;
    }
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await apiChangePassword(oldPwd, newPwd);
      setPwdMsg({ ok: true, text: 'ПАРОЛЬ ИЗМЕНЁН' });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: unknown) {
      setPwdMsg({ ok: false, text: err instanceof Error ? err.message : 'ОШИБКА СМЕНЫ ПАРОЛЯ' });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center" style={{ background: 'var(--px-bg)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-green)' }}>
          ЗАГРУЗКА...
        </div>
      </div>
    );
  }

  const level = user ? leagueToLevel(user.league) : 1;
  const fullName = [user?.last_name, user?.first_name, user?.patronymic].filter(Boolean).join(' ') || '—';

  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="px-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
            👤 ЛИЧНЫЙ КАБИНЕТ
          </div>
          <div className="px-text-dim" style={{ fontSize: '8px' }}>
            {user?.username} · LVL {level} · {user?.league}
          </div>
        </div>

        {/* Identity card */}
        <div className="px-card mb-6" style={{ border: '2px solid var(--px-cyan)', padding: '20px', background: 'rgba(0,229,255,0.03)' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)', marginBottom: '12px', letterSpacing: '2px' }}>
            ▸ ИДЕНТИФИКАЦИЯ
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'USERNAME', value: user?.username },
              { label: 'EMAIL', value: user?.email },
              { label: 'ПОЛНОЕ ИМЯ', value: fullName },
              { label: 'ЛИГА', value: user?.league },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '10px', background: 'var(--px-bg)', border: '1px solid var(--px-bg3)' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-white)', wordBreak: 'break-all' }}>{value ?? '—'}</div>
              </div>
            ))}
          </div>

          {/* Certificate link */}
          {user?.first_name && user?.last_name && (
            <div className="mt-4">
              <Link href="/certificate" className="px-btn px-btn-outline" style={{ textDecoration: 'none', fontSize: '8px' }}>
                🏆 ПОЛУЧИТЬ СЕРТИФИКАТ
              </Link>
            </div>
          )}
        </div>

        {/* Profile form */}
        <div className="px-card mb-6" style={{ border: '2px solid var(--px-bg3)', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)', marginBottom: '16px', letterSpacing: '2px' }}>
            ▸ ЛИЧНАЯ ИНФОРМАЦИЯ
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email read-only */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginBottom: '6px' }}>
                EMAIL (НЕ ИЗМЕНЯЕТСЯ)
              </label>
              <div style={{
                padding: '10px 12px',
                background: 'var(--px-bg)',
                border: '2px solid var(--px-bg3)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '8px',
                color: 'var(--px-gray)',
              }}>
                {user?.email}
              </div>
            </div>

            {[
              { label: 'ФАМИЛИЯ', value: lastName, set: setLastName, placeholder: 'Иванов' },
              { label: 'ИМЯ', value: firstName, set: setFirstName, placeholder: 'Иван' },
              { label: 'ОТЧЕСТВО', value: patronymic, set: setPatronymic, placeholder: 'Иванович' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginBottom: '6px' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--px-bg)',
                    border: '2px solid var(--px-bg3)',
                    color: 'var(--px-white)',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '9px',
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--px-green)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--px-bg3)'; }}
                />
              </div>
            ))}

            {profileMsg && (
              <div style={{
                padding: '8px 12px',
                fontFamily: 'var(--font-pixel)',
                fontSize: '8px',
                color: profileMsg.ok ? 'var(--px-green)' : 'var(--px-red)',
                border: `2px solid ${profileMsg.ok ? 'var(--px-green)' : 'var(--px-red)'}`,
                background: profileMsg.ok ? 'rgba(0,255,65,0.05)' : 'rgba(255,49,49,0.05)',
              }}>
                {profileMsg.ok ? '✓ ' : '✗ '}{profileMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="px-btn px-btn-green"
              style={{ alignSelf: 'flex-start' }}
            >
              {profileSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ▶'}
            </button>
          </form>
        </div>

        {/* Password change */}
        <div className="px-card" style={{ border: '2px solid var(--px-bg3)', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-yellow)', marginBottom: '16px', letterSpacing: '2px' }}>
            ▸ СМЕНА ПАРОЛЯ
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'ТЕКУЩИЙ ПАРОЛЬ', value: oldPwd, set: setOldPwd },
              { label: 'НОВЫЙ ПАРОЛЬ (мин. 8 символов)', value: newPwd, set: setNewPwd },
              { label: 'ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ', value: confirmPwd, set: setConfirmPwd },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginBottom: '6px' }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--px-bg)',
                    border: '2px solid var(--px-bg3)',
                    color: 'var(--px-white)',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '9px',
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--px-yellow)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--px-bg3)'; }}
                />
              </div>
            ))}

            {pwdMsg && (
              <div style={{
                padding: '8px 12px',
                fontFamily: 'var(--font-pixel)',
                fontSize: '8px',
                color: pwdMsg.ok ? 'var(--px-green)' : 'var(--px-red)',
                border: `2px solid ${pwdMsg.ok ? 'var(--px-green)' : 'var(--px-red)'}`,
                background: pwdMsg.ok ? 'rgba(0,255,65,0.05)' : 'rgba(255,49,49,0.05)',
              }}>
                {pwdMsg.ok ? '✓ ' : '✗ '}{pwdMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={pwdSaving}
              className="px-btn px-btn-outline"
              style={{ alignSelf: 'flex-start', borderColor: 'var(--px-yellow)', color: 'var(--px-yellow)' }}
            >
              {pwdSaving ? 'ПРИМЕНЕНИЕ...' : 'СМЕНИТЬ ПАРОЛЬ ▶'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
