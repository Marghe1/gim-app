import { useState, useEffect, useRef } from 'react';
import { Timer as TimerIcon, Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react';

// Quick-pick durations (in seconds) shown as preset chips
const PRESETS = [
  { seconds: 30, label: '30s' },
  { seconds: 60, label: '1m' },
  { seconds: 90, label: '1m30' },
  { seconds: 120, label: '2m' },
  { seconds: 180, label: '3m' },
  { seconds: 300, label: '5m' },
];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * A general-purpose countdown timer that floats over the whole app.
 * Set any time, start it, and it vibrates when it reaches zero.
 * Mounted once at the app level so it keeps running while you navigate.
 */
export default function FloatingTimer() {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(60); // the time it was last set to
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  // Count down against a wall-clock target so it stays accurate even if the
  // phone screen sleeps or the tab is backgrounded.
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = window.setInterval(() => {
      if (endAtRef.current === null) return;
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setFinished(true);
        if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function start() {
    if (remaining <= 0) return;
    setFinished(false);
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setFinished(false);
    setRemaining(duration);
    endAtRef.current = null;
  }

  function setPreset(seconds: number) {
    setRunning(false);
    setFinished(false);
    setDuration(seconds);
    setRemaining(seconds);
    endAtRef.current = null;
  }

  function adjust(delta: number) {
    const next = Math.max(0, remaining + delta);
    setFinished(false);
    setRemaining(next);
    if (running) {
      endAtRef.current = Date.now() + next * 1000;
    } else {
      setDuration(next);
    }
  }

  // The collapsed button shows the live time once a countdown is under way.
  const inProgress = running || finished || remaining !== duration;

  // Sits above the bottom navigation bar.
  const anchorBottom = 'calc(84px + env(safe-area-inset-bottom, 0px))';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open timer"
        style={{
          position: 'fixed',
          right: 16,
          bottom: anchorBottom,
          zIndex: 150,
          width: 60,
          height: 60,
          borderRadius: '50%',
          cursor: 'pointer',
          background: finished ? 'var(--danger)' : running ? 'var(--primary)' : 'white',
          color: finished || running ? 'white' : 'var(--primary)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: inProgress ? 15 : 24,
          fontWeight: 700,
          fontFamily: inProgress ? 'monospace' : undefined,
          border: finished || running ? 'none' : '2px solid var(--primary)',
          animation: finished ? 'timer-pulse 0.8s ease-in-out infinite' : undefined,
        }}
      >
        {inProgress ? formatTime(remaining) : <TimerIcon size={26} />}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: anchorBottom,
        zIndex: 150,
        width: 'min(320px, calc(100vw - 24px))',
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        padding: 16,
        animation: finished ? 'timer-pulse 0.8s ease-in-out infinite' : undefined,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <TimerIcon size={18} style={{ color: 'var(--primary)' }} />
          Timer
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setOpen(false)}
          aria-label="Close timer"
          style={{ padding: 4 }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Time display */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            fontFamily: 'monospace',
            lineHeight: 1.1,
            color: finished ? 'var(--danger)' : running ? 'var(--primary)' : 'var(--gray-900)',
          }}
        >
          {formatTime(remaining)}
        </div>
        {finished && (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginTop: 2 }}>
            Time's up!
          </div>
        )}
      </div>

      {/* Adjust buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => adjust(-15)}>
          <Minus size={14} /> 15s
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => adjust(-60)}>
          <Minus size={14} /> 1m
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => adjust(60)}>
          <Plus size={14} /> 1m
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => adjust(15)}>
          <Plus size={14} /> 15s
        </button>
      </div>

      {/* Presets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {PRESETS.map(p => (
          <button
            key={p.seconds}
            onClick={() => setPreset(p.seconds)}
            style={{
              padding: '8px 0',
              borderRadius: 8,
              border: `1px solid ${!running && duration === p.seconds ? 'var(--primary)' : 'var(--gray-200)'}`,
              background: !running && duration === p.seconds ? 'var(--primary-light)' : 'white',
              color: !running && duration === p.seconds ? 'var(--primary-dark)' : 'var(--gray-600)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!running ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={start} disabled={remaining <= 0}>
            <Play size={18} /> Start
          </button>
        ) : (
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={pause}>
            <Pause size={18} /> Pause
          </button>
        )}
        <button className="btn btn-secondary" onClick={reset}>
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
