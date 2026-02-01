import { Link } from 'react-router-dom';
import { Play, Dumbbell, Calendar } from 'lucide-react';
import { getWorkouts, getWorkoutLogs } from '../utils/storage';

export default function Home() {
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

  return (
    <div className="page">
      <div className="welcome-card">
        <h2>Welcome to GymTrack</h2>
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
    </div>
  );
}
