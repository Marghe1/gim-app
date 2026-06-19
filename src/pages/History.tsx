import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Timer, ChevronDown, ChevronUp, Trash2, MessageSquare, Plus, Pencil, Smile, X } from 'lucide-react';
import type { WorkoutLog } from '../utils/storage';
import { getWorkoutLogs, deleteWorkoutLog, saveWorkoutLog, getTimedExerciseIds, formatCount, formatDuration } from '../utils/storage';
import PageHero from '../components/PageHero';
import { useT, useLang } from '../i18n/context';
import { historyStrings } from '../i18n/strings/history';
import { translateExercise, localeFor } from '../i18n/data';

// Which note is currently being edited: a workout-level note (exIndex null) or
// a specific exercise note (exIndex = position in the log's exercises array).
type EditTarget = { logId: string; exIndex: number | null };

// Quick-pick mood emojis for a workout (you can also type any other).
const EMOJI_PRESETS = ['💪', '🔥', '😊', '😎', '🥳', '😅', '😓', '🥵', '😴', '🤕', '🎉', '❤️'];

export default function History() {
  const navigate = useNavigate();
  const t = useT(historyStrings);
  const { lang } = useLang();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editText, setEditText] = useState('');
  // Workout whose emoji is being picked (its id), plus the custom-entry text.
  const [emojiLogId, setEmojiLogId] = useState<string | null>(null);
  const [emojiText, setEmojiText] = useState('');
  const [timedIds] = useState<Set<string>>(() => getTimedExerciseIds());

  useEffect(() => {
    loadLogs();
  }, []);

  function loadLogs() {
    const allLogs = getWorkoutLogs();
    // Sort by date, newest first
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLogs(allLogs);
  }

  function handleDelete(id: string) {
    if (confirm(t('confirmDelete'))) {
      deleteWorkoutLog(id);
      loadLogs();
    }
  }

  function startEdit(logId: string, exIndex: number | null, current: string | undefined) {
    setEditing({ logId, exIndex });
    setEditText(current || '');
  }

  function saveEdit() {
    if (!editing) return;
    const log = logs.find(l => l.id === editing.logId);
    if (!log) {
      setEditing(null);
      return;
    }
    const trimmed = editText.trim() || undefined;
    let updated: WorkoutLog;
    if (editing.exIndex === null) {
      updated = { ...log, notes: trimmed };
    } else {
      updated = {
        ...log,
        exercises: log.exercises.map((ex, idx) =>
          idx === editing.exIndex ? { ...ex, note: trimmed } : ex
        ),
      };
    }
    saveWorkoutLog(updated);
    setEditing(null);
    loadLogs();
  }

  function openEmojiPicker(log: WorkoutLog) {
    setEmojiLogId(log.id);
    setEmojiText(log.emoji || '');
  }

  function setEmoji(logId: string, emoji: string | undefined) {
    const log = logs.find(l => l.id === logId);
    if (log) {
      saveWorkoutLog({ ...log, emoji: emoji || undefined });
      loadLogs();
    }
    setEmojiLogId(null);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    }
    return date.toLocaleDateString(localeFor(lang), {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  // Group logs by date
  const groupedLogs: { [key: string]: WorkoutLog[] } = {};
  logs.forEach(log => {
    const dateKey = new Date(log.date).toDateString();
    if (!groupedLogs[dateKey]) {
      groupedLogs[dateKey] = [];
    }
    groupedLogs[dateKey].push(log);
  });

  const totalDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0);

  return (
    <div className="home">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        stats={[
          { value: logs.length, label: logs.length === 1 ? t('statWorkoutLogged') : t('statWorkoutsLogged') },
          { value: formatDuration(totalDuration), label: t('statTotalTime') },
        ]}
      />

      <main className="home-sheet">
      <button
        className="btn btn-secondary btn-block"
        onClick={() => navigate('/log-past')}
        style={{ marginBottom: 16 }}
      >
        <Plus size={18} /> {t('addPastWorkout')}
      </button>

      {logs.length === 0 ? (
        <div className="empty-state">
          <Clock size={64} />
          <h3 className="empty-state-title">{t('emptyTitle')}</h3>
          <p>{t('emptyText')}</p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
            <div key={dateKey} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                {formatDate(dateLogs[0].date)}
              </h3>

              {dateLogs.map(log => (
                <div key={log.id} className="card" style={{ marginBottom: 8 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {log.workoutName}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Timer size={14} />
                          {formatDuration(log.duration)}
                        </span>
                        <span>{t('exercisesCount', { n: log.exercises.length })}</span>
                        {log.notes && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MessageSquare size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn btn-ghost"
                        title={t('setEmoji')}
                        onClick={(e) => { e.stopPropagation(); openEmojiPicker(log); }}
                      >
                        {log.emoji ? <span style={{ fontSize: 18 }}>{log.emoji}</span> : <Smile size={18} />}
                      </button>
                      <button
                        className="btn btn-ghost"
                        title={t('edit')}
                        onClick={(e) => { e.stopPropagation(); navigate(`/log-past/${log.id}`); }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                      >
                        <Trash2 size={18} />
                      </button>
                      {expandedId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {expandedId === log.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                      {/* Overall workout note */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={14} />
                          {t('workoutNote')}
                        </div>
                        {log.notes ? (
                          <div
                            onClick={() => startEdit(log.id, null, log.notes)}
                            style={{
                              background: '#f3f4f6',
                              borderRadius: 8,
                              padding: 10,
                              fontSize: 14,
                              fontStyle: 'italic',
                              whiteSpace: 'pre-wrap',
                              cursor: 'pointer',
                            }}
                          >
                            {log.notes}
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => startEdit(log.id, null, '')}
                            style={{ color: '#16C79A', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                          >
                            <Plus size={14} /> {t('addANote')}
                          </button>
                        )}
                      </div>

                      {/* Per-exercise notes + sets */}
                      {log.exercises.map((exercise, idx) => (
                        <div key={idx} style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 500, marginBottom: 6 }}>{translateExercise(lang, exercise.exerciseName)}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {exercise.sets.map((set, setIdx) => (
                              <div
                                key={setIdx}
                                style={{
                                  background: set.completed ? '#dcfce7' : '#f3f4f6',
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: 13,
                                }}
                              >
                                {timedIds.has(exercise.exerciseId)
                                  ? formatCount(set.reps, true, lang)
                                  : t('setReps', { weight: set.weight, reps: set.reps })}
                              </div>
                            ))}
                          </div>

                          {/* Exercise note */}
                          {exercise.note ? (
                            <div
                              onClick={() => startEdit(log.id, idx, exercise.note)}
                              style={{
                                marginTop: 8,
                                background: '#eef2ff',
                                borderRadius: 8,
                                padding: 10,
                                fontSize: 13,
                                fontStyle: 'italic',
                                whiteSpace: 'pre-wrap',
                                cursor: 'pointer',
                                display: 'flex',
                                gap: 6,
                              }}
                            >
                              <MessageSquare size={14} style={{ color: '#16C79A', flexShrink: 0, marginTop: 2 }} />
                              <span>{exercise.note}</span>
                            </div>
                          ) : (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => startEdit(log.id, idx, '')}
                              style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginTop: 6, fontSize: 12 }}
                            >
                              <Plus size={13} /> {t('addNote')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Emoji picker modal */}
      {emojiLogId && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setEmojiLogId(null)}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2 className="modal-title">{t('emojiTitle')}</h2>
              <button className="btn btn-ghost" onClick={() => setEmojiLogId(null)} aria-label={t('cancel')}>
                <X size={22} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {EMOJI_PRESETS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(emojiLogId, e)}
                  style={{
                    fontSize: 26,
                    padding: 8,
                    border: '1px solid var(--gray-200)',
                    borderRadius: 12,
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="form-label">{t('emojiCustom')}</label>
            <input
              type="text"
              className="form-input"
              value={emojiText}
              onChange={e => setEmojiText(e.target.value)}
              placeholder={t('emojiPlaceholder')}
              style={{ textAlign: 'center', fontSize: 22 }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setEmoji(emojiLogId, undefined)}>
                {t('emojiRemove')}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEmojiLogId(null)}>
                {t('cancel')}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setEmoji(emojiLogId, emojiText.trim())}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note edit modal */}
      {editing && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setEditing(null)}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              {editing.exIndex === null ? t('workoutNoteTitle') : t('exerciseNoteTitle')}
            </h2>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder={t('notePlaceholder')}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minHeight: 100,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setEditing(null)}
                style={{ flex: 1 }}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEdit}
                style={{ flex: 1 }}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
