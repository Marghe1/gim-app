import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Play, X, Wand2, Trash2 } from 'lucide-react';
import type { Workout, WorkoutSchedule } from '../utils/storage';
import { getWorkouts, getSchedule, saveSchedule, localDateKey } from '../utils/storage';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Auto-plan targets: Tuesday (2) and Thursday (4) — getDay() numbering.
const AUTO_PLAN_DAYS = [2, 4];

export default function Plan() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = localDateKey(today);

  const [workouts] = useState<Workout[]>(() => getWorkouts());
  const [schedule, setSchedule] = useState<WorkoutSchedule>(() => getSchedule());
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  // Date key currently being assigned a workout (picker modal), or null.
  const [pickerDate, setPickerDate] = useState<string | null>(null);

  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}-`;

  function persist(next: WorkoutSchedule) {
    saveSchedule(next);
    setSchedule(next);
  }

  function changeMonth(delta: number) {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  // Build the month grid: leading blanks (Monday-start) then each day.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // shift so Monday is the first column
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d));
    return out;
  }, [view]);

  const workoutById = useMemo(() => {
    const m: Record<string, Workout> = {};
    workouts.forEach(w => { m[w.id] = w; });
    return m;
  }, [workouts]);

  // Planned sessions in the viewed month, sorted by date.
  const monthPlan = useMemo(
    () =>
      Object.entries(schedule)
        .filter(([k]) => k.startsWith(monthPrefix))
        .sort(([a], [b]) => a.localeCompare(b)),
    [schedule, monthPrefix]
  );

  // Fill every Tuesday & Thursday of the viewed month, cycling through the
  // saved workouts so each day starts with a suggestion the user can change.
  function autoPlan() {
    if (workouts.length === 0) {
      alert('Add a workout first (in the Workouts tab), then come back to plan your week.');
      return;
    }
    if (!confirm('Plan a session every Tuesday and Thursday this month? Days already planned this month will be overwritten.')) {
      return;
    }
    const next = { ...schedule };
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    let i = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.year, view.month, d);
      if (AUTO_PLAN_DAYS.includes(date.getDay())) {
        next[localDateKey(date)] = workouts[i % workouts.length].id;
        i++;
      }
    }
    persist(next);
  }

  function clearMonth() {
    if (monthPlan.length === 0) return;
    if (!confirm('Remove all planned sessions in this month?')) return;
    const next = { ...schedule };
    Object.keys(next).forEach(k => { if (k.startsWith(monthPrefix)) delete next[k]; });
    persist(next);
  }

  function assignWorkout(dateKey: string, workoutId: string) {
    persist({ ...schedule, [dateKey]: workoutId });
    setPickerDate(null);
  }

  function clearDay(dateKey: string) {
    const next = { ...schedule };
    delete next[dateKey];
    persist(next);
    setPickerDate(null);
  }

  function formatDayLabel(dateKey: string): string {
    const d = new Date(`${dateKey}T00:00:00`);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Plan</h1>
        <p className="page-subtitle">Schedule your sessions ahead</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={autoPlan}>
          <Wand2 size={18} />
          Plan Tue &amp; Thu
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={clearMonth}
          disabled={monthPlan.length === 0}
        >
          <Trash2 size={18} />
          Clear month
        </button>
      </div>

      {/* Calendar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              {MONTH_LABELS[view.month]} {view.year}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => changeMonth(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => changeMonth(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {WEEKDAY_LABELS.map(w => (
            <div key={w} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={`b${idx}`} />;
            const k = localDateKey(d);
            const planned = schedule[k];
            const w = planned ? workoutById[planned] : undefined;
            const isToday = k === todayKey;
            return (
              <button
                key={k}
                onClick={() => setPickerDate(k)}
                title={w ? w.name : planned ? 'Planned (workout removed)' : 'Tap to plan'}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 8,
                  border: isToday ? '1.5px solid #6366f1' : '1.5px solid transparent',
                  background: planned ? '#6366f1' : '#f3f4f6',
                  color: planned ? 'white' : '#374151',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 2,
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{d.getDate()}</span>
                {planned && (
                  <span style={{ fontSize: 8, lineHeight: 1.1, marginTop: 2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w ? w.name : '—'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Planned sessions list */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {MONTH_LABELS[view.month]} sessions
      </h3>
      {monthPlan.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}>
          <p>Nothing planned yet. Tap “Plan Tue &amp; Thu” or pick a day on the calendar.</p>
        </div>
      ) : (
        <div className="list">
          {monthPlan.map(([k, workoutId]) => {
            const w = workoutById[workoutId];
            const isPast = k < todayKey;
            return (
              <div key={k} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title" style={{ opacity: isPast ? 0.6 : 1 }}>
                    {formatDayLabel(k)}
                  </div>
                  <div className="list-item-subtitle">
                    {w ? w.name : 'Workout removed — tap the day to choose another'}
                  </div>
                </div>
                <div className="list-item-actions" style={{ gap: 8 }}>
                  {w && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workout/${w.id}`)}>
                      <Play size={16} /> Start
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => clearDay(k)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Workout picker */}
      {pickerDate && (
        <div className="modal-overlay" onClick={() => setPickerDate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {formatDayLabel(pickerDate)}
              </h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setPickerDate(null)}>
                <X size={20} />
              </button>
            </div>

            {workouts.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #6b7280)' }}>
                You have no workouts yet. Create one in the Workouts tab first.
              </p>
            ) : (
              <div className="list" style={{ marginBottom: 12 }}>
                {workouts.map(w => {
                  const selected = schedule[pickerDate] === w.id;
                  return (
                    <button
                      key={w.id}
                      className="list-item"
                      onClick={() => assignWorkout(pickerDate, w.id)}
                      style={{
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        background: selected ? 'var(--color-surface, #eef2ff)' : undefined,
                        border: selected ? '1.5px solid #6366f1' : undefined,
                      }}
                    >
                      <div className="list-item-content">
                        <div className="list-item-title">{w.name}</div>
                        <div className="list-item-subtitle">
                          {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {schedule[pickerDate] && (
              <button className="btn btn-secondary btn-block" onClick={() => clearDay(pickerDate)}>
                <Trash2 size={16} /> Remove from this day
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
