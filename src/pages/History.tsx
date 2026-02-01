import { useState, useEffect } from 'react';
import { Clock, Calendar, Timer, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { WorkoutLog } from '../utils/storage';
import { getWorkoutLogs, deleteWorkoutLog } from '../utils/storage';

export default function History() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    if (confirm('Delete this workout record?')) {
      deleteWorkoutLog(id);
      loadLogs();
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-GB', {
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">View your past workouts</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <Clock size={64} />
          <h3 className="empty-state-title">No workouts yet</h3>
          <p>Complete a workout to see it here.</p>
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
                      <div style={{ fontWeight: 600 }}>{log.workoutName}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Timer size={14} />
                          {formatDuration(log.duration)}
                        </span>
                        <span>{log.exercises.length} exercises</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      {log.exercises.map((exercise, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 500, marginBottom: 6 }}>{exercise.exerciseName}</div>
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
                                {set.weight}kg × {set.reps}
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}
