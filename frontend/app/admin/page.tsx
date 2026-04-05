'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  isAuthenticated, apiGetMe,
  apiAdminGetUsers, apiAdminDeleteUser, apiAdminEditUser,
  apiAdminUpdateRole, apiAdminUpdateStatus,
  apiAdminGetStats, apiAdminCreateScenario, apiAdminGetLogs,
  type AdminUserItem, type AdminLogItem, type AdminStats,
} from '@/lib/api';

type Tab = 'users' | 'stats' | 'scenario' | 'logs';

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>
      {children}
    </span>
  );
}
function Val({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', color: color ?? 'var(--px-white)' }}>
      {children}
    </span>
  );
}
function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'var(--font-pixel)', fontSize: '7px',
      padding: '2px 6px',
      border: `1px solid ${color}`,
      color, background: `${color}18`,
    }}>{children}</span>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
function TabBar({ active, setActive }: { active: Tab; setActive: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'users', label: 'ПОЛЬЗОВАТЕЛИ' },
    { id: 'stats', label: 'СТАТИСТИКА' },
    { id: 'scenario', label: '+ СЦЕНАРИЙ' },
    { id: 'logs', label: 'ЛОГИ' },
  ];
  return (
    <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--px-bg3)', paddingBottom: '2px' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '8px', letterSpacing: '1px',
            padding: '8px 16px', cursor: 'pointer',
            color: active === t.id ? 'var(--px-bg)' : 'var(--px-gray)',
            background: active === t.id ? 'var(--px-green)' : 'transparent',
            border: `2px solid ${active === t.id ? 'var(--px-green)' : 'transparent'}`,
            transition: 'all 0.1s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Users tab ───────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ username: string; email: string }>({ username: '', email: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiAdminGetUsers(page, 20, search || undefined);
      setUsers(r.users); setTotal(r.total);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleDelete = async (u: AdminUserItem) => {
    if (!confirm(`Удалить пользователя ${u.username}?`)) return;
    try { await apiAdminDeleteUser(u.id); flash('Удалено'); load(); }
    catch (e: any) { flash(e.message); }
  };

  const startEdit = (u: AdminUserItem) => {
    setEditId(u.id);
    setEditData({ username: u.username, email: u.email });
  };

  const saveEdit = async () => {
    if (!editId) return;
    try { await apiAdminEditUser(editId, editData); flash('Сохранено'); setEditId(null); load(); }
    catch (e: any) { flash(e.message); }
  };

  const toggleRole = async (u: AdminUserItem) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try { await apiAdminUpdateRole(u.id, newRole); load(); }
    catch (e: any) { flash(e.message); }
  };

  const toggleStatus = async (u: AdminUserItem) => {
    try { await apiAdminUpdateStatus(u.id, !u.is_active); load(); }
    catch (e: any) { flash(e.message); }
  };

  const pages = Math.ceil(total / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {msg && (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', padding: '8px 12px', border: '1px solid var(--px-green)', color: 'var(--px-green)', background: 'rgba(0,255,65,0.06)' }}>
          {msg}
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск по email / username..."
          style={{
            flex: 1, fontFamily: 'var(--font-pixel)', fontSize: '8px',
            padding: '8px 12px', background: 'var(--px-bg)', border: '2px solid var(--px-bg3)',
            color: 'var(--px-white)', outline: 'none',
          }}
        />
        <button className="px-btn px-btn-outline" style={{ fontSize: '7px' }} onClick={() => load()}>
          НАЙТИ
        </button>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--px-bg3)' }}>
                {['USERNAME', 'EMAIL', 'РОЛЬ', 'ЛИГА', 'ОЧКИ', 'СТАТУС', 'ДАТА', 'ДЕЙСТВИЯ'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                editId === u.id ? (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--px-bg3)', background: 'rgba(0,255,65,0.03)' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <input value={editData.username} onChange={e => setEditData(d => ({ ...d, username: e.target.value }))}
                        style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', background: 'var(--px-bg)', border: '1px solid var(--px-green)', color: 'var(--px-white)', padding: '4px 6px', width: '100px' }} />
                    </td>
                    <td style={{ padding: '8px 10px' }} colSpan={6}>
                      <input value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                        style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', background: 'var(--px-bg)', border: '1px solid var(--px-green)', color: 'var(--px-white)', padding: '4px 6px', width: '180px' }} />
                    </td>
                    <td style={{ padding: '8px 10px', display: 'flex', gap: '6px' }}>
                      <button className="px-btn px-btn-green" style={{ fontSize: '7px', padding: '4px 8px' }} onClick={saveEdit}>✓</button>
                      <button className="px-btn px-btn-outline" style={{ fontSize: '7px', padding: '4px 8px' }} onClick={() => setEditId(null)}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--px-bg3)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)' }}>{u.username}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>{u.email}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <Pill color={u.role === 'admin' ? 'var(--px-yellow)' : 'var(--px-gray)'}>{u.role}</Pill>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)' }}>{u.league}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>{u.total_score}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <Pill color={u.is_active ? 'var(--px-green)' : 'var(--px-red)'}>{u.is_active ? 'ON' : 'OFF'}</Pill>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>{u.created_at}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button title="Редактировать" onClick={() => startEdit(u)}
                          style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 7px', border: '1px solid var(--px-cyan)', color: 'var(--px-cyan)', background: 'transparent', cursor: 'pointer' }}>✏</button>
                        <button title={u.role === 'admin' ? 'Снять права' : 'Сделать админом'} onClick={() => toggleRole(u)}
                          style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 7px', border: '1px solid var(--px-yellow)', color: 'var(--px-yellow)', background: 'transparent', cursor: 'pointer' }}>
                          {u.role === 'admin' ? '▼' : '★'}
                        </button>
                        <button title={u.is_active ? 'Деактивировать' : 'Активировать'} onClick={() => toggleStatus(u)}
                          style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 7px', border: '1px solid var(--px-gray)', color: 'var(--px-gray)', background: 'transparent', cursor: 'pointer' }}>
                          {u.is_active ? '⏸' : '▶'}
                        </button>
                        <button title="Удалить" onClick={() => handleDelete(u)}
                          style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 7px', border: '1px solid var(--px-red)', color: 'var(--px-red)', background: 'transparent', cursor: 'pointer' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="px-btn px-btn-outline" style={{ fontSize: '7px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>◀</button>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>{page} / {pages} (всего: {total})</span>
          <button className="px-btn px-btn-outline" style={{ fontSize: '7px' }} disabled={page === pages} onClick={() => setPage(p => p + 1)}>▶</button>
        </div>
      )}
    </div>
  );
}

