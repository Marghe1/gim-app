import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Dumbbell, Calendar, Download, Upload, Settings } from 'lucide-react';
import { getWorkouts, getWorkoutLogs, getExercises } from '../utils/storage';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workouts = getWorkouts();
  const logs = getWorkoutLogs();

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
    a.download = `gymtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="page">
      <div className="welcome-card">
        <h2>Welcome to Gim app</h2>
        <p>Track your circuit training and see your progress over time.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{workoutsThisWeek}</div>
          <div className="stat-label">Workouts this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{workouts.length}</div>
          <div className="stat-label">Saved templates</div>
        </div>
      </div>

      <Link to="/workouts" className="btn btn-primary btn-block" style={{ marginBottom: 12 }}>
        <Play size={20} />
        Start Workout
      </Link>

      <Link to="/exercises" className="btn btn-secondary btn-block" style={{ marginBottom: 12 }}>
        <Dumbbell size={20} />
        Manage Exercises
      </Link>

      {logs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Recent Activity</h3>
          {logs.slice(-3).reverse().map(log => (
            <div key={log.id} className="card">
              <div className="card-header">
                <span className="card-title">{log.workoutName}</span>
                <span className="badge">{log.completed ? 'Completed' : 'In Progress'}</span>
              </div>
              <div className="card-subtitle">
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                {new Date(log.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {logs.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <Calendar size={48} />
          <p>No workouts yet. Start your first workout to see your activity here!</p>
        </div>
      )}

      {/* Backup Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Settings size={18} />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Data Backup</h3>
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
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
          Export your data to a file for backup or transfer to another device
        </p>
      </div>

      {/* About link */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link
          to="/about"
          style={{
            fontSize: 12,
            color: '#d1d5db',
            textDecoration: 'none',
          }}
        >
          About this app
        </Link>
      </div>
    </div>
  );
}
