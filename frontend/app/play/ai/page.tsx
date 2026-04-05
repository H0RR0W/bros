'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PixelModal from '@/components/PixelModal';
import HPBar from '@/components/HPBar';
import {
  isAuthenticated,
  apiGenerateAIScenario,
  apiSubmitResult,
  AI_ATTACK_TYPES,
  type AIScenario,
} from '@/lib/api';

const ATTACK_LABELS: Record<string, string> = {
  phishing: 'Фишинг',
  bec: 'BEC / CEO-мошенничество',
  'social-engineering': 'Социальная инженерия',
  credential_stuffing: 'Credential Stuffing',
  vishing: 'Вишинг',
  deepfake: 'Дипфейк',
  mitm: 'MITM-атака',
  evil_twin: 'Evil Twin Wi-Fi',
  password: 'Взлом пароля',
  smishing: 'Смишинг',
  qr_phishing: 'QR-фишинг',
  fake_app: 'Поддельное приложение',
};

const TOTAL_STEPS = 5;

// Pick 5 unique random attack types
function pickAttackTypes(): string[] {
  const shuffled = [...AI_ATTACK_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TOTAL_STEPS);
}

type GamePhase = 'loading' | 'playing' | 'answered' | 'complete';

export default function AIPlayPage() {
  const router = useRouter();

  const [attackQueue] = useState<string[]>(() => pickAttackTypes());
  const [stepIndex, setStepIndex] = useState(0);
  const [scenario, setScenario] = useState<AIScenario | null>(null);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [error, setError] = useState<string | null>(null);

  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<AIScenario['answer_options']>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [dots, setDots] = useState('');

  const loadingRef = useRef<NodeJS.Timeout | null>(null);
  const dotsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
  }, [router]);

  // Animated dots while loading
  useEffect(() => {
    if (phase === 'loading') {
      dotsRef.current = setInterval(() => {
        setDots(d => d.length >= 3 ? '' : d + '.');
      }, 400);
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current);
      setDots('');
    }
    return () => { if (dotsRef.current) clearInterval(dotsRef.current); };
  }, [phase]);

  // Typewriter effect for scenario text
  useEffect(() => {
    if (phase === 'playing' && scenario) {
      setTypedText('');
      const text = scenario.scenario_text;
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setTypedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 14);
      return () => clearInterval(interval);
    }
  }, [phase, scenario]);

  // Fetch next scenario
  const fetchScenario = async (index: number) => {
    setPhase('loading');
    setScenario(null);
    setSelectedId(null);
    setError(null);
    setTypedText('');
    try {
      const data = await apiGenerateAIScenario(attackQueue[index]);
      const shuffled = [...data.answer_options].sort(() => Math.random() - 0.5);
      setShuffledOptions(shuffled);
      setScenario(data);
      setPhase('playing');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации');
      setPhase('playing'); // show error state
    }
  };

  useEffect(() => {
    if (stepIndex < TOTAL_STEPS) fetchScenario(stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const handleSelect = (optId: string) => {
    if (phase !== 'playing' || selectedId || !scenario) return;
    const opt = shuffledOptions.find(o => o.id === optId)!;
    setSelectedId(optId);
    setPhase('answered');

    const delta = opt.is_correct ? 20 : -35;
    const newHp = Math.max(0, Math.min(100, hp + delta));
    setHp(newHp);
    if (opt.is_correct) {
      setScore(s => s + 50);
      setCorrectCount(c => c + 1);
    }
    setTimeout(() => setModalOpen(true), 300);
  };

  const handleNext = () => {
    setModalOpen(false);
    const next = stepIndex + 1;
    if (next >= TOTAL_STEPS) {
      // Save results
      apiSubmitResult({
        location: 'ai',
        steps_count: TOTAL_STEPS,
        correct_count: correctCount + (selectedId && scenario && shuffledOptions.find(o => o.id === selectedId)?.is_correct ? 1 : 0),
        hp_delta: hp - 100,
        score,
      }).catch(() => {});
      setPhase('complete');
    } else {
      setStepIndex(next);
    }
  };

  const selectedOpt = selectedId ? shuffledOptions.find(o => o.id === selectedId) : null;
  const isCorrect = selectedOpt?.is_correct ?? false;
  const modalType = isCorrect ? 'success' : 'danger';
  const modalTitle = isCorrect ? '✓ ВЕРНОЕ РЕШЕНИЕ' : '✗ УГРОЗА РЕАЛИЗОВАНА';
  const modalExplanation = isCorrect
    ? (scenario?.explanation_correct ?? '')
    : (scenario?.explanation_wrong ?? '');

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const grade = hp >= 80 ? 'S' : hp >= 60 ? 'A' : hp >= 40 ? 'B' : hp >= 20 ? 'C' : 'D';
    const gradeColor = hp >= 80 ? 'var(--px-green)' : hp >= 60 ? 'var(--px-cyan)' : hp >= 40 ? 'var(--px-yellow)' : 'var(--px-red)';

    return (
      <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
        <Navbar hp={hp} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <div className="px-card" style={{ border: `3px solid ${gradeColor}`, boxShadow: `0 0 40px ${gradeColor}44`, padding: '32px', textAlign: 'center' }}>
              {/* AI badge */}
              <div style={{
                display: 'inline-block', padding: '4px 14px', marginBottom: '16px',
                border: '2px solid var(--px-cyan)', background: 'rgba(0,229,255,0.1)',
                fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-cyan)',
              }}>
                ⚡ AI-РЕЖИМ ЗАВЕРШЁН
              </div>

              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '80px', color: gradeColor, textShadow: `0 0 20px ${gradeColor}`, lineHeight: 1, marginBottom: '8px' }}>
                {grade}
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: gradeColor, marginBottom: '24px' }}>
                {hp >= 80 ? 'ПРЕВОСХОДНО!' : hp >= 60 ? 'ХОРОШАЯ РАБОТА' : hp >= 40 ? 'НЕПЛОХО' : 'НУЖНА ПРАКТИКА'}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'HP ОСТАЛОСЬ', value: `${hp}%`, color: hp > 60 ? 'var(--px-green)' : 'var(--px-red)' },
                  { label: 'ОЧКИ', value: score, color: 'var(--px-cyan)' },
                  { label: 'ВЕРНЫХ', value: `${correctCount}/${TOTAL_STEPS}`, color: 'var(--px-yellow)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-card" style={{ padding: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color, marginBottom: '4px' }}>{value}</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <HPBar current={hp} max={100} label="ИТОГОВЫЙ HP" />
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <button className="px-btn px-btn-green" onClick={() => { setStepIndex(0); setHp(100); setScore(0); setCorrectCount(0); setPhase('loading'); }}>
                  ↺ НОВАЯ ГЕНЕРАЦИЯ
                </button>
                <Link href="/missions" className="px-btn px-btn-outline" style={{ textDecoration: 'none' }}>
                  ← МИССИИ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN GAME ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar hp={hp} />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div style={{
              padding: '4px 10px',
              border: '2px solid var(--px-cyan)',
              background: 'rgba(0,229,255,0.1)',
              fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)',
            }}>
              ⚡ AI-РЕЖИМ
            </div>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
              ШАГ {stepIndex + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <HPBar current={hp} max={100} label="HP" size="sm" />
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '6px',
              background: i < stepIndex
                ? 'var(--px-green)'
                : i === stepIndex
                ? 'var(--px-cyan)'
                : 'var(--px-bg3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Current attack type badge */}
        {attackQueue[stepIndex] && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>ТИП УГРОЗЫ:</span>
            <span style={{
              padding: '3px 10px',
              border: '2px solid var(--px-yellow)',
              background: 'rgba(255,230,0,0.08)',
              fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-yellow)',
            }}>
              {ATTACK_LABELS[attackQueue[stepIndex]] ?? attackQueue[stepIndex]}
            </span>
          </div>
        )}

        {/* Main scenario panel */}
        <div className="px-terminal" style={{ border: '3px solid var(--px-cyan)', flex: 1 }}>
          {/* Terminal bar */}
          <div style={{
            background: 'var(--px-cyan)', padding: '8px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'var(--px-bg)', fontFamily: 'var(--font-pixel)', fontSize: '9px',
          }}>
            <span>⚡ MISTRAL AI — ГЕНЕРАЦИЯ УГРОЗЫ</span>
            <span className="animate-blink">{phase === 'loading' ? '● ГЕНЕРАЦИЯ' : '● СЦЕНАРИЙ'}</span>
          </div>

          <div style={{ padding: '20px', minHeight: '220px' }}>
            {/* Loading state */}
            {phase === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-cyan)' }}>
                  {'> ЗАПРОС К MISTRAL AI' + dots}
                </div>
                {/* Animated skeleton lines */}
                {[80, 95, 70, 88, 60].map((w, i) => (
                  <div key={i} style={{
                    height: '8px', width: `${w}%`,
                    background: 'linear-gradient(90deg, var(--px-bg3), var(--px-cyan)22, var(--px-bg3))',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 1.5s infinite ${i * 0.15}s`,
                    borderRadius: '2px',
                  }} />
                ))}
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', marginTop: '8px' }}>
                  Модель: mistral-small-latest • Генерация уникального сценария{dots}
                </div>
              </div>
            )}

            {/* Error state */}
            {phase !== 'loading' && error && (
              <div style={{ color: 'var(--px-red)', fontFamily: 'var(--font-pixel)', fontSize: '9px', lineHeight: '2' }}>
                ✗ ОШИБКА ГЕНЕРАЦИИ: {error}
                <br />
                <button className="px-btn px-btn-outline" style={{ marginTop: '12px' }} onClick={() => fetchScenario(stepIndex)}>
                  ПОВТОРИТЬ
                </button>
              </div>
            )}

            {/* Scenario text with typewriter */}
            {phase !== 'loading' && !error && scenario && (
              <div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '13px', color: '#e0e0e0',
                  lineHeight: '1.8', whiteSpace: 'pre-wrap',
                  background: 'rgba(0,0,0,0.3)', padding: '16px',
                  border: '1px solid var(--px-bg3)', marginBottom: '16px',
                }}>
                  {typedText}
                  {typedText.length < scenario.scenario_text.length && (
                    <span className="animate-blink" style={{ color: 'var(--px-cyan)' }}>█</span>
                  )}
                </div>

                {/* CWE / OWASP badges */}
                <div className="flex gap-2 flex-wrap">
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 8px',
                    border: '2px solid var(--px-cyan)', color: 'var(--px-cyan)',
                    background: 'rgba(0,229,255,0.08)',
                  }}>{scenario.cwe_id}</span>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 8px',
                    border: '2px solid var(--px-yellow)', color: 'var(--px-yellow)',
                    background: 'rgba(255,230,0,0.08)',
                  }}>{scenario.owasp_category}</span>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '7px', padding: '3px 8px',
                    border: '2px solid var(--px-green)', color: 'var(--px-green)',
                    background: 'rgba(0,255,65,0.05)',
                  }}>⚡ AI-СЦЕНАРИЙ</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Choices */}
        {phase !== 'loading' && !error && scenario && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', marginBottom: '4px' }}>
              ▸ ВЫБЕРИТЕ ДЕЙСТВИЕ:
            </div>
            {shuffledOptions.map((opt) => {
              const isSelected = selectedId === opt.id;
              const isRevealedCorrect = phase === 'answered' && opt.is_correct;
              const isRevealedWrong = phase === 'answered' && isSelected && !opt.is_correct;

              let borderColor = 'var(--px-bg3)';
              let bg = 'var(--px-bg)';
              let textColor = 'var(--px-white)';
              if (isRevealedCorrect) { borderColor = 'var(--px-green)'; bg = 'rgba(0,255,65,0.08)'; textColor = 'var(--px-green)'; }
              else if (isRevealedWrong) { borderColor = 'var(--px-red)'; bg = 'rgba(255,49,49,0.08)'; textColor = 'var(--px-red)'; }
              else if (isSelected) { borderColor = 'var(--px-cyan)'; bg = 'rgba(0,229,255,0.05)'; }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={phase === 'answered'}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 14px', width: '100%', textAlign: 'left',
                    background: bg, border: `2px solid ${borderColor}`,
                    color: textColor, cursor: phase === 'answered' ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-pixel)', fontSize: '8px', lineHeight: '1.8',
                  }}
                >
                  <span style={{
                    minWidth: '20px', fontFamily: 'var(--font-pixel)', fontSize: '9px',
                    color: isRevealedCorrect ? 'var(--px-green)' : isRevealedWrong ? 'var(--px-red)' : 'var(--px-cyan)',
                    flexShrink: 0,
                  }}>
                    {isRevealedCorrect ? '✓' : isRevealedWrong ? '✗' : opt.id}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result modal */}
      {selectedOpt && scenario && (
        <PixelModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          type={modalType}
          title={modalTitle}
          explanation={modalExplanation}
          hpDelta={isCorrect ? 20 : -35}
          onNext={handleNext}
          isLastStep={stepIndex === TOTAL_STEPS - 1}
          cweId={scenario.cwe_id}
          owaspCategory={scenario.owasp_category}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
