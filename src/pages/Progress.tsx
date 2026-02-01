import { TrendingUp } from 'lucide-react';

export default function Progress() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">Track your improvement over time</p>
      </div>

      <div className="empty-state">
        <TrendingUp size={64} />
        <h3 className="empty-state-title">Coming in Module 4</h3>
        <p>Charts showing your progress will appear here.</p>
      </div>
    </div>
  );
}
