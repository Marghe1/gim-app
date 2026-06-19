import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X, Minus, Plus, Trash2, Check } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { Workout, WorkoutLog, ExerciseLog } from '../utils/storage';
import {
  getWorkouts,
  getWorkoutLogs,
  saveWorkoutLog,
  getExercises,
  getLastWeightForExercise,
  getLastSameWorkoutPerformance,
  getTimedExerciseIds,
  formatCount,
  localDateKey,
} from '../utils/storage';
import { useT, useLang } from '../i18n/context';
import { logPastWorkoutStrings } from '../i18n/strings/logPastWorkout';
import { translateExercise, translateTemplateName } from '../i18n/data';

// Build the starting set logs for a chosen workout, pre-filling weight/reps from
// the most recent matching session (falling back to last-used weight, then the
// exercise default). Every set starts marked "done" — this is a record of what
// was already performed, not a live session.
function buildExerciseLogs(workout: Workout): ExerciseLog[] {
  const allExercises = getExercises();
  return workout.exercises.map(ex => {
    const lastPerf = getLastSameWorkoutPerformance(workout.id, ex.exerciseId);
    const exerciseData = allExercises.find(e => e.id === ex.exerciseId);
    const defaultWeight = exerciseData?.defaultWeight ?? 0;
    const lastWeight = getLastWeightForExercise(ex.exerciseId);
    const fallbackWeight = lastWeight !== null ? lastWeight : defaultWeight;

    return {
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: Array.from({ length: ex.targetSets }, (_, i) => {
        const prev = lastPerf?.sets[i];
        return {
          setNumber: i + 1,
          reps: prev?.reps ?? ex.targetReps,
          weight: prev?.weight ?? fallbackWeight,
          completed: true,
        };
      }),
    };
  });
}

