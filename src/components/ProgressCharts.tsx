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
import { Info } from 'lucide-react';
import type { SessionStat, EffortSlice } from '../utils/progressStats';
import { EFFORT_META } from '../utils/progressStats';
import { formatDuration } from '../utils/storage';

const MINT = '#16c79a';
const CORAL = '#ff8a80';
const SKY = '#6cc8ff';
const LAVENDER = '#b9a7f0';
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
  const { data, truncated } = recent(stats);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stats.find(s => s.id === selectedId) ?? null;

  return (
    <ChartCard
      title="Overall progress"
      subtitle="A 0–100 score per workout blending weight, reps and effort vs your best. Tap a bar for details."
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={data}
          margin={{ top: 18, right: 6, left: -18, bottom: 0 }}
          onClick={(state: any) => {
            const p = state?.activePayload?.[0]?.payload as SessionStat | undefined;
            if (p) setSelectedId(prev => (prev === p.id ? null : p.id));
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={34} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
            formatter={(value: any, name: any) => [value, name === 'score' ? 'Score' : 'Trend']}
            labelFormatter={(l: any) => l}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} cursor="pointer" maxBarSize={42}>
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
          Showing your last {MAX_POINTS} workouts ({truncated} earlier not shown)
        </p>
      )}

      {selected && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--mint-wash)',
            border: '1px solid var(--mint-soft)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>{selected.workoutName}</strong>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {new Date(selected.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
            <Pill label="Score" value={`${selected.score}${selected.isBest ? ' 🔥' : ''}`} />
            <Pill label="Weight" value={`${selected.volume.toLocaleString('en-GB')} kg`} />
            <Pill label="Reps" value={`${selected.reps}`} />
            {selected.timeSec > 0 && <Pill label="Hold" value={`${selected.timeSec}s`} />}
            {selected.avgEffort !== null && (
              <Pill label="Effort" value={`${effortFor(selected.avgEffort)?.emoji ?? ''} ${selected.avgEffort.toFixed(1)}`} />
            )}
            <Pill label="Time" value={formatDuration(selected.durationSec)} />
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
  const total = slices.reduce((a, s) => a + s.count, 0);
  if (total === 0) return null;

  return (
    <ChartCard title="How hard your workouts felt" subtitle="Effort you logged after each exercise.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ResponsiveContainer width="100%" height={200} minWidth={200}>
          <PieChart>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
              formatter={(value: any, _n: any, item: any) => [
                `${value} time${value === 1 ? '' : 's'}`,
                `${item?.payload?.emoji ?? ''} ${item?.payload?.label ?? ''}`,
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
            {s.emoji} {s.label}
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
}: {
  stats: SessionStat[];
  dataKey: 'volume' | 'reps';
  color: string;
  unit: string;
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
          formatter={(value: any) => [`${Number(value).toLocaleString('en-GB')} ${unit}`, dataKey === 'volume' ? 'Weight' : 'Reps']}
        />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={42}>
          <LabelList dataKey={dataKey} position="top" style={{ fontSize: 10, fontWeight: 700, fill: 'var(--gray-500)' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ stats }: { stats: SessionStat[] }) {
  const hasVolume = stats.some(s => s.volume > 0);
  if (!hasVolume) return null;
  return (
    <ChartCard title="Weight lifted each workout" subtitle="Total kilograms moved (weight × reps).">
      <TimeSeriesBars stats={stats} dataKey="volume" color={MINT} unit="kg" />
    </ChartCard>
  );
}

export function RepsChart({ stats }: { stats: SessionStat[] }) {
  const hasReps = stats.some(s => s.reps > 0);
  if (!hasReps) return null;
  return (
    <ChartCard title="Repetitions each workout" subtitle="Total reps across all exercises.">
      <TimeSeriesBars stats={stats} dataKey="reps" color={SKY} unit="reps" />
    </ChartCard>
  );
}
