import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, X, Trash2, Pencil, Ruler } from 'lucide-react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BodyProfile, Measurement, Sex } from '../utils/bodyStorage';
import { computeBmi } from '../utils/bodyStorage';
import { useT, useLang } from '../i18n/context';
import { bodyStrings } from '../i18n/strings/body';
import { localeFor } from '../i18n/data';

const MINT = '#16c79a';
const SKY = '#6cc8ff';
const AMBER = '#ffc247';
const CORAL = '#ff8a80';
const LAVENDER = '#b9a7f0';
const GRID = '#e2eae7';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  profile: BodyProfile;
  measurements: Measurement[];
  onSaveProfile: (p: BodyProfile) => void;
  onSaveMeasurement: (m: Measurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

export default function BodyMeasurements({
  profile,
  measurements,
  onSaveProfile,
  onSaveMeasurement,
  onDeleteMeasurement,
}: Props) {
  const t = useT(bodyStrings);
  const { lang } = useLang();
  const locale = localeFor(lang);
  const [editing, setEditing] = useState<Measurement | null>(null);
  // Local string state so decimals (e.g. 72.5) can be typed in the weight field.
  const [weightInput, setWeightInput] = useState(profile.weightKg != null ? String(profile.weightKg) : '');

  // Live BMI from the details (height + current weight) shown in the card and hero.
  const profileBmi = computeBmi(profile.weightKg, profile.heightCm);

  const dateLabel = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  // Chart data
  const weightBmiData = measurements
    .filter(m => m.weightKg != null)
    .map(m => ({
      date: dateLabel(m.date),
      weight: m.weightKg,
      bmi: computeBmi(m.weightKg, profile.heightCm),
    }));

  const circumData = measurements
    .filter(m => m.waistCm != null || m.hipsCm != null || m.thighCm != null || m.tricepsCm != null)
    .map(m => ({
      date: dateLabel(m.date),
      waist: m.waistCm,
      hips: m.hipsCm,
      thigh: m.thighCm,
      triceps: m.tricepsCm,
    }));

  function openAdd() {
    setEditing({ id: uuid(), date: todayISO() });
  }

  return (
    <div>
      {/* Your details: sex + height (used for BMI) */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          {t('detailsTitle')}
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">{t('sex')}</label>
            <select
              className="form-select"
              value={profile.sex ?? ''}
              onChange={e => onSaveProfile({ ...profile, sex: (e.target.value || undefined) as Sex | undefined })}
            >
              <option value="">—</option>
              <option value="female">{t('female')}</option>
              <option value="male">{t('male')}</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">{t('heightCm')}</label>
            <input
              type="number"
              inputMode="decimal"
              className="form-input"
              value={profile.heightCm ?? ''}
              onChange={e =>
                onSaveProfile({ ...profile, heightCm: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="—"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">{t('weightKg')}</label>
            <input
              type="number"
              inputMode="decimal"
              className="form-input"
              value={weightInput}
              onChange={e => {
                setWeightInput(e.target.value);
                onSaveProfile({ ...profile, weightKg: e.target.value ? Number(e.target.value) : undefined });
              }}
              placeholder="—"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">{t('bmi')}</label>
            <div
              className="form-input"
              style={{ background: 'var(--gray-100)', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--primary-dark)' }}
            >
              {profileBmi != null ? profileBmi : '—'}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>{t('bmiHint')}</p>
      </div>

      <button className="btn btn-primary btn-block" onClick={openAdd} style={{ marginBottom: 16 }}>
        <Plus size={18} /> {t('addMeasurement')}
      </button>

      {measurements.length === 0 ? (
        <div className="empty-state">
          <Ruler size={48} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
          <div className="empty-state-title">{t('emptyTitle')}</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{t('emptyText')}</p>
        </div>
      ) : (
        <>
          {/* Weight (line) + BMI (bars) */}
          <ChartCard title={t('weightBmiTitle')} subtitle={t('weightBmiSubtitle')}>
            {weightBmiData.length < 2 ? (
              <Hint text={t('needTwo')} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={weightBmiData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={44} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={38} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="right" dataKey="bmi" name={t('legendBmi')} fill={LAVENDER} radius={[5, 5, 0, 0]} maxBarSize={34} />
                  <Line yAxisId="left" type="monotone" dataKey="weight" name={t('legendWeight')} stroke={MINT} strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Circumferences stacked */}
          <ChartCard title={t('circumferencesTitle')} subtitle={t('circumferencesSubtitle')}>
            {circumData.length < 2 ? (
              <Hint text={t('needTwo')} />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={circumData} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={44} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="waist" stackId="c" name={t('legendWaist')} fill={MINT} />
                  <Bar dataKey="hips" stackId="c" name={t('legendHips')} fill={SKY} />
                  <Bar dataKey="thigh" stackId="c" name={t('legendThigh')} fill={AMBER} />
                  <Bar dataKey="triceps" stackId="c" name={t('legendTriceps')} fill={CORAL} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* History list */}
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, margin: '8px 4px 12px' }}>
            {t('history')}
          </h3>
          <div className="list">
            {[...measurements].reverse().map(m => {
              const bmi = computeBmi(m.weightKg, profile.heightCm);
              return (
                <div key={m.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {new Date(m.date + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="list-item-subtitle">
                      {[
                        m.weightKg != null ? `${m.weightKg} kg` : null,
                        bmi != null ? `${t('bmi')} ${bmi}` : null,
                        m.waistCm != null ? `${t('legendWaist')} ${m.waistCm}` : null,
                        m.hipsCm != null ? `${t('legendHips')} ${m.hipsCm}` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="list-item-actions" style={{ gap: 4 }}>
                    <button className="btn btn-ghost" onClick={() => setEditing(m)} aria-label={t('editMeasurement')}>
                      <Pencil size={18} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => { if (confirm(t('deleteConfirm'))) onDeleteMeasurement(m.id); }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing && (
        <MeasurementModal
          initial={editing}
          heightCm={profile.heightCm}
          t={t}
          onClose={() => setEditing(null)}
          onSave={m => { onSaveMeasurement(m); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: subtitle ? 2 : 12 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div style={{ background: 'var(--gray-100)', borderRadius: 12, padding: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
      {text}
    </div>
  );
}

/* ---------- Add / edit measurement modal ---------- */

function MeasurementModal({
  initial,
  heightCm,
  t,
  onClose,
  onSave,
}: {
  initial: Measurement;
  heightCm?: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onSave: (m: Measurement) => void;
}) {
  const [date, setDate] = useState(initial.date);
  const [weight, setWeight] = useState(initial.weightKg?.toString() ?? '');
  const [waist, setWaist] = useState(initial.waistCm?.toString() ?? '');
  const [hips, setHips] = useState(initial.hipsCm?.toString() ?? '');
  const [thigh, setThigh] = useState(initial.thighCm?.toString() ?? '');
  const [triceps, setTriceps] = useState(initial.tricepsCm?.toString() ?? '');

  const num = (s: string) => (s.trim() ? Number(s) : undefined);
  const bmi = computeBmi(num(weight), heightCm);

  function save() {
    onSave({
      id: initial.id,
      date,
      weightKg: num(weight),
      waistCm: num(waist),
      hipsCm: num(hips),
      thighCm: num(thigh),
      tricepsCm: num(triceps),
    });
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder = '') => (
    <div style={{ flex: 1 }}>
      <label className="form-label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="form-input"
        value={value}
        onChange={e => set(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('modalTitle')}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label={t('cancel')}>
            <X size={22} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">{t('date')}</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {field(t('weightKg'), weight, setWeight)}
          <div style={{ flex: 1 }}>
            <label className="form-label">{t('bmi')}</label>
            <div
              className="form-input"
              style={{ background: 'var(--gray-100)', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--primary-dark)' }}
            >
              {bmi != null ? bmi : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {field(t('waistCm'), waist, setWaist)}
          {field(t('hipsCm'), hips, setHips)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {field(t('thighCm'), thigh, setThigh)}
          {field(t('tricepsCm'), triceps, setTriceps)}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