export default function LogPastWorkout() {
  const navigate = useNavigate();
  const { logId } = useParams();
  const location = useLocation();
  const t = useT(logPastWorkoutStrings);
  const { lang } = useLang();

  // When adding from the calendar, a day can be passed in to prefill the date.
  const presetDate = (location.state as { date?: string } | null)?.date;

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [timedIds] = useState<Set<string>>(() => getTimedExerciseIds());

  // When set, we're editing an existing history entry rather than adding a new
  // one. We keep its id/workoutId/workoutName so the saved log replaces it.
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [date, setDate] = useState(() => presetDate || localDateKey(new Date()));
  const [durationMin, setDurationMin] = useState('');
  const [note, setNote] = useState('');
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  const isEditing = !!logId;
  const today = localDateKey(new Date());

  useEffect(() => {
    setWorkouts(getWorkouts());

    if (logId) {
      const existing = getWorkoutLogs().find(l => l.id === logId);
      if (existing) {
        setEditLog(existing);
        setSelectedWorkoutId(existing.workoutId);
        setDate(localDateKey(new Date(existing.date)));
        setDurationMin(existing.duration > 0 ? String(Math.round(existing.duration / 60)) : '');
        setNote(existing.notes || '');
        // Deep-copy so edits don't mutate the stored object until we save.
        setExerciseLogs(existing.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({ ...s })),
        })));
        setSkipped(new Set());
      }
    }
  }, [logId]);

  function chooseWorkout(id: string) {
    setSelectedWorkoutId(id);
    setSkipped(new Set());
    const workout = workouts.find(w => w.id === id);
    setExerciseLogs(workout ? buildExerciseLogs(workout) : []);
  }

  function adjustWeight(exIndex: number, setIndex: number, delta: number) {
    const next = [...exerciseLogs];
    const current = next[exIndex].sets[setIndex].weight;
    next[exIndex].sets[setIndex].weight = Math.max(0, current + delta);
    setExerciseLogs(next);
  }

  function adjustReps(exIndex: number, setIndex: number, delta: number) {
    const next = [...exerciseLogs];
    const current = next[exIndex].sets[setIndex].reps;
    next[exIndex].sets[setIndex].reps = Math.max(0, current + delta);
    setExerciseLogs(next);
  }

  function updateSet(exIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) {
    const next = [...exerciseLogs];
    next[exIndex].sets[setIndex][field] = value;
    setExerciseLogs(next);
  }

  function addSet(exIndex: number) {
    const next = [...exerciseLogs];
    const sets = next[exIndex].sets;
    const last = sets[sets.length - 1];
    sets.push({
      setNumber: sets.length + 1,
      reps: last?.reps ?? 10,
      weight: last?.weight ?? 0,
      completed: true,
    });
    setExerciseLogs(next);
  }

  function removeSet(exIndex: number, setIndex: number) {
    const next = [...exerciseLogs];
    if (next[exIndex].sets.length <= 1) return;
    next[exIndex].sets.splice(setIndex, 1);
    next[exIndex].sets.forEach((s, i) => { s.setNumber = i + 1; });
    setExerciseLogs(next);
  }

  function toggleSkip(exIndex: number) {
    const next = new Set(skipped);
    if (next.has(exIndex)) next.delete(exIndex);
    else next.add(exIndex);
    setSkipped(next);
  }

  function handleSave() {
    // The workout name/id come from the log being edited, or the chosen
    // template when adding a new one. (The template may since have been deleted,
    // so when editing we rely on the values stored on the log itself.)
    const workout = workouts.find(w => w.id === selectedWorkoutId);
    const workoutId = editLog?.workoutId ?? workout?.id;
    const workoutName = editLog?.workoutName ?? workout?.name;
    if (!workoutId || !workoutName) return;

    // Build the log date at noon of the chosen day so the calendar day lines up
    // regardless of timezone.
    const [y, m, d] = date.split('-').map(Number);
    const when = new Date(y, m - 1, d, 12, 0, 0);

    const minutes = Number(durationMin);
    const duration = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : 0;

    const exercises = exerciseLogs.filter((_, idx) => !skipped.has(idx));

    const log: WorkoutLog = {
      id: editLog?.id ?? uuid(),
      workoutId,
      workoutName,
      date: when.toISOString(),
      duration,
      exercises,
      notes: note.trim() || undefined,
      completed: true,
    };
    saveWorkoutLog(log);
    navigate('/history');
  }

  const hasWorkouts = workouts.length > 0;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '8px 0',
      }}>
        <button className="btn btn-ghost" onClick={() => navigate('/history')}>
          <X size={24} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{t(isEditing ? 'editTitle' : 'title')}</div>
        <div style={{ width: 40 }} />
      </div>

      {!hasWorkouts && !isEditing ? (
        <div className="empty-state">
          <h3 className="empty-state-title">{t('emptyTitle')}</h3>
          <p>{t('emptyText')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/workouts')} style={{ marginTop: 12 }}>
            {t('goToWorkouts')}
          </button>
        </div>
      ) : (
        <>
          {/* Which workout + when. When editing an existing entry the workout
              type is fixed (so its logged sets aren't wiped); show it as a
              read-only label instead of the picker. */}
          {isEditing ? (
            <div className="form-group">
              <label className="form-label">{t('workoutLabel')}</label>
              <div style={{ fontWeight: 600, padding: '4px 0' }}>
                {translateTemplateName(lang, editLog?.workoutName ?? '')}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">{t('whichWorkout')}</label>
              <select
                className="form-select"
                value={selectedWorkoutId}
                onChange={e => chooseWorkout(e.target.value)}
              >
                <option value="">{t('selectWorkout')}</option>
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>{translateTemplateName(lang, w.name)}</option>
                ))}
              </select>
            </div>
          )}

          {selectedWorkoutId && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('date')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    max={today}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('duration')}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('durationPlaceholder')}
                    value={durationMin}
                    min={0}
                    onChange={e => setDurationMin(e.target.value)}
                  />
                </div>
              </div>

              {/* Exercises */}
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 12px' }}>
                {t('adjustHint')}
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {exerciseLogs.map((log, exIndex) => {
                  const isSkipped = skipped.has(exIndex);
                  const isTimed = timedIds.has(log.exerciseId);
                  return (
                    <div key={exIndex} className="card" style={{ opacity: isSkipped ? 0.5 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSkipped ? 0 : 12 }}>
                        <div style={{ fontWeight: 600, textDecoration: isSkipped ? 'line-through' : 'none' }}>
                          {translateExercise(lang, log.exerciseName)}
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleSkip(exIndex)}
                          style={{ color: isSkipped ? 'var(--color-primary, #16C79A)' : '#9ca3af' }}
                        >
                          {isSkipped ? t('undo') : t('skip')}
                        </button>
                      </div>

                      {!isSkipped && (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {log.sets.map((set, setIndex) => (
                            <div
                              key={setIndex}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: isTimed ? '40px 1fr 32px' : '40px 1fr 1fr 32px',
                                gap: 6,
                                alignItems: 'end',
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#6b7280', textAlign: 'center', paddingBottom: 8 }}>
                                {setIndex + 1}
                              </div>

                              {!isTimed && (
                                <Stepper
                                  label={t('weightLabel')}
                                  value={set.weight}
                                  onMinus={() => adjustWeight(exIndex, setIndex, -2.5)}
                                  onPlus={() => adjustWeight(exIndex, setIndex, 2.5)}
                                  onChange={v => updateSet(exIndex, setIndex, 'weight', v)}
                                  placeholder="0"
                                />
                              )}

                              <Stepper
                                label={isTimed ? t('timeLabel') : t('repsLabel')}
                                value={set.reps}
                                onMinus={() => adjustReps(exIndex, setIndex, -1)}
                                onPlus={() => adjustReps(exIndex, setIndex, 1)}
                                onChange={v => updateSet(exIndex, setIndex, 'reps', v)}
                              />

                              <button
                                className="btn btn-ghost"
                                style={{ padding: 4, opacity: 0.5 }}
                                onClick={() => removeSet(exIndex, setIndex)}
                                disabled={log.sets.length <= 1}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}

                          <button
                            className="btn btn-secondary btn-sm btn-block"
                            onClick={() => addSet(exIndex)}
                            style={{ marginTop: 2 }}
                          >
                            <Plus size={16} /> {t('addSet')}
                          </button>

                          {isTimed && (
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              {t('recordedAs', { v: formatCount(log.sets[0]?.reps ?? 0, true, lang) })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Note */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">{t('note')}</label>
                <textarea
                  className="form-input"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('notePlaceholder')}
                  style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={handleSave}
                style={{ padding: 16, fontSize: 16, fontWeight: 600, marginTop: 8 }}
              >
                <Check size={18} /> {t(isEditing ? 'saveChanges' : 'saveToHistory')}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// A compact number field with -/+ steppers, matching the active workout editor.
function Stepper({
  label, value, onMinus, onPlus, onChange, placeholder,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 10, color: '#6b7280', display: 'block', marginBottom: 2 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button className="btn btn-ghost" style={{ padding: 2, minWidth: 24 }} onClick={onMinus}>
          <Minus size={12} />
        </button>
        <input
          type="number"
          style={{
            width: '100%',
            padding: '6px 2px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
          }}
          value={placeholder !== undefined ? (value || '') : value}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={placeholder}
        />
        <button className="btn btn-ghost" style={{ padding: 2, minWidth: 24 }} onClick={onPlus}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
