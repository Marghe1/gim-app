import { useState } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Info, X } from 'lucide-react';
import type { SessionStat, EffortSlice } from '../utils/progressStats';
import { EFFORT_META } from '../utils/progressStats';
import type { WorkoutLog } from '../utils/storage';
import { formatDuration } from '../utils/storage';
import { useT, useLang } from '../i18n/context';
import { progressChartsStrings } from '../i18n/strings/progressCharts';
import { localeFor } from '../i18n/data';

// Map the English effort label (from EFFORT_META) to a translation key so the
// pie legend/tooltip can show the level name in the chosen language.
const EFFORT_LABEL_KEY: Record<string, string> = {
  'Very easy': 'effortVeryEasy',
  Easy: 'effortEasy',
  Moderate: 'effortModerate',
  Hard: 'effortHard',
  Maximum: 'effortMaximum',
};

const MINT = '#16c79a';
const CORAL = '#ff8a80';
const LAVENDER = '#b9a7f0';
const SKY = '#6cc8ff';
const GRID = '#e2eae7';

// Keep time-series charts readable — show the most recent N sessions.
const MAX_POINTS = 12;

function recent<T>(arr: T[]): { data: T[]; truncated: number } {
  if (arr.length <= MAX_POINTS) return { data: arr, truncated: 0 };
  return { data: arr.slice(-MAX_POINTS), truncated: arr.length - MAX_POINTS };
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: subtitle ? 2 : 12 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Info size={13} /> {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function effortFor(avg: number | null) {
  if (avg === null) return null;
  return EFFORT_META[Math.min(4, Math.max(0, Math.round(avg) - 1))];
}

/** The headline chart: 0–100 overall score per session (bars) + trend line. Clickable. */
export function OverallProgressChart({ stats }: { stats: SessionStat[] }) {
  const t = useT(progressChartsStrings);
  const { lang } = useLang();
  const { data, truncated } = recent(stats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stats.find(s => s.id === selectedId) ?? null;

  return (
    <ChartCard
      title={t('overallProgressTitle')}
      subtitle={t('overallProgressSubtitle')}
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={data}
          margin={{ top: 18, right: 6, left: -18, bottom: 0 }}
          onClick={(state: any) => {
            const p = state?.activePayload?.[0]?.payload as SessionStat | undefined;
            if (p) setSelectedId(p.id);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={34} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
            formatter={(value: any, name: any) => [value, name === 'score' ? t('legendScore') : t('legendTrend')]}
            labelFormatter={(l: any) => l}
          />
          <Bar
            dataKey="score"
            radius={[6, 6, 0, 0]}
            cursor="pointer"
            maxBarSize={42}
            onClick={(d: any) => {
              const id = d?.id ?? d?.payload?.id;
              if (id) setSelectedId(id);
            }}
          >
            {data.map(d => (
              <Cell key={d.id} fill={d.isBest ? CORAL : MINT} fillOpacity={selectedId && selectedId !== d.id ? 0.4 : 1} />
            ))}
            <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--gray-600)' }} />
          </Bar>
          <Line type="monotone" dataKey="trend" stroke={LAVENDER} strokeWidth={3} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {truncated > 0 && (
        <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 4 }}>
          {t('showingLastWorkouts', { max: MAX_POINTS, truncated })}
        </p>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selected.workoutName}</h2>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                  {new Date(selected.date).toLocaleDateString(localeFor(lang), {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedId(null)} aria-label={t('detailClose')}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, marginBottom: 18 }}>
              <Pill label={t('detailScore')} value={`${selected.score}${selected.isBest ? ' 🔥' : ''}`} />
              <Pill label={t('detailWeight')} value={`${selected.volume.toLocaleString(localeFor(lang))} kg`} />
              <Pill label={t('detailReps')} value={`${selected.reps}`} />
              {selected.timeSec > 0 && <Pill label={t('detailHold')} value={`${selected.timeSec}s`} />}
              {selected.avgEffort !== null && (
                <Pill label={t('detailEffort')} value={`${effortFor(selected.avgEffort)?.emoji ?? ''} ${selected.avgEffort.toFixed(1)}`} />
              )}
              <Pill label={t('detailTime')} value={formatDuration(selected.durationSec)} />
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={15} /> {t('detailWhatTitle')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.55, margin: 0 }}>
                {t('detailExplanation', { score: selected.score })}
              </p>
              {selected.isBest && (
                <p style={{ fontSize: 13, color: 'var(--primary-dark)', fontWeight: 600, marginTop: 8 }}>
                  {t('detailBestNote')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        background: 'white',
        border: '1px solid var(--gray-200)',
        borderRadius: 999,
        padding: '4px 10px',
        fontWeight: 600,
      }}
    >
      <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{label}: </span>
      {value}
    </span>
  );
}

const RADIAN = Math.PI / 180;

/** Effort distribution pie with emoji slice labels + a legend. */
export function EffortPie({ slices }: { slices: EffortSlice[] }) {
  const t = useT(progressChartsStrings);
  const total = slices.reduce((a, s) => a + s.count, 0);
  if (total === 0) return null;

  // EFFORT_META labels are stored in English; show the localized name.
  const labelFor = (label: string) => {
    const key = EFFORT_LABEL_KEY[label];
    return key ? t(key) : label;
  };

  return (
    <ChartCard title={t('effortPieTitle')} subtitle={t('effortPieSubtitle')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ResponsiveContainer width="100%" height={200} minWidth={200}>
          <PieChart>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
              formatter={(value: any, _n: any, item: any) => [
                value === 1 ? t('tooltipTimesOne', { n: value }) : t('tooltipTimesMany', { n: value }),
                `${item?.payload?.emoji ?? ''} ${labelFor(item?.payload?.label ?? '')}`,
              ]}
            />
            <Pie
              data={slices}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
              label={(props: any) => {
                const { cx, cy, midAngle, innerRadius, outerRadius, index } = props;
                const r = innerRadius + (outerRadius - innerRadius) * 0.6;
                const x = cx + r * Math.cos(-midAngle * RADIAN);
                const y = cy + r * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 18 }}>
                    {slices[index].emoji}
                  </text>
                );
              }}
            >
              {slices.map(s => (
                <Cell key={s.value} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' }}>
        {slices.map(s => (
          <span key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, display: 'inline-block' }} />
            {s.emoji} {labelFor(s.label)}
            <strong>{Math.round((s.count / total) * 100)}%</strong>
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

/** A simple bars-over-time chart with numbers on top. */
function TimeSeriesBars({
  stats,
  dataKey,
  color,
  unit,
  label,
  locale,
}: {
  stats: SessionStat[];
  dataKey: 'volume' | 'reps';
  color: string;
  unit: string;
  label: string;
  locale: string;
}) {
  const { data } = recent(stats);
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 18, right: 6, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={38} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          formatter={(value: any) => [`${Number(value).toLocaleString(locale)} ${unit}`, label]}
        />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={42}>
          <LabelList dataKey={dataKey} position="top" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--gray-500)' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ stats }: { stats: SessionStat[] }) {
  const t = useT(progressChartsStrings);
  const { lang } = useLang();
  const hasVolume = stats.some(s => s.volume > 0);
  if (!hasVolume) return null;
  return (
    <ChartCard title={t('volumeTitle')} subtitle={t('volumeSubtitle')}>
      <TimeSeriesBars stats={stats} dataKey="volume" color={MINT} unit="kg" label={t('legendWeight')} locale={localeFor(lang)} />
    </ChartCard>
  );
}

/** A visual diary: each recent workout's overall mood emoji plus the per-exercise
 *  effort emojis (😴😊😐😓🔥), newest first. */
export function EmojiJournal({ logs }: { logs: WorkoutLog[] }) {
  const t = useT(progressChartsStrings);
  const { lang } = useLang();

  const emojiForEffort = (rating?: number) =>
    rating === undefined ? null : EFFORT_META[Math.min(4, Math.max(0, Math.round(rating) - 1))].emoji;

  // Newest first; keep only sessions that carry some emoji signal.
  const entries = logs
    .filter(l => l.completed)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(l => ({
      log: l,
      effortEmojis: l.exercises.map(e => emojiForEffort(e.effortRating)).filter(Boolean) as string[],
    }))
    .filter(e => e.log.emoji || e.effortEmojis.length > 0)
    .slice(0, 10);

  if (entries.length === 0) return null;

  return (
    <ChartCard title={t('emojiJournalTitle')} subtitle={t('emojiJournalSubtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(({ log, effortEmojis }) => (
          <div
            key={log.id}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-100)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>
                  {new Date(log.date).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' })}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--gray-500)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {log.workoutName}
                </div>
              </div>
              {log.emoji && <span style={{ fontSize: 30, lineHeight: 1 }}>{log.emoji}</span>}
            </div>
            {effortEmojis.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, fontSize: 18 }}>
                {effortEmojis.map((e, i) => (
                  <span key={i}>{e}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/** Total duration of each workout. Bars are in minutes; labels/tooltip show the
 *  friendly "1h 20m" form. */
export function DurationChart({ stats }: { stats: SessionStat[] }) {
  const t = useT(progressChartsStrings);
  const hasDuration = stats.some(s => s.durationSec > 0);
  if (!hasDuration) return null;
  // Carry durationSec alongside a rounded-minutes value used for the bar height.
  const { data } = recent(stats.map(s => ({ ...s, minutes: Math.round(s.durationSec / 60) })));
  return (
    <ChartCard title={t('durationTitle')} subtitle={t('durationSubtitle')}>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 18, right: 6, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={38} unit="m" />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
            formatter={(_value: any, _n: any, item: any) => [formatDuration(item?.payload?.durationSec ?? 0), t('legendDuration')]}
          />
          <Bar dataKey="minutes" fill={SKY} radius={[6, 6, 0, 0]} maxBarSize={42}>
            <LabelList
              dataKey="durationSec"
              position="top"
              formatter={(v: any) => formatDuration(Number(v))}
              style={{ fontSize: 10, fontWeight: 700, fill: 'var(--gray-500)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
