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
import { getWorkouts, getWorkoutLogs, getSchedule, localDateKey } from '../utils/storage';
import { getUserProfile } from '../utils/profileStorage';
import { exportBackup, importBackup } from '../utils/backup';
import PageHero from '../components/PageHero';
import { useT, useLang } from '../i18n/context';
import { localeFor } from '../i18n/data';
import { homeStrings } from '../i18n/strings/home';

export default function Home() {
  const navigate = useNavigate();
  const t = useT(homeStrings);
  const { lang } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workouts = getWorkouts();
  const logs = getWorkoutLogs();

  const profile = getUserProfile();

  // Friendly greeting based on the time of day. The user's name goes in the
  // title below (not here) so it doesn't appear twice.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');

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

  // Use the shared, COMPLETE backup (utils/backup.ts) so the file contains
  // everything — workouts, body measures, profile, settings AND the Glow Up
  // photos — not just the workout data. (An old partial export used to live
  // here and silently skipped photos and measurements.)
  async function exportData() {
    try {
      await exportBackup();
    } catch {
      alert(t('exportError'));
    }
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!confirm(t('confirmRestore'))) return;
    try {
      await importBackup(file);
      alert(t('restoreSuccess'));
      window.location.reload();
    } catch {
      alert(t('restoreError'));
    }
  }

  return (
    <div className="home">
      {/* Colourful hero */}
      <PageHero
        eyebrow={`${greeting} 💪`}
        title={profile.name ? t('title', { name: profile.name }) : t('titleNoName')}
        action={
          <Link to="/profile" className="home-avatar" aria-label={t('aboutAppAria')}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              '🏋️‍♀️'
            )}
          </Link>
        }
        stats={[
          { value: workoutsThisWeek, label: t('statWorkoutsThisWeek') },
          { value: workouts.length, label: t('statSavedTemplates') },
        ]}
      />

      {/* White sheet — sits in the thumb zone */}
      <main className="home-sheet">
        {nextEntry && nextEntry.workout && (
          <div className="next-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--primary-dark)' }}>
              <CalendarClock size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {nextEntry.k === todayKey
                  ? t('today')
                  : new Date(`${nextEntry.k}T00:00:00`).toLocaleDateString(localeFor(lang), { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 700 }}>{nextEntry.workout.name}</span>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workout/${nextEntry.workout!.id}`)}>
                <Play size={16} /> {t('start')}
              </button>
            </div>
          </div>
        )}

        <Link to="/workouts" className="cta-primary">
          <Play size={22} fill="white" />
          {t('startAWorkout')}
        </Link>

        {/* Colourful shortcuts */}
        <div className="quick-grid">
          <Link to="/exercises" className="quick-tile">
            <span className="quick-icon" data-accent="mint"><Dumbbell size={22} /></span>
            {t('exercises')}
          </Link>
          <Link to="/plan" className="quick-tile">
            <span className="quick-icon" data-accent="lavender"><CalendarDays size={22} /></span>
            {t('plan')}
          </Link>
          <Link to="/progress" className="quick-tile">
            <span className="quick-icon" data-accent="coral"><TrendingUp size={22} /></span>
            {t('progress')}
          </Link>
          <Link to="/photos" className="quick-tile">
            <span className="quick-icon" data-accent="amber"><Camera size={22} /></span>
            {t('photos')}
          </Link>
        </div>

        {logs.length > 0 && (
          <>
            <h3 className="section-title">{t('recentActivity')}</h3>
            {logs.slice(-3).reverse().map(log => (
              <div key={log.id} className="card">
                <div className="card-header">
                  <span className="card-title">{log.workoutName}</span>
                  <span className="badge badge-primary">{log.completed ? t('completed') : t('inProgress')}</span>
                </div>
                <div className="card-subtitle">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {new Date(log.date).toLocaleDateString(localeFor(lang))}
                </div>
              </div>
            ))}
          </>
        )}

        {logs.length === 0 && (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <Calendar size={48} />
            <p>{t('emptyState')}</p>
          </div>
        )}

        {/* Backup Section */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--gray-600)' }}>
            <Settings size={18} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t('dataBackup')}</h3>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={exportData}>
              <Download size={18} />
              {t('export')}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              {t('import')}
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
            {t('backupHint')}
          </p>
        </div>

        {/* About link */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link
            to="/about"
            style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'none' }}
          >
            {t('aboutThisApp')}
          </Link>
        </div>
      </main>
    </div>
  );
}
