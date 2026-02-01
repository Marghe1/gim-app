import { Clock } from 'lucide-react';

export default function History() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">View your past workouts</p>
      </div>

      <div className="empty-state">
        <Clock size={64} />
        <h3 className="empty-state-title">Coming in Module 4</h3>
        <p>Your completed workouts will appear here.</p>
      </div>
    </div>
  );
}
