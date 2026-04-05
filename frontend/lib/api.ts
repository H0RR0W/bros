const API_BASE = '/api';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cyberguard_token');
}

export function setToken(token: string) {
  localStorage.setItem('cyberguard_token', token);
}

export function clearToken() {
  localStorage.removeItem('cyberguard_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: string;
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function apiRegister(
  email: string,
  username: string,
  password: string,
): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
  setToken(data.access_token);
  return data;
}

export function apiLogout() {
  clearToken();
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserMe {
  id: string;
  email: string;
  username: string;
  role: string;
  hp: number;
  total_score: number;
  league: string;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
}

export async function apiGetMe(): Promise<UserMe> {
  return apiFetch<UserMe>('/auth/me');
}

export async function apiUpdateProfile(data: {
  first_name?: string | null;
  last_name?: string | null;
  patronymic?: string | null;
}): Promise<UserMe> {
  return apiFetch<UserMe>('/auth/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiChangePassword(old_password: string, new_password: string): Promise<void> {
  return apiFetch('/auth/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password, new_password }),
  });
}

export interface UserStats {
  total_sessions: number;
  total_correct: number;
  total_answers: number;
  accuracy_percent: number;
  attacks_by_type: Record<string, number>;
}

export async function apiGetStats(): Promise<UserStats> {
  return apiFetch<UserStats>('/users/me/stats');
}

export interface SessionHistoryItem {
  id: string;
  location: string;
  score: number;
  accuracy: number;
  correct_count: number;
  scenarios_count: number;
  date: string;
}

export async function apiGetHistory(): Promise<{ sessions: SessionHistoryItem[]; total: number }> {
  return apiFetch('/users/me/history');
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_score: number;
  league: string;
}

export async function apiGetLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  return apiFetch(`/leaderboard?limit=${limit}`);
}

export interface MyRank {
  rank: number | null;
  total_score: number;
  league: string;
  percentile: number | null;
}

export async function apiGetMyRank(): Promise<MyRank> {
  return apiFetch('/leaderboard/me');
}

// ─── Game ─────────────────────────────────────────────────────────────────────

export interface SubmitResultRequest {
  location: string;      // office | home | wifi
  steps_count: number;
  correct_count: number;
  hp_delta: number;
  score: number;
}

export interface SubmitResultResponse {
  hp_new: number;
  total_score: number;
  league: string;
  league_changed: boolean;
}

export async function apiSubmitResult(data: SubmitResultRequest): Promise<SubmitResultResponse> {
  return apiFetch('/game/submit-result', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── AI Mode ─────────────────────────────────────────────────────────────────

export interface AIScenario {
  scenario_id: string;
  attack_type: string;
  cwe_id: string;
  owasp_category: string;
  scenario_text: string;
  answer_options: { id: string; text: string; is_correct: boolean }[];
  correct_answer_id: string;
  explanation_wrong: string;
  explanation_correct: string;
}

export const AI_ATTACK_TYPES = [
  'phishing', 'bec', 'social-engineering', 'credential_stuffing',
  'vishing', 'deepfake', 'mitm', 'evil_twin', 'password', 'smishing',
  'qr_phishing', 'fake_app',
] as const;

export async function apiGenerateAIScenario(attack_type: string): Promise<AIScenario> {
  return apiFetch<AIScenario>(`/game/ai-generate?attack_type=${encodeURIComponent(attack_type)}`);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUserItem {
  id: string;
  email: string;
  username: string;
  role: string;
  league: string;
  total_score: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminLogItem {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users_7d: number;
  total_sessions: number;
  avg_accuracy: number;
  scenarios_by_location: Record<string, number>;
  scenarios_by_type: Record<string, number>;
}

export interface AdminScenarioCreateRequest {
  location: string;
  attack_type: string;
  cwe_id: string;
  owasp_category: string;
  scenario_text: string;
  answer_options: { id: string; text: string }[];
  correct_answer_id: string;
  explanation_wrong: string;
  explanation_correct: string;
}

export async function apiAdminGetUsers(page = 1, limit = 50, search?: string): Promise<{ users: AdminUserItem[]; total: number }> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) q.set('search', search);
  return apiFetch(`/admin/users?${q}`);
}

export async function apiAdminDeleteUser(userId: string): Promise<void> {
  return apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function apiAdminEditUser(userId: string, data: {
  username?: string; email?: string; first_name?: string; last_name?: string; patronymic?: string;
}): Promise<void> {
  return apiFetch(`/admin/users/${userId}/edit`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiAdminUpdateRole(userId: string, role: string): Promise<void> {
  return apiFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

export async function apiAdminUpdateStatus(userId: string, is_active: boolean): Promise<void> {
  return apiFetch(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
}

export async function apiAdminGetStats(): Promise<AdminStats> {
  return apiFetch('/admin/stats');
}

export async function apiAdminCreateScenario(data: AdminScenarioCreateRequest): Promise<{ scenario_id: string }> {
  return apiFetch('/admin/scenarios', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiAdminGetLogs(page = 1, limit = 50): Promise<{ logs: AdminLogItem[]; total: number }> {
  return apiFetch(`/admin/logs?page=${page}&limit=${limit}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEAGUE_LEVELS: Record<string, number> = {
  'Новичок': 1,
  'Осведомлённый': 3,
  'Защитник': 6,
  'Эксперт': 10,
};

export function leagueToLevel(league: string): number {
  return LEAGUE_LEVELS[league] ?? 1;
}
