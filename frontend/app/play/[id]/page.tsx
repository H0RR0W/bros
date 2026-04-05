'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, apiSubmitResult, apiGetMe, apiGetHistory } from '@/lib/api';
import Navbar from '@/components/Navbar';
import HPBar from '@/components/HPBar';
import PixelModal from '@/components/PixelModal';
import {
  ALL_MISSIONS,
  type ScenarioStep,
  type Choice,
  type EmailContent,
  type ChatContent,
  type BrowserContent,
  type PhoneContent,
  type NotifContent,
} from '@/lib/scenarios';

// ─── Email Renderer ───────────────────────────────────────────────────────────
function EmailRenderer({ content, onLinkHover, linkHovered }: {
  content: EmailContent;
  onLinkHover: (v: boolean) => void;
  linkHovered: boolean;
}) {
  return (
    <div className="px-terminal" style={{ border: '3px solid var(--px-cyan)' }}>
      {/* Email app bar */}
      <div style={{
        background: 'var(--px-cyan)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--px-bg)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
      }}>
        <span>📧</span>
        <span>РАБОЧАЯ ПОЧТА</span>
        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>INBOX (1 НОВОЕ)</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* From */}
        <div style={{ marginBottom: '8px', padding: '8px 10px', background: 'var(--px-bg)', border: '2px solid var(--px-bg3)' }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>ОТ: </span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-white)' }}>{content.from}</span>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-red)', marginTop: '3px' }}>
            ⚠ Реальный адрес: <span style={{ textDecoration: 'underline' }}>{content.fromReal}</span>
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'var(--px-bg)', border: '2px solid var(--px-bg3)' }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>ТЕМА: </span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-yellow)' }}>{content.subject}</span>
        </div>

        {/* Body */}
        <div style={{
          padding: '14px',
          background: '#fff',
          color: '#222',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.7',
          border: '2px solid var(--px-bg3)',
          whiteSpace: 'pre-wrap',
          position: 'relative',
        }}>
          {content.body.split(content.linkText ?? '___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && content.linkText && (
                <span
                  onMouseEnter={() => onLinkHover(true)}
                  onMouseLeave={() => onLinkHover(false)}
                  style={{
                    color: linkHovered ? '#cc0000' : '#1a73e8',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    background: linkHovered ? '#ffeeee' : 'transparent',
                    padding: '0 2px',
                    fontWeight: 'bold',
                  }}
                >
                  {content.linkText}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Link tooltip */}
        {linkHovered && content.linkUrl && (
          <div className="px-notification px-notification-danger" style={{ marginTop: '8px' }}>
            🔗 РЕАЛЬНАЯ ССЫЛКА: {content.linkUrl}
          </div>
        )}

        {/* Attachment */}
        {content.hasAttachment && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'var(--px-bg)',
            border: '2px solid var(--px-red)',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <span>📎</span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-red)' }}>
              {content.attachmentName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Renderer ────────────────────────────────────────────────────────────
function ChatRenderer({ content }: { content: ChatContent }) {
  return (
    <div className="px-terminal" style={{ border: '3px solid var(--px-green)' }}>
      <div style={{
        background: 'var(--px-green)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--px-bg)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
      }}>
        <span>💬</span>
        <span>{content.platform}</span>
      </div>

      {/* Chat header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '2px solid var(--px-bg3)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--px-bg3)',
          border: '2px solid var(--px-gray)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-pixel)',
          fontSize: '9px', color: 'var(--px-white)',
          flexShrink: 0,
        }}>
          {content.avatar}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-white)' }}>{content.sender}</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-green)' }}>● онлайн</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {content.messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'var(--px-bg3)',
              border: '2px solid var(--px-gray)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-pixel)', fontSize: '7px',
              flexShrink: 0, marginTop: '2px',
            }}>
              {content.avatar}
            </div>
            <div style={{
              background: 'var(--px-bg3)',
              padding: '8px 12px',
              border: '2px solid var(--px-bg3)',
              maxWidth: '80%',
              flex: 1,
            }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)', lineHeight: '1.8' }}>
                {msg.text}
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginTop: '4px', textAlign: 'right' }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Browser Renderer ─────────────────────────────────────────────────────────
function BrowserRenderer({ content }: { content: BrowserContent }) {
  const isSuspicious = !content.hasPadlock || content.url.includes('secure-login') || content.url.includes('accounts-security');

  return (
    <div className="px-terminal" style={{ border: `3px solid ${isSuspicious ? 'var(--px-red)' : 'var(--px-cyan)'}` }}>
      {/* Browser chrome */}
      <div style={{
        background: isSuspicious ? 'var(--px-red)' : 'var(--px-cyan)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--px-bg)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
      }}>
        <span>🌐</span>
        <span>{isSuspicious ? '⚠ НЕБЕЗОПАСНО' : 'БРАУЗЕР'}</span>
      </div>

      {/* Address bar */}
      <div style={{
        padding: '8px 14px',
        background: 'var(--px-bg)',
        borderBottom: '2px solid var(--px-bg3)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>{content.hasPadlock ? '🔒' : '⚠️'}</span>
        <div style={{
          flex: 1,
          padding: '6px 10px',
          background: isSuspicious ? 'rgba(255,49,49,0.1)' : '#fff',
          border: `2px solid ${isSuspicious ? 'var(--px-red)' : 'var(--px-bg3)'}`,
          fontFamily: 'monospace',
          fontSize: '11px',
          color: isSuspicious ? 'var(--px-red)' : '#333',
          wordBreak: 'break-all',
        }}>
          {content.hasPadlock ? 'https://' : 'http://'}{content.url}
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: '20px', background: '#f5f5f5' }}>
        {/* Fake bank page */}
        <div style={{
          maxWidth: '340px',
          margin: '0 auto',
          background: '#fff',
          padding: '24px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            fontFamily: 'Arial',
            fontSize: '18px',
            fontWeight: 'bold',
            color: content.faviconColor,
          }}>
            {content.title}
          </div>

          {content.formFields.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {content.formFields.map(field => (
                <input
                  key={field}
                  type={field.toLowerCase().includes('пароль') ? 'password' : 'text'}
                  placeholder={field}
                  onClick={(e) => e.preventDefault()}
                  readOnly
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    fontFamily: 'Arial',
                    fontSize: '13px',
                    width: '100%',
                    cursor: 'not-allowed',
                    background: '#fafafa',
                  }}
                />
              ))}
              <button
                disabled
                style={{
                  padding: '10px',
                  background: content.faviconColor,
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'Arial',
                  fontSize: '13px',
                  cursor: 'not-allowed',
                  opacity: 0.8,
                }}
              >
                Войти
              </button>
            </div>
          )}

          {content.formFields.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              fontFamily: 'Arial',
              fontSize: '14px',
              color: '#c00',
            }}>
              ⚠️ {content.title}
            </div>
          )}
        </div>

        {isSuspicious && (
          <div className="px-notification px-notification-danger" style={{ marginTop: '12px', background: 'rgba(255,49,49,0.15)' }}>
            ⚠ БРАУЗЕР ЗАБЛОКИРОВАЛ СТРАНИЦУ: сертификат сервера недействителен или домен является поддельным.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phone Renderer ───────────────────────────────────────────────────────────
function PhoneRenderer({ content }: { content: PhoneContent }) {
  return (
    <div className="px-terminal" style={{ border: '3px solid var(--px-yellow)' }}>
      <div style={{
        background: 'var(--px-yellow)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--px-bg)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
      }}>
        <span>📞</span>
        <span>ВХОДЯЩИЙ ЗВОНОК</span>
        <span className="animate-blink" style={{ marginLeft: 'auto' }}>● В ЭФИРЕ</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Caller info */}
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'var(--px-bg)',
          border: '2px solid var(--px-bg3)',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-white)', marginBottom: '4px' }}>
            {content.caller}
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-gray)' }}>
            {content.callerNumber}
          </div>
        </div>

        {/* Transcript */}
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginBottom: '8px' }}>
          ТРАНСКРИПЦИЯ РАЗГОВОРА:
        </div>
        <div style={{
          padding: '12px',
          background: 'var(--px-bg)',
          border: '2px solid var(--px-bg3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {content.transcript.map((line, i) => (
            <div key={i} style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: line.includes('Добрый') || line.includes('По вашей') || line.includes('Для') || line.includes('Также') ? '#aaa' : '#aaa',
              lineHeight: '1.6',
              padding: '4px 0',
              borderBottom: i < content.transcript.length - 1 ? '1px solid var(--px-bg3)' : 'none',
            }}>
              {line}
            </div>
          ))}
        </div>

        <div className="px-notification px-notification-danger" style={{ marginTop: '10px' }}>
          ⚠ Настоящий банк НИКОГДА не просит CVV и SMS-коды по телефону
        </div>
      </div>
    </div>
  );
}

