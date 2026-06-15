import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Target, Zap, Youtube } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Exercise, ExerciseHistoryEntry } from '../utils/storage';
import { getExercises, saveExercise, getExerciseHistory, getAverageEffort, getLastWeightForExercise, formatCount, getExerciseVideoUrl } from '../utils/storage';

export default function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [avgEffort, setAvgEffort] = useState<number | null>(null);
  const [lastWeight, setLastWeight] = useState<number | null>(null);

  // Form state
  const [defaultWeight, setDefaultWeight] = useState<number>(0);
  const [weightIncrement, setWeightIncrement] = useState<number>(2.5);
  const [isTimed, setIsTimed] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    if (!exerciseId) return;

    const exercises = getExercises();
    const found = exercises.find(e => e.id === exerciseId);
    if (found) {
      setExercise(found);
      setDefaultWeight(found.defaultWeight || 0);
      setWeightIncrement(found.weightIncrement || 2.5);
      setIsTimed(found.isTimed || false);
      setVideoUrl(found.videoUrl || '');
    }

    setHistory(getExerciseHistory(exerciseId));
    setAvgEffort(getAverageEffort(exerciseId, 5));
    setLastWeight(getLastWeightForExercise(exerciseId));
  }, [exerciseId]);

  function handleSave() {
    if (!exercise) return;

    const updated: Exercise = {
      ...exercise,
      defaultWeight: defaultWeight || undefined,
      weightIncrement: weightIncrement || 2.5,
      isTimed: isTimed || undefined,
      videoUrl: videoUrl.trim() || undefined,
    };

    saveExercise(updated);
    setExercise(updated);
  }

  if (!exercise) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Exercise not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/exercises')}>
            Back to Exercises
          </button>
        </div>
      </div>
    );
  }

  // Format history for chart
  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    weight: h.weight,
    reps: h.reps,
  }));

  // Stats
  const bestWeight = history.length > 0 ? Math.max(...history.map(h => h.weight)) : 0;
  const totalSessions = history.length;

  // Effort display
  const effortStars = avgEffort !== null ? Math.round(avgEffort) : 0;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/exercises')}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{exercise.name}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{exercise.muscleGroup}</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => window.open(getExerciseVideoUrl(exercise), '_blank', 'noopener')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Youtube size={18} style={{ color: '#ef4444' }} /> How to
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{bestWeight > 0 ? `${bestWeight}kg` : '-'}</div>
          <div className="stat-label">Best Weight</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
      </div>

      {/* Average Effort */}
      {avgEffort !== null && (
        <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 500 }}>Average Effort</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                style={{
                  fontSize: 24,
                  color: star <= effortStars ? '#f59e0b' : '#d1d5db',
                }}
              >
                {star <= effortStars ? '★' : '☆'}
              </span>
            ))}
            <span style={{ marginLeft: 8, color: '#6b7280' }}>
              ({avgEffort.toFixed(1)}/5)
            </span>
          </div>
        </div>
      )}

      {/* Weight History Chart */}
      {chartData.length > 1 ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Weight Progress</h3>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="kg" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'weight' ? `${value} kg` : `${value} reps`,
                    name === 'weight' ? 'Weight' : 'Reps'
                  ]}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : chartData.length === 1 ? (
        <div style={{
          background: '#f3f4f6',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          marginBottom: 24,
          color: '#6b7280'
        }}>
          <TrendingUp size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Complete 2+ sessions to see progress chart</p>
        </div>
      ) : null}

      {/* Settings */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={18} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Settings</h3>
        </div>

        {/* Time-based toggle */}
        <div className="form-group">
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={isTimed}
              onChange={e => setIsTimed(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span className="form-label" style={{ margin: 0 }}>Time-based exercise (measured in seconds)</span>
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Turn on for holds, planks or balance exercises. Shows seconds instead of reps.
          </p>
        </div>

        {/* Weight settings only make sense for rep-based exercises */}
        {!isTimed && (
          <>
            {lastWeight !== null && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <span style={{ color: '#166534' }}>Last used: <strong>{lastWeight}kg</strong></span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Default Starting Weight (kg)</label>
              <input
                type="number"
                className="form-input"
                value={defaultWeight || ''}
                onChange={e => setDefaultWeight(Number(e.target.value))}
                placeholder="0"
                min={0}
                step={0.5}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Used when no previous history exists
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Weight Increment (kg)</label>
              <input
                type="number"
                className="form-input"
                value={weightIncrement}
                onChange={e => setWeightIncrement(Number(e.target.value))}
                placeholder="2.5"
                min={0.5}
                step={0.5}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                How much to increase when progressing
              </p>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Video URL (optional)</label>
          <input
            type="url"
            className="form-input"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Leave empty to auto-search YouTube by exercise name
          </p>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSave}>
          Save Settings
        </button>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Sessions</h3>
          <div className="list">
            {history.slice(-5).reverse().map((entry, idx) => (
              <div key={idx} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">
                    {isTimed ? formatCount(entry.reps, true) : `${entry.weight}kg × ${entry.reps} reps`}
                  </div>
                  <div className="list-item-subtitle">
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
                {entry.effortRating && (
                  <div style={{ color: '#f59e0b' }}>
                    {'★'.repeat(entry.effortRating)}{'☆'.repeat(5 - entry.effortRating)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