// ─── Stats tab ────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdminGetStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>;
  if (!stats) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {[
          { label: 'ПОЛЬЗОВАТЕЛИ', value: stats.total_users, color: 'var(--px-cyan)' },
          { label: 'АКТИВНЫ (7 ДНЕЙ)', value: stats.active_users_7d, color: 'var(--px-green)' },
          { label: 'СЕССИИ', value: stats.total_sessions, color: 'var(--px-yellow)' },
          { label: 'ТОЧНОСТЬ %', value: `${stats.avg_accuracy}%`, color: 'var(--px-green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '20px', border: '2px solid var(--px-bg3)', background: 'var(--px-bg)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <Label>{label}</Label>
            <Val color={color}>{value}</Val>
          </div>
        ))}
      </div>

      {/* By location */}
      <div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', marginBottom: '12px', letterSpacing: '2px' }}>СЦЕНАРИИ ПО ЛОКАЦИИ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(stats.scenarios_by_location).map(([loc, cnt]) => (
            <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)', width: '60px' }}>{loc}</span>
              <div style={{ flex: 1, height: '8px', background: 'var(--px-bg3)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  background: 'var(--px-green)',
                  width: `${Math.min((cnt / Math.max(...Object.values(stats.scenarios_by_location))) * 100, 100)}%`,
                }} />
              </div>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>{cnt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By type */}
      <div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', marginBottom: '12px', letterSpacing: '2px' }}>СЦЕНАРИИ ПО ТИПУ АТАКИ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(stats.scenarios_by_type).map(([type, cnt]) => (
            <div key={type} style={{
              padding: '6px 12px', border: '1px solid var(--px-bg3)',
              fontFamily: 'var(--font-pixel)', fontSize: '7px',
              color: 'var(--px-cyan)',
            }}>
              {type}: <span style={{ color: 'var(--px-white)' }}>{cnt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add Scenario tab ─────────────────────────────────────────────────────────
const LOCATIONS = ['office', 'home', 'wifi'];
const ATTACK_TYPES = ['phishing', 'bec', 'social-engineering', 'credential_stuffing', 'vishing', 'deepfake', 'mitm', 'evil_twin', 'password', 'smishing', 'qr_phishing', 'fake_app'];

function ScenarioTab() {
  const [form, setForm] = useState({
    location: 'office',
    attack_type: 'phishing',
    cwe_id: '',
    owasp_category: '',
    scenario_text: '',
    correct_answer_id: 'a',
    explanation_wrong: '',
    explanation_correct: '',
  });
  const [options, setOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!form.scenario_text.trim()) { setError('Заполните текст сценария'); return; }
    if (options.some(o => !o.text.trim())) { setError('Заполните все варианты ответов'); return; }
    setSaving(true);
    try {
      await apiAdminCreateScenario({
        ...form,
        answer_options: options.map(o => ({ id: o.id, text: o.text })),
      });
      setMsg('Сценарий добавлен!');
      // reset
      setForm(f => ({ ...f, scenario_text: '', cwe_id: '', owasp_category: '', explanation_wrong: '', explanation_correct: '' }));
      setOptions([{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }]);
      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--font-pixel)', fontSize: '8px',
    padding: '8px 12px', background: 'var(--px-bg)', border: '2px solid var(--px-bg3)',
    color: 'var(--px-white)', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      {msg && <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', padding: '8px 12px', border: '1px solid var(--px-green)', color: 'var(--px-green)', background: 'rgba(0,255,65,0.06)' }}>{msg}</div>}
      {error && <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', padding: '8px 12px', border: '1px solid var(--px-red)', color: 'var(--px-red)', background: 'rgba(255,49,49,0.06)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>ЛОКАЦИЯ</Label>
          <select style={selectStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>ТИП АТАКИ</Label>
          <select style={selectStyle} value={form.attack_type} onChange={e => setForm(f => ({ ...f, attack_type: e.target.value }))}>
            {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>CWE ID (напр. CWE-306)</Label>
          <input style={inputStyle} value={form.cwe_id} onChange={e => setForm(f => ({ ...f, cwe_id: e.target.value }))} placeholder="CWE-xxx" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>OWASP КАТЕГОРИЯ (напр. A01)</Label>
          <input style={inputStyle} value={form.owasp_category} onChange={e => setForm(f => ({ ...f, owasp_category: e.target.value }))} placeholder="A01" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label>ТЕКСТ СЦЕНАРИЯ</Label>
        <textarea
          rows={5} style={{ ...inputStyle, resize: 'vertical' }}
          value={form.scenario_text}
          onChange={e => setForm(f => ({ ...f, scenario_text: e.target.value }))}
          placeholder="Опишите ситуацию атаки..."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Label>ВАРИАНТЫ ОТВЕТОВ</Label>
        {options.map((opt, i) => (
          <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: form.correct_answer_id === opt.id ? 'var(--px-green)' : 'var(--px-gray)', width: '20px', flexShrink: 0 }}>
              {opt.id.toUpperCase()}
            </span>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={opt.text}
              onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, text: e.target.value } : o))}
              placeholder={`Вариант ${opt.id.toUpperCase()}...`}
            />
            <button
              onClick={() => setForm(f => ({ ...f, correct_answer_id: opt.id }))}
              title="Пометить как верный"
              style={{
                fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '6px 10px', cursor: 'pointer',
                border: `1px solid ${form.correct_answer_id === opt.id ? 'var(--px-green)' : 'var(--px-bg3)'}`,
                color: form.correct_answer_id === opt.id ? 'var(--px-green)' : 'var(--px-gray)',
                background: form.correct_answer_id === opt.id ? 'rgba(0,255,65,0.1)' : 'transparent',
              }}
            >
              ✓ ВЕРНЫЙ
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label>ОБЪЯСНЕНИЕ (НЕВЕРНЫЙ ОТВЕТ)</Label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.explanation_wrong} onChange={e => setForm(f => ({ ...f, explanation_wrong: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label>ОБЪЯСНЕНИЕ (ВЕРНЫЙ ОТВЕТ)</Label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.explanation_correct} onChange={e => setForm(f => ({ ...f, explanation_correct: e.target.value }))} />
      </div>

      <button className="px-btn px-btn-green" style={{ alignSelf: 'flex-start' }} onClick={handleSubmit} disabled={saving}>
        {saving ? 'СОХРАНЕНИЕ...' : '+ ДОБАВИТЬ СЦЕНАРИЙ'}
      </button>
    </div>
  );
}

// ─── Logs tab ─────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  delete_user: 'Удаление пользователя',
  edit_user: 'Редактирование пользователя',
  update_role: 'Смена роли',
  update_status: 'Смена статуса',
};

function LogsTab() {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiAdminGetLogs(page, 30);
      setLogs(r.logs); setTotal(r.total);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / 30);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loading ? (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>
      ) : logs.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>Логи пусты</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '12px 16px', border: '1px solid var(--px-bg3)', background: 'var(--px-bg)',
              display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap',
            }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', minWidth: '130px', flexShrink: 0 }}>
                {log.created_at}
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-yellow)', minWidth: '100px' }}>
                {log.admin_username}
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)' }}>
                {ACTION_LABELS[log.action] ?? log.action}
              </div>
              {log.details && (
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>
                  {log.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="px-btn px-btn-outline" style={{ fontSize: '7px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>◀</button>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>{page} / {pages} (всего: {total})</span>
          <button className="px-btn px-btn-outline" style={{ fontSize: '7px' }} disabled={page === pages} onClick={() => setPage(p => p + 1)}>▶</button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    apiGetMe()
      .then(u => {
        if (u.role !== 'admin') router.push('/dashboard');
        else setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center" style={{ background: 'var(--px-bg)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: 'var(--px-yellow)', letterSpacing: '3px', marginBottom: '4px' }}>
              ПАНЕЛЬ АДМИНИСТРАТОРА
            </div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
              // CYBERGUARD ADMIN CONTROL
            </div>
          </div>
          <div style={{
            padding: '6px 14px',
            border: '2px solid var(--px-red)',
            fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-red)',
          }}>
            ⚠ RESTRICTED
          </div>
        </div>

        {/* Card */}
        <div className="px-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <TabBar active={tab} setActive={setTab} />
          <div>
            {tab === 'users' && <UsersTab />}
            {tab === 'stats' && <StatsTab />}
            {tab === 'scenario' && <ScenarioTab />}
            {tab === 'logs' && <LogsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
