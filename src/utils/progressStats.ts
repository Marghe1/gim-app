import type { WorkoutLog } from './storage';

// Effort levels mirror the rating scale used in ActiveWorkout, with a colour
// from the app palette for charts.
export const EFFORT_META = [
  { value: 1, emoji: '😴', label: 'Very easy', color: '#6cc8ff' },
  { value: 2, emoji: '😊', label: 'Easy', color: '#16c79a' },
  { value: 3, emoji: '😐', label: 'Moderate', color: '#ffc247' },
  { value: 4, emoji: '😓', label: 'Hard', color: '#ff8a80' },
  { value: 5, emoji: '🔥', label: 'Maximum', color: '#b9a7f0' },
] as const;

export interface SessionStat {
  id: string;
  date: string; // ISO
  dateLabel: string; // "12 Jun"
  workoutName: string;
  durationSec: number;
  exercises: number;
  volume: number; // kg moved (weight × reps) over completed sets
  reps: number; // total reps over non-timed exercises
  timeSec: number; // total hold seconds over timed exercises
  avgEffort: number | null; // 1–5
  score: number; // 0–100 overall progress, scaled so the best session = 100
  trend: number; // rolling average of score over the last up-to-3 sessions
  isBest: boolean;
}

/**
 * Per-session analytics, oldest first. The "overall score" blends three
 * normalised components — weight moved, work done (reps + hold seconds), and
 * effort — into a single 0–100 number, scaled so the best session reads 100.
 * Components with no data (e.g. a bodyweight-only session has no volume) are
 * dropped and the remaining weights are renormalised.
 */
export function computeSessionStats(logs: WorkoutLog[], timedIds: Set<string>): SessionStat[] {
  const completed = logs
    .filter(l => l.completed)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const base = completed.map(log => {
    let volume = 0;
    let reps = 0;
    let timeSec = 0;
    const efforts: number[] = [];
    log.exercises.forEach(ex => {
      const timed = timedIds.has(ex.exerciseId);
      ex.sets.forEach(s => {
        if (!s.completed) return;
        if (timed) {
          timeSec += s.reps; // for timed exercises the "reps" field holds seconds
        } else {
          reps += s.reps;
          volume += s.weight * s.reps;
        }
      });
      if (ex.effortRating !== undefined) efforts.push(ex.effortRating);
    });
    const avgEffort = efforts.length ? efforts.reduce((a, b) => a + b, 0) / efforts.length : null;
    return { log, volume, reps, timeSec, avgEffort };
  });

  const maxVolume = Math.max(0, ...base.map(b => b.volume));
  const maxWork = Math.max(0, ...base.map(b => b.reps + b.timeSec));

  // Weighted average of the available normalised components → 0..1.
  const raws = base.map(b => {
    const parts: number[] = [];
    const weights: number[] = [];
    if (maxVolume > 0) {
      parts.push(b.volume / maxVolume);
      weights.push(0.4);
    }
    if (maxWork > 0) {
      parts.push((b.reps + b.timeSec) / maxWork);
      weights.push(0.4);
    }
    if (b.avgEffort !== null) {
      parts.push(b.avgEffort / 5);
      weights.push(0.2);
    }
    const wsum = weights.reduce((a, c) => a + c, 0);
    if (wsum === 0) return 0;
    return parts.reduce((acc, p, i) => acc + p * weights[i], 0) / wsum;
  });

  const maxRaw = Math.max(0, ...raws);
  const scores = raws.map(r => (maxRaw > 0 ? Math.round((r / maxRaw) * 100) : 0));
  const bestScore = Math.max(0, ...scores);

  return base.map((b, i) => {
    const window = scores.slice(Math.max(0, i - 2), i + 1);
    const trend = Math.round(window.reduce((a, c) => a + c, 0) / window.length);
    const d = new Date(b.log.date);
    return {
      id: b.log.id,
      date: b.log.date,
      dateLabel: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      workoutName: b.log.workoutName,
      durationSec: b.log.duration,
      exercises: b.log.exercises.length,
      volume: Math.round(b.volume),
      reps: b.reps,
      timeSec: b.timeSec,
      avgEffort: b.avgEffort,
      score: scores[i],
      trend,
      isBest: scores[i] === bestScore && bestScore > 0,
    };
  });
}

export interface EffortSlice {
  value: number;
  emoji: string;
  label: string;
  color: string;
  count: number;
}

/** How often each effort level was logged, across all completed workouts. */
export function effortDistribution(logs: WorkoutLog[]): EffortSlice[] {
  const counts: Record<number, number> = {};
  logs
    .filter(l => l.completed)
    .forEach(l =>
      l.exercises.forEach(ex => {
        if (ex.effortRating !== undefined) {
          counts[ex.effortRating] = (counts[ex.effortRating] || 0) + 1;
        }
      })
    );
  return EFFORT_META.map(m => ({ ...m, count: counts[m.value] || 0 })).filter(s => s.count > 0);
}

/* ---------- Export ---------- */

function exportRows(stats: SessionStat[]) {
  return stats.map(s => ({
    Date: new Date(s.date).toLocaleDateString('en-GB'),
    Workout: s.workoutName,
    'Duration (min)': Math.round(s.durationSec / 60),
    Exercises: s.exercises,
    'Volume (kg)': s.volume,
    Reps: s.reps,
    'Hold time (s)': s.timeSec,
    'Avg effort (1-5)': s.avgEffort !== null ? Math.round(s.avgEffort * 10) / 10 : '',
    'Overall score': s.score,
  }));
}

function todayStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadProgressCsv(stats: SessionStat[]) {
  const rows = exportRows(stats);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc((r as Record<string, unknown>)[h])).join(',')),
  ].join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `gymapp-progress-${todayStamp()}.csv`);
}

/** Loads SheetJS on demand (keeps it out of the main bundle) and writes an .xlsx. */
export async function downloadProgressXlsx(stats: SessionStat[]) {
  const rows = exportRows(stats);
  if (rows.length === 0) return;
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Progress');
  XLSX.writeFile(wb, `gymapp-progress-${todayStamp()}.xlsx`);
}
