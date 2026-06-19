import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Dumbbell,
  Calendar,
  CalendarClock,
  CalendarDays,
  TrendingUp,
  Camera,
  Download,
  Upload,
  Settings,
} from 'lucide-react';
import { getWorkouts, getWorkoutLogs, getExercises, getSchedule, localDateKey } from '../utils/storage';

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workouts = getWorkouts();
  const logs = getWorkoutLogs();

  // Friendly greeting based on the time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Next planned session: the soonest scheduled day from today onwards whose
  // workout still exists.
  const todayKey = localDateKey(new Date());
  const schedule = getSchedule();
  const nextEntry = Object.entries(schedule)
    .filter(([k]) => k >= todayKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, id]) => ({ k, workout: workouts.find(w => w.id === id) }))
    .find(e => e.workout);

  // Count workouts this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const workoutsThisWeek = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startOfWeek && log.completed;
  }).length;

  function exportData() {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      exercises: getExercises(),
      workouts: getWorkouts(),
      workoutLogs: getWorkoutLogs(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymapp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.version || !data.exercises || !data.workouts || !data.workoutLogs) {
          alert('Invalid backup file format');
          return;
        }

        if (confirm('This will replace all your current data. Continue?')) {
          localStorage.setItem('gymtrack_exercises', JSON.stringify(data.exercises));
          localStorage.setItem('gymtrack_workouts', JSON.stringify(data.workouts));
          localStorage.setItem('gymtrack_workout_logs', JSON.stringify(data.workoutLogs));
          alert('Data restored successfully!');
          window.location.reload();
        }
      } catch {
        alert('Error reading backup file');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="home">
      {/* Colourful hero */}
      <header className="home-hero">
        <div className="home-hero-top">
          <div>
            <p className="home-eyebrow">{greeting} 🌿</p>
            <h1 className="home-title">Hi, Margherita</h1>
          </div>
          <Link to="/about" className="home-avatar" aria-label="About this app">
            🌱
          </Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{workoutsThisWeek}</span>
            <span className="hero-stat-label">workouts this week</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{workouts.length}</span>
            <span className="hero-stat-label">saved templates</span>
          </div>
        </div>
      </header>

      {/* White sheet — sits in the thumb zone */}
      <main className="home-sheet">
        {nextEntry && nextEntry.workout && (
          <div className="next-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary-dark)' }}>
              <CalendarClock size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {nextEntry.k === todayKey
                  ? 'Today'
                  : new Date(`${nextEntry.k}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 700 }}>{nextEntry.workout.name}</span>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workout/${nextEntry.workout!.id}`)}>
                <Play size={16} /> Start
              </button>
            </div>
          </div>
        )}

        <Link to="/workouts" className="cta-primary">
          <Play size={22} fill="white" />
          Start a workout
        </Link>

        {/* Colourful shortcuts */}
        <div className="quick-grid">
          <Link to="/exercises" className="quick-tile">
            <span className="quick-icon" data-accent="mint"><Dumbbell size={22} /></span>
            Exercises
          </Link>
          <Link to="/plan" className="quick-tile">
            <span className="quick-icon" data-accent="lavender"><CalendarDays size={22} /></span>
            Plan
          </Link>
          <Link to="/progress" className="quick-tile">
            <span className="quick-icon" data-accent="coral"><TrendingUp size={22} /></span>
            Progress
          </Link>
          <Link to="/photos" className="quick-tile">
            <span className="quick-icon" data-accent="amber"><Camera size={22} /></span>
            Photos
          </Link>
        </div>

        {logs.length > 0 && (
          <>
            <h3 className="section-title">Recent activity</h3>
            {logs.slice(-3).reverse().map(log => (
              <div key={log.id} className="card">
                <div className="card-header">
                  <span className="card-title">{log.workoutName}</span>
                  <span className="badge badge-primary">{log.completed ? 'Completed' : 'In Progress'}</span>
                </div>
                <div className="card-subtitle">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {new Date(log.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </>
        )}

        {logs.length === 0 && (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <Calendar size={48} />
            <p>No workouts yet. Start your first one to see your activity here!</p>
          </div>
        )}

        {/* Backup Section */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--gray-600)' }}>
            <Settings size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Data backup</h3>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={exportData}>
              <Download size={18} />
              Export
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, textAlign: 'center' }}>
            Export your data to a file for backup or transfer to another device
          </p>
        </div>

        {/* About link */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link
            to="/about"
            style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'none' }}
          >
            About this app
          </Link>
        </div>
      </main>
    </div>
  );
}
