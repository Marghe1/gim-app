import { useState, useEffect } from 'react';
import { TrendingUp, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutLog } from '../utils/storage';
import { getWorkoutLogs } from '../utils/storage';

interface ExerciseProgress {
  name: string;
  data: { date: string; weight: number }[];
  bestWeight: number;
  bestReps: number;
}

export default function Progress() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [weeklyStats, setWeeklyStats] = useState({ thisWeek: 0, lastWeek: 0, total: 0 });

  useEffect(() => {
    const allLogs = getWorkoutLogs().filter(l => l.completed);
    allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setLogs(allLogs);

    // Calculate weekly stats
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeek = allLogs.filter(l => new Date(l.date) >= startOfThisWeek).length;
    const lastWeek = allLogs.filter(l => {
      const date = new Date(l.date);
      return date >= startOfLastWeek && date < startOfThisWeek;
    }).length;

    setWeeklyStats({ thisWeek, lastWeek, total: allLogs.length });

    // Build exercise progress data
    const exerciseMap: { [key: string]: ExerciseProgress } = {};

    allLogs.forEach(log => {
      log.exercises.forEach(ex => {
        if (!exerciseMap[ex.exerciseName]) {
          exerciseMap[ex.exerciseName] = {
            name: ex.exerciseName,
            data: [],
            bestWeight: 0,
            bestReps: 0,
          };
        }

        // Get max weight from this workout for this exercise
        const maxWeight = Math.max(...ex.sets.filter(s => s.completed).map(s => s.weight));
        const maxReps = Math.max(...ex.sets.filter(s => s.completed).map(s => s.reps));

        if (maxWeight > 0) {
          exerciseMap[ex.exerciseName].data.push({
            date: new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            weight: maxWeight,
          });

          if (maxWeight > exerciseMap[ex.exerciseName].bestWeight) {
            exerciseMap[ex.exerciseName].bestWeight = maxWeight;
          }
          if (maxReps > exerciseMap[ex.exerciseName].bestReps) {
            exerciseMap[ex.exerciseName].bestReps = maxReps;
          }
        }
      });
    });

    const progressList = Object.values(exerciseMap).filter(e => e.data.length > 0);
    progressList.sort((a, b) => b.data.length - a.data.length);
    setExerciseProgress(progressList);

    if (progressList.length > 0 && !selectedExercise) {
      setSelectedExercise(progressList[0].name);
    }
  }, []);

  const selectedData = exerciseProgress.find(e => e.name === selectedExercise);

  // Get top 5 personal records
  const personalRecords = exerciseProgress
    .filter(e => e.bestWeight > 0)
    .sort((a, b) => b.bestWeight - a.bestWeight)
    .slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">Track your improvement over time</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={64} />
          <h3 className="empty-state-title">No data yet</h3>
          <p>Complete some workouts to see your progress.</p>
        </div>
      ) : (
        <>
          {/* Weekly Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-value">{weeklyStats.thisWeek}</div>
              <div className="stat-label">This week</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{weeklyStats.total}</div>
              <div className="stat-label">Total workouts</div>
            </div>
          </div>

          {/* Progress Chart */}
          {exerciseProgress.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={18} />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Weight Progress</h3>
              </div>

              <select
                className="form-select"
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                {exerciseProgress.map(ex => (
                  <option key={ex.name} value={ex.name}>{ex.name}</option>
                ))}
              </select>

              {selectedData && selectedData.data.length > 1 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="kg" />
                      <Tooltip
                        formatter={(value) => [`${value} kg`, 'Weight']}
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
              ) : (
                <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 24, textAlign: 'center', color: '#6b7280' }}>
                  Need at least 2 workouts with this exercise to show chart
                </div>
              )}
            </div>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Trophy size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Personal Records</h3>
              </div>

              <div className="list">
                {personalRecords.map((record, idx) => (
                  <div key={record.name} className="list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: idx === 0 ? '#fef3c7' : '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: idx === 0 ? '#f59e0b' : '#6b7280',
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                          Best: {record.bestWeight}kg × {record.bestReps} reps
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
