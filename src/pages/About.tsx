import { useRef, useState } from 'react';
import { Heart, CloudRain, Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../utils/backup';

export default function About() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<string>('');

  async function handleExport() {
    setBusy('export');
    setMessage('');
    try {
      await exportBackup();
      setMessage('Backup saved. Keep the file somewhere safe.');
    } catch {
      setMessage('Sorry, the backup could not be created.');
    } finally {
      setBusy(null);
    }
  }

  async function handleImportFile(file: File) {
    if (
      !confirm(
        'Restore from this backup? Your current workouts will be replaced, and the photos from the backup will be added.'
      )
    )
      return;
    setBusy('import');
    setMessage('');
    try {
      const s = await importBackup(file);
      setMessage(
        `Restored ${s.workouts} workouts, ${s.logs} sessions, ${s.exercises} exercises and ${s.photos} photos. Reloading…`
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Sorry, the backup could not be restored.');
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
        My very first app. Built with curiosity, a lot of patience and even more love.
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
        <span>Made with</span>
        <Heart size={14} style={{ color: '#ec4899', fill: '#ec4899' }} />
        <span>by Margherita in Brussels</span>
      </div>

      {/* Backup & restore */}
      <div className="card" style={{ width: '100%', maxWidth: 360, marginTop: 32, textAlign: 'left' }}>
        <div className="card-header">
          <div className="card-title">Backup &amp; restore</div>
          <div className="card-subtitle">
            Saves your workouts and photos into one file. Use it to move to a new phone or recover
            your data.
          </div>
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
          <Download size={18} /> {busy === 'export' ? 'Preparing…' : 'Export backup'}
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
        >
          <Upload size={18} /> {busy === 'import' ? 'Restoring…' : 'Restore backup'}
        </button>

        {message && (
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 12, marginBottom: 0 }}>
            {message}
          </p>
        )}
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: '#d1d5db', lineHeight: 1.8 }}>
        <div>2026</div>
        <div>Version: {__BUILD_TIME__}</div>
      </div>
    </div>
  );
}
