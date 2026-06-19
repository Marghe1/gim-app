import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Target, Zap, Youtube } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Exercise, ExerciseHistoryEntry } from '../utils/storage';
import { getExercises, saveExercise, getExerciseHistory, getAverageEffort, getLastWeightForExercise, formatCount, getExerciseVideoUrl } from '../utils/storage';
import { useT, useLang } from '../i18n/context';
import { exerciseDetailStrings } from '../i18n/strings/exerciseDetail';
import { translateExercise, translateMuscle, localeFor } from '../i18n/data';

export default function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const t = useT(exerciseDetailStrings);
  const { lang } = useLang();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [avgEffort, setAvgEffort] = useState<number | null>(null);
  const [lastWeight, setLastWeight] = useState<number | null>(null);

  // Form state
  const [defaultWeight, setDefaultWeight] = useState<number>(0);
  const [weightIncrement, setWeightIncrement] = useState<number>(2.5);
  const [isTimed, setIsTimed] = useState<boolean>(false);
  const [timeInMinutes, setTimeInMinutes] = useState<boolean>(false);
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
      setTimeInMinutes(found.timeUnit === 'minutes');
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
      timeUnit: isTimed && timeInMinutes ? 'minutes' : undefined,
      videoUrl: videoUrl.trim() || undefined,
    };

    saveExercise(updated);
    setExercise(updated);
  }

  if (!exercise) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>{t('exerciseNotFound')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/exercises')}>
            {t('backToExercises')}
          </button>
        </div>
      </div>
    );
  }

  // Format history for chart
  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' }),
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
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{translateExercise(lang, exercise.name)}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{translateMuscle(lang, exercise.muscleGroup)}</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => window.open(getExerciseVideoUrl(exercise), '_blank', 'noopener')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Youtube size={18} style={{ color: '#ef4444' }} /> {t('howTo')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{bestWeight > 0 ? `${bestWeight}kg` : '-'}</div>
          <div className="stat-label">{t('bestWeight')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSessions}</div>
          <div className="stat-label">{t('sessions')}</div>
        </div>
      </div>

      {/* Average Effort */}
      {avgEffort !== null && (
        <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 500 }}>{t('averageEffort')}</span>
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
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('weightProgress')}</h3>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} width={46} tick={{ fontSize: 12 }} unit="kg" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'weight' ? `${value} kg` : formatCount(Number(value), false, lang),
                    name === 'weight' ? t('chartWeight') : t('chartReps')
                  ]}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#16C79A"
                  strokeWidth={2}
                  dot={{ fill: '#16C79A', r: 4 }}
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
          <p style={{ margin: 0 }}>{t('needMoreSessions')}</p>
        </div>
      ) : null}

      {/* Settings */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={18} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('settings')}</h3>
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
            <span className="form-label" style={{ margin: 0 }}>{t('timeBasedLabel')}</span>
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {t('timeBasedHint')}
          </p>
        </div>

        {/* Minutes vs seconds — only relevant for timed exercises */}
        {isTimed && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={timeInMinutes}
                onChange={e => setTimeInMinutes(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span className="form-label" style={{ margin: 0 }}>{t('minutesLabel')}</span>
            </label>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {t('minutesHint')}
            </p>
          </div>
        )}

        {/* Weight settings only make sense for rep-based exercises */}
        {!isTimed && (
          <>
            {lastWeight !== null && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <span style={{ color: '#166534' }}>{t('lastUsed')} <strong>{lastWeight}kg</strong></span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('defaultWeightLabel')}</label>
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
                {t('defaultWeightHint')}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">{t('weightIncrementLabel')}</label>
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
                {t('weightIncrementHint')}
              </p>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">{t('videoUrlLabel')}</label>
          <input
            type="url"
            className="form-input"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {t('videoUrlHint')}
          </p>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSave}>
          {t('saveSettings')}
        </button>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t('recentSessions')}</h3>
          <div className="list">
            {history.slice(-5).reverse().map((entry, idx) => (
              <div key={idx} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">
                    {isTimed ? formatCount(entry.reps, true, lang) : `${entry.weight}kg × ${formatCount(entry.reps, false, lang)}`}
                  </div>
                  <div className="list-item-subtitle">
                    {new Date(entry.date).toLocaleDateString(localeFor(lang), {
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