// ─── Notification Renderer ────────────────────────────────────────────────────
function NotifRenderer({ content }: { content: NotifContent }) {
  return (
    <div className="px-terminal" style={{ border: '3px solid var(--px-green)' }}>
      <div style={{
        background: 'var(--px-green)',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--px-bg)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '9px',
      }}>
        <span>📲</span>
        <span>СИСТЕМНОЕ УВЕДОМЛЕНИЕ</span>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Device mockup */}
        <div style={{
          maxWidth: '320px',
          margin: '0 auto',
          background: '#1c1c1e',
          borderRadius: '12px',
          padding: '16px',
          border: '2px solid var(--px-bg3)',
        }}>
          {/* Notif card */}
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>{content.icon}</span>
              <span style={{ color: '#fff', fontFamily: 'Arial', fontSize: '13px', fontWeight: 'bold' }}>{content.app}</span>
              <span style={{ color: '#999', fontFamily: 'Arial', fontSize: '11px', marginLeft: 'auto' }}>сейчас</span>
            </div>
            <div style={{ color: '#fff', fontFamily: 'Arial', fontSize: '12px', lineHeight: '1.5', marginBottom: '10px', whiteSpace: 'pre-line' }}>
              {content.message}
            </div>
            {content.action && (
              <div style={{
                color: '#0af',
                fontFamily: 'Arial',
                fontSize: '11px',
                padding: '6px',
                background: 'rgba(0,170,255,0.15)',
                borderRadius: '4px',
                textAlign: 'center',
              }}>
                {content.action}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const mission = ALL_MISSIONS.find(m => m.slug === id);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    // Enforce unlock gates
    if (id === '2' || id === '3') {
      Promise.all([apiGetMe(), apiGetHistory()]).then(([user, hist]) => {
        const isAgent = user.league !== 'Новичок';
        const homeCompleted = hist.sessions.some((s: { location: string }) => s.location === 'home');
        if (id === '2' && !isAgent) router.push('/missions');
        if (id === '3' && !homeCompleted) router.push('/missions');
      }).catch(() => router.push('/'));
    }
  }, [router, id]);

  // Shuffle once on mount
  const [shuffledSteps, setShuffledSteps] = useState(() =>
    mission ? [...mission.steps].sort(() => Math.random() - 0.5) : []
  );
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>(() =>
    shuffledSteps[0] ? [...shuffledSteps[0].choices].sort(() => Math.random() - 0.5) : []
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [choiceAnimation, setChoiceAnimation] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  if (!mission) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center">
        <div className="px-card px-border" style={{ padding: '32px', textAlign: 'center' }}>
          <div className="px-title" style={{ fontSize: '14px', marginBottom: '16px' }}>МИССИЯ НЕ НАЙДЕНА</div>
          <Link href="/missions" className="px-btn px-btn-outline" style={{ textDecoration: 'none' }}>
            ← НАЗАД
          </Link>
        </div>
      </div>
    );
  }

  const step: ScenarioStep = shuffledSteps[currentStepIndex] ?? mission.steps[currentStepIndex];
  const isLastStep = currentStepIndex === shuffledSteps.length - 1;
  const hpPct = Math.max(0, hp);

  const handleChoiceSelect = (choice: Choice) => {
    if (selectedChoice) return;
    setChoiceAnimation(choice.id);
    setSelectedChoice(choice);
    const newHp = Math.max(0, Math.min(100, hp + choice.hpDelta));
    setHp(newHp);
    if (choice.isCorrect) {
      setScore(s => s + Math.max(0, 30 + choice.hpDelta));
      setCorrectCount(c => c + 1);
    }
    setTimeout(() => setModalOpen(true), 400);
  };

  const handleNext = () => {
    setModalOpen(false);
    if (isLastStep) {
      // Save results to backend
      const locationMap: Record<string, string> = { '1': 'office', '2': 'home', '3': 'wifi' };
      const location = locationMap[id] ?? 'office';
      const hpDelta = hp - 100; // net change from starting 100
      apiSubmitResult({
        location,
        steps_count: mission.steps.length,
        correct_count: correctCount,
        hp_delta: hpDelta,
        score,
      }).catch(() => { /* silent fail — don't break UI */ });
      setCompleted(true);
    } else {
      setTimeout(() => {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        setSelectedChoice(null);
        setChoiceAnimation(null);
        setLinkHovered(false);
        const nextStep = shuffledSteps[nextIndex];
        if (nextStep) {
          setShuffledChoices([...nextStep.choices].sort(() => Math.random() - 0.5));
        }
      }, 300);
    }
  };

  const modalType = selectedChoice
    ? selectedChoice.isCorrect ? 'success' : selectedChoice.hpDelta < -30 ? 'danger' : 'warning'
    : 'info';

  const modalTitle = selectedChoice
    ? selectedChoice.isCorrect ? '✓ ВЕРНОЕ РЕШЕНИЕ' : selectedChoice.hpDelta < -30 ? '✗ КРИТИЧЕСКАЯ ОШИБКА' : '! НЕВЕРНОЕ ДЕЙСТВИЕ'
    : '';

  // ─── Mission Complete Screen ─────────────────────────────────────────────────
  if (completed) {
    const grade = hp >= 80 ? 'S' : hp >= 60 ? 'A' : hp >= 40 ? 'B' : hp >= 20 ? 'C' : 'D';
    const gradeColor = hp >= 80 ? 'var(--px-green)' : hp >= 60 ? 'var(--px-cyan)' : hp >= 40 ? 'var(--px-yellow)' : 'var(--px-red)';

    return (
      <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
        <Navbar hp={hp} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <div className="px-card" style={{ border: `3px solid ${gradeColor}`, boxShadow: `0 0 40px ${gradeColor}44`, padding: '32px', textAlign: 'center' }}>
              {/* Grade */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '80px',
                  color: gradeColor,
                  textShadow: `0 0 20px ${gradeColor}, 0 0 40px ${gradeColor}`,
                  lineHeight: 1,
                  marginBottom: '8px',
                }}>
                  {grade}
                </div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: gradeColor }}>
                  {hp >= 80 ? 'ПРЕВОСХОДНО!' : hp >= 60 ? 'ХОРОШАЯ РАБОТА' : hp >= 40 ? 'НЕПЛОХО' : 'НУЖНА ПРАКТИКА'}
                </div>
              </div>

              <div className="px-title" style={{ fontSize: '12px', marginBottom: '24px' }}>
                {mission.title} — ЗАВЕРШЕНА
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'HP ОСТАЛОСЬ', value: `${hp}%`, color: hp > 60 ? 'var(--px-green)' : 'var(--px-red)' },
                  { label: 'ОЧКИ', value: score, color: 'var(--px-cyan)' },
                  { label: 'ШАГОВ', value: mission.steps.length, color: 'var(--px-yellow)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-card" style={{ padding: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color, marginBottom: '4px' }}>{value}</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* HP Bar */}
              <div style={{ marginBottom: '24px' }}>
                <HPBar current={hp} max={100} label="ИТОГОВЫЙ HP" />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  className="px-btn px-btn-outline"
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setHp(100);
                    setScore(0);
                    setSelectedChoice(null);
                    setChoiceAnimation(null);
                    setCompleted(false);
                    setCorrectCount(0);
                    setCurrentStepIndex(0);
                    const reshuffledSteps = [...mission.steps].sort(() => Math.random() - 0.5);
                    setShuffledSteps(reshuffledSteps);
                    setShuffledChoices([...reshuffledSteps[0].choices].sort(() => Math.random() - 0.5));
                  }}
                >
                  ↺ ЗАНОВО
                </button>
                <Link href="/missions" className="px-btn px-btn-green" style={{ textDecoration: 'none' }}>
                  ▶ СЛЕДУЮЩАЯ МИССИЯ
                </Link>
                <Link href="/dashboard" className="px-btn px-btn-ghost" style={{ textDecoration: 'none' }}>
                  НА БАЗУ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar hp={hp} />

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-5 flex-1">
        {/* Top mission bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/missions" style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', textDecoration: 'none' }}>
              ← МИССИИ
            </Link>
            <span style={{ color: 'var(--px-gray)' }}>/</span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)' }}>
              {mission.title}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
            ШАГ {currentStepIndex + 1} / {mission.steps.length}
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-2">
          {mission.steps.map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                height: '6px',
                background: i < currentStepIndex
                  ? 'var(--px-green)'
                  : i === currentStepIndex
                  ? 'var(--px-cyan)'
                  : 'var(--px-bg3)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* HP Bar */}
        <HPBar current={hp} max={100} label="УРОВЕНЬ БЕЗОПАСНОСТИ" size="lg" />

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          {/* LEFT — Scenario display */}
          <div className="flex flex-col gap-4">
            {/* Step header */}
            <div className="px-card" style={{ padding: '14px 18px', borderTop: '3px solid var(--px-cyan)' }}>
              <div className="px-subtitle" style={{ fontSize: '10px', marginBottom: '6px' }}>
                📍 {step.title}
              </div>
              <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2' }}>
                {step.description}
              </p>
            </div>

            {/* Scenario content */}
            <div>
              {step.type === 'email' && (
                <EmailRenderer
                  content={step.content as EmailContent}
                  onLinkHover={setLinkHovered}
                  linkHovered={linkHovered}
                />
              )}
              {step.type === 'chat' && (
                <ChatRenderer content={step.content as ChatContent} />
              )}
              {step.type === 'browser' && (
                <BrowserRenderer content={step.content as BrowserContent} />
              )}
              {step.type === 'phone' && (
                <PhoneRenderer content={step.content as PhoneContent} />
              )}
              {step.type === 'notification' && (
                <NotifRenderer content={step.content as NotifContent} />
              )}
            </div>
          </div>

          {/* RIGHT — Choices */}
          <div className="flex flex-col gap-4">
            <div className="px-card" style={{ padding: '14px 18px', borderTop: '3px solid var(--px-yellow)' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-yellow)', marginBottom: '6px' }}>
                ⚡ ВЫБЕРИТЕ ДЕЙСТВИЕ
              </div>
              <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2' }}>
                Что вы будете делать в данной ситуации?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {shuffledChoices.map((choice, i) => {
                const isSelected = selectedChoice?.id === choice.id;
                const isRevealed = selectedChoice !== null;
                const isCorrectRevealed = isRevealed && choice.isCorrect;
                const isWrongSelected = isSelected && !choice.isCorrect;

                let borderColor = 'var(--px-bg3)';
                let bg = 'var(--px-bg2)';
                if (isCorrectRevealed) { borderColor = 'var(--px-green)'; bg = 'rgba(0,255,65,0.08)'; }
                if (isWrongSelected) { borderColor = 'var(--px-red)'; bg = 'rgba(255,49,49,0.08)'; }

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={!!selectedChoice}
                    className={choiceAnimation === choice.id ? 'animate-spawn' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      background: bg,
                      border: `3px solid ${borderColor}`,
                      cursor: selectedChoice ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? `4px 4px 0px ${borderColor}88` : 'none',
                    }}
                  >
                    {/* Choice letter */}
                    <div style={{
                      width: '28px', height: '28px',
                      background: isCorrectRevealed ? 'var(--px-green)' : isWrongSelected ? 'var(--px-red)' : 'var(--px-bg3)',
                      border: `2px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '10px',
                      color: (isCorrectRevealed || isWrongSelected) ? 'var(--px-bg)' : 'var(--px-gray)',
                      flexShrink: 0,
                    }}>
                      {isCorrectRevealed ? '✓' : isWrongSelected ? '✗' : String.fromCharCode(65 + i)}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '9px',
                        color: isCorrectRevealed ? 'var(--px-green)' : isWrongSelected ? 'var(--px-red)' : 'var(--px-white)',
                        lineHeight: '1.8',
                        marginBottom: isRevealed ? '6px' : 0,
                      }}>
                        {choice.text}
                      </div>

                      {/* HP delta hint when revealed */}
                      {isRevealed && (isSelected || isCorrectRevealed) && (
                        <div style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '8px',
                          color: choice.hpDelta > 0 ? 'var(--px-green)' : 'var(--px-red)',
                          textShadow: `0 0 6px ${choice.hpDelta > 0 ? 'var(--px-green)' : 'var(--px-red)'}`,
                        }}>
                          {choice.hpDelta > 0 ? `+${choice.hpDelta}` : choice.hpDelta} HP
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hint */}
            {!selectedChoice && (
              <div className="px-notification px-notification-info">
                💡 Внимательно изучи сценарий перед выбором. Наведи курсор на ссылки.
              </div>
            )}

            {/* Score */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'var(--px-bg)',
              border: '2px solid var(--px-bg3)',
            }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>СЧЁТ</span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', color: 'var(--px-cyan)' }}>{score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {selectedChoice && (
        <PixelModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          type={modalType}
          title={modalTitle}
          explanation={selectedChoice.explanation}
          hpDelta={selectedChoice.hpDelta}
          onNext={handleNext}
          isLastStep={isLastStep}
          cweId={step.cweId}
          owaspCategory={step.owaspCategory}
        />
      )}
    </div>
  );
}
