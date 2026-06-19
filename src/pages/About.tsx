import { useRef, useState } from 'react';
import { Heart, CloudRain, Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../utils/backup';
import { useT, useLang, LANGS, LANG_LABELS } from '../i18n/context';
import { aboutStrings } from '../i18n/strings/about';

export default function About() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<string>('');
  const t = useT(aboutStrings);
  const { lang, setLang } = useLang();

  async function handleExport() {
    setBusy('export');
    setMessage('');
    try {
      await exportBackup();
      setMessage(t('exportDone'));
    } catch {
      setMessage(t('exportFail'));
    } finally {
      setBusy(null);
    }
  }

  async function handleImportFile(file: File) {
    if (!confirm(t('restoreConfirm'))) return;
    setBusy('import');
    setMessage('');
    try {
      const s = await importBackup(file);
      setMessage(
        t('restoreDone', {
          workouts: s.workouts,
          logs: s.logs,
          exercises: s.exercises,
          photos: s.photos,
        })
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('restoreFail'));
      setBusy(null);
    }
  }

  return (
    <div
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingLeft: 32,
        paddingRight: 32,
        paddingTop: 32,
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginTop: 24,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CloudRain size={36} style={{ color: '#9ca3af' }} />
        <Heart size={32} style={{ color: '#ec4899' }} />
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#374151' }}>GymApp</h1>

      <p
        style={{
          fontSize: 15,
          color: '#6b7280',
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {t('bio')}
      </p>

      <div
        style={{
          fontSize: 13,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{t('madeWith')}</span>
        <Heart size={14} style={{ color: '#ec4899', fill: '#ec4899' }} />
        <span>{t('madeBy')}</span>
      </div>

      {/* Language */}
      <div className="card" style={{ width: '100%', maxWidth: 360, marginTop: 32, textAlign: 'left' }}>
        <div className="card-header">
          <div className="card-title">{t('language')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {LANGS.map((l) => (
            <button
              key={l}
              className={`btn btn-block ${lang === l ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Backup & restore */}
      <div className="card" style={{ width: '100%', maxWidth: 360, marginTop: 16, textAlign: 'left' }}>
        <div className="card-header">
          <div className="card-title">{t('backupTitle')}</div>
        </div>
        <div className="card-subtitle" style={{ marginBottom: 16 }}>
          {t('backupSubtitle')}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) handleImportFile(f);
          }}
        />

        <button
          className="btn btn-primary btn-block"
          onClick={handleExport}
          disabled={busy !== null}
          style={{ marginBottom: 8 }}
        >
          <Download size={18} /> {busy === 'export' ? t('preparing') : t('exportBackup')}
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
        >
          <Upload size={18} /> {busy === 'import' ? t('restoring') : t('restoreBackup')}
        </button>

        {message && (
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 12, marginBottom: 0 }}>
            {message}
          </p>
        )}
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: '#d1d5db', lineHeight: 1.8 }}>
        <div>2026</div>
        <div>{t('version')}: {__BUILD_TIME__}</div>
      </div>
    </div>
  );
}
