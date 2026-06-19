import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Trophy, Flame, CalendarDays, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutLog } from '../utils/storage';
import { getWorkoutLogs, getTimedExerciseIds, formatCount } from '../utils/storage';
import PageHero from '../components/PageHero';
import { computeSessionStats, effortDistribution, downloadProgressCsv, downloadProgressXlsx } from '../utils/progressStats';
import { OverallProgressChart, EffortPie, VolumeChart, DurationChart, EmojiJournal } from '../components/ProgressCharts';
import { useT, useLang } from '../i18n/context';
import type { Lang } from '../i18n/context';
import { progressStrings } from '../i18n/strings/progress';
import { translateExercise, localeFor } from '../i18n/data';

type Metric = 'weight' | 'reps' | 'time';

interface ExerciseProgress {
  id: string;
  name: string;
  metric: Metric;
  unit: string;
  data: { date: string; value: number }[];
  best: number;
}

function weekStartTime(d: Date): number {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s.getTime();
}

export default function Progress() {
  const t = useT(progressStrings);
  const { lang } = useLang();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [weeklyStats, setWeeklyStats] = useState({ thisWeek: 0, lastWeek: 0, total: 0 });
  const [totalVolume, setTotalVolume] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const allLogs = getWorkoutLogs().filter(l => l.completed);
    allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setLogs(allLogs);

    // Weekly counts
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

    // Total volume (kg moved) across all workouts
    const volume = allLogs.reduce((sum, log) =>
      sum + log.exercises.reduce((s, ex) =>
        s + ex.sets.filter(st => st.completed).reduce((a, st) => a + st.weight * st.reps, 0), 0), 0);
    setTotalVolume(Math.round(volume));

    // Weekly streak (consecutive weeks with at least one workout)
    const weeks = new Set(allLogs.map(l => weekStartTime(new Date(l.date))));
    let count = 0;
    const cursor = new Date(startOfThisWeek);
    // Don't break the streak just because the current week hasn't started yet
    if (!weeks.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
    while (weeks.has(cursor.getTime())) {
      count++;
      cursor.setDate(cursor.getDate() - 7);
    }
    setStreak(count);

    // Per-exercise progress, picking the right metric for each exercise
    const timedIds = getTimedExerciseIds();
    const raw: { [id: string]: { name: string; entries: { date: string; maxWeight: number; maxReps: number }[]; everWeighted: boolean } } = {};

    allLogs.forEach(log => {
      log.exercises.forEach(ex => {
        const completed = ex.sets.filter(s => s.completed);
        if (completed.length === 0) return;
        const maxWeight = Math.max(...completed.map(s => s.weight));
        const maxReps = Math.max(...completed.map(s => s.reps));
        if (!raw[ex.exerciseId]) {
          raw[ex.exerciseId] = { name: ex.exerciseName, entries: [], everWeighted: false };
        }
        raw[ex.exerciseId].name = ex.exerciseName;
        raw[ex.exerciseId].entries.push({
          date: new Date(log.date).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' }),
          maxWeight,
          maxReps,
        });
        if (maxWeight > 0) raw[ex.exerciseId].everWeighted = true;
      });
    });

    const list: ExerciseProgress[] = Object.entries(raw).map(([id, r]) => {
      const metric: Metric = timedIds.has(id) ? 'time' : r.everWeighted ? 'weight' : 'reps';
      const unit = metric === 'weight' ? 'kg' : metric === 'time' ? 's' : 'reps';
      const data = r.entries
        .map(e => ({ date: e.date, value: metric === 'weight' ? e.maxWeight : e.maxReps }))
        .filter(d => d.value > 0);
      const best = data.length ? Math.max(...data.map(d => d.value)) : 0;
      return { id, name: r.name, metric, unit, data, best };
    }).filter(e => e.data.length > 0);

    // Most-trained first
    list.sort((a, b) => b.data.length - a.data.length);
    setExerciseProgress(list);
    if (list.length > 0) setSelectedId(list[0].id);
  }, [lang]);

  const selectedData = exerciseProgress.find(e => e.id === selectedId);

  function formatBest(p: ExerciseProgress): string {
    if (p.metric === 'time') return formatCount(p.best, true, lang);
    if (p.metric === 'weight') return `${p.best} kg`;
    return `${p.best} ${t('unitReps')}`;
  }

  function chartTooltip(value: number): [string, string] {
    if (!selectedData) return [`${value}`, ''];
    if (selectedData.metric === 'time') return [formatCount(value, true, lang), t('best')];
    if (selectedData.metric === 'weight') return [`${value} kg`, t('weight')];
    return [`${value} ${t('unitReps')}`, t('reps')];
  }

  const weekDelta = weeklyStats.thisWeek - weeklyStats.lastWeek;

  // Per-session analytics for the charts and the CSV/Excel export.
  const timedIds = useMemo(() => getTimedExerciseIds(), []);
  const sessionStats = useMemo(
    () => computeSessionStats(logs, timedIds, localeFor(lang)),
    [logs, timedIds, lang]
  );
  const effortSlices = useMemo(() => effortDistribution(logs), [logs]);

  return (
    <div className="home">
      <PageHero
        eyebrow={
          weeklyStats.lastWeek > 0
            ? weekDelta === 0
              ? t('eyebrowSame')
              : weekDelta > 0
                ? t('eyebrowUp', { n: Math.abs(weekDelta) })
                : t('eyebrowDown', { n: Math.abs(weekDelta) })
            : t('eyebrowDefault')
        }
        title={t('title')}
        stats={[
          { value: weeklyStats.thisWeek, label: t('statThisWeek') },
          {
            value: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {streak > 0 && <Flame size={24} />}
                {streak}
              </span>
            ),
            label: streak === 1 ? t('statWeekStreak') : t('statWeeksStreak'),
          },
          { value: weeklyStats.total, label: t('statTotalWorkouts') },
          { value: totalVolume.toLocaleString(localeFor(lang)), label: t('statTotalVolume') },
        ]}
      />

      <main className="home-sheet">
      {logs.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={64} />
          <h3 className="empty-state-title">{t('emptyTitle')}</h3>
          <p>{t('emptyText')}</p>
        </div>
      ) : (
        <>
          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => downloadProgressCsv(sessionStats)}>
              <Download size={18} /> {t('exportCsv')}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => downloadProgressXlsx(sessionStats).catch(() => alert(t('excelError')))}
            >
              <FileSpreadsheet size={18} /> {t('exportExcel')}
            </button>
          </div>

          {/* Overall progress trend (the headline chart) */}
          <OverallProgressChart stats={sessionStats} />

          {/* Effort breakdown */}
          <EffortPie slices={effortSlices} />

          {/* Mood / emoji diary per workout */}
          <EmojiJournal logs={logs} />

          {/* Total weight lifted per workout */}
          <VolumeChart stats={sessionStats} />

          {/* Total duration per workout */}
          <DurationChart stats={sessionStats} />

          {/* Workout calendar */}
          <WorkoutCalendar logs={logs} t={t} lang={lang} />

          {/* Progress Chart */}
          {exerciseProgress.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={18} />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t('sectionProgress')}</h3>
              </div>

              <select
                className="form-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                {exerciseProgress.map(ex => (
                  <option key={ex.id} value={ex.id}>{translateExercise(lang, ex.name)}</option>
                ))}
              </select>

              {selectedData && selectedData.data.length > 1 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} unit={selectedData.metric === 'reps' ? '' : selectedData.unit} />
                      <Tooltip formatter={(value) => chartTooltip(Number(value))} contentStyle={{ borderRadius: 8 }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#16C79A"
                        strokeWidth={2}
                        dot={{ fill: '#16C79A', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 24, textAlign: 'center', color: '#6b7280' }}>
                  {t('needTwoWorkouts')}
                </div>
              )}
            </div>
          )}

          {/* Personal Records */}
          {exerciseProgress.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Trophy size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t('personalRecords')}</h3>
              </div>

              <div className="list">
                {exerciseProgress.map(record => (
                  <div key={record.id} className="list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Trophy size={15} style={{ color: '#f59e0b' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{translateExercise(lang, record.name)}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                          {t('bestLabel', { v: formatBest(record) })}
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
      </main>
    </div>
  );
}

/* ---------- Workout calendar ---------- */

// Local date key (YYYY-MM-DD) so days line up with the user's timezone,
// not UTC — a late-evening workout should land on the right day.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const WEEKDAY_KEYS = [
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
  'weekdaySun',
];

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function WorkoutCalendar({ logs, t, lang }: { logs: WorkoutLog[]; t: TFn; lang: Lang }) {
  // How many workouts happened on each day.
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      const k = dayKey(new Date(l.date));
      map[k] = (map[k] ?? 0) + 1;
    });
    return map;
  }, [logs]);

  const today = new Date();
  const todayKey = dayKey(today);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(localeFor(lang), {
    month: 'long',
    year: 'numeric',
  });

  // Build the grid: leading blanks (Mon-start) then each day of the month.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    // getDay(): 0=Sun..6=Sat → shift so Monday is the first column.
    const lead = (first.getDay() + 6) % 7;
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d));
    return out;
  }, [view]);

  const monthWorkouts = useMemo(
    () =>
      Object.entries(countByDay).reduce((sum, [k, n]) => {
        const [y, m] = k.split('-').map(Number);
        return y === view.year && m === view.month + 1 ? sum + n : sum;
      }, 0),
    [countByDay, view]
  );

  function step(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <CalendarDays size={18} />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t('workoutCalendar')}</h3>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button className="btn btn-ghost" onClick={() => step(-1)} aria-label={t('previousMonth')} style={{ padding: 6 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>{monthLabel}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {monthWorkouts === 0
                ? t('noWorkouts')
                : monthWorkouts === 1
                  ? t('workoutCount', { n: monthWorkouts })
                  : t('workoutCountPlural', { n: monthWorkouts })}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => step(1)} aria-label={t('nextMonth')} style={{ padding: 6 }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {WEEKDAY_KEYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>
              {t(w)}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`b${i}`} />;
            const k = dayKey(d);
            const did = countByDay[k] > 0;
            const isToday = k === todayKey;
            return (
              <div
                key={k}
                title={did ? (countByDay[k] === 1 ? t('workoutCount', { n: countByDay[k] }) : t('workoutCountPlural', { n: countByDay[k] })) : undefined}
                style={{
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: did ? 700 : 400,
                  borderRadius: '50%',
                  color: did ? 'white' : '#374151',
                  background: did ? '#16C79A' : 'transparent',
                  border: isToday && !did ? '1.5px solid #16C79A' : '1.5px solid transparent',
                }}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
