import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Camera, Plus, GitCompareArrows, Trash2, X, HardDrive } from 'lucide-react';
import type { ProgressPhoto, PhotoPose } from '../utils/photoStorage';
import {
  PHOTO_POSES,
  addPhoto,
  getAllPhotos,
  deletePhoto,
  formatBytes,
} from '../utils/photoStorage';

const POSE_LABEL: Record<PhotoPose, string> = {
  front: 'Front',
  side: 'Side',
  back: 'Back',
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [poseFilter, setPoseFilter] = useState<PhotoPose | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  // Build/refresh object URLs whenever the photo set changes, and revoke them
  // on cleanup so we don't leak memory.
  const refresh = useCallback(async () => {
    const all = await getAllPhotos();
    setPhotos(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const map: Record<string, string> = {};
    photos.forEach((p) => {
      map[p.id] = URL.createObjectURL(p.blob);
    });
    setUrls(map);
    return () => {
      Object.values(map).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  const totalBytes = useMemo(
    () => photos.reduce((s, p) => s + (p.blob?.size ?? 0), 0),
    [photos]
  );

  const filtered = useMemo(
    () => (poseFilter === 'all' ? photos : photos.filter((p) => p.pose === poseFilter)),
    [photos, poseFilter]
  );

  // Group filtered photos by date for the gallery.
  const groups = useMemo(() => {
    const byDate: Record<string, ProgressPhoto[]> = {};
    filtered.forEach((p) => {
      (byDate[p.date] ??= []).push(p);
    });
    return Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    await deletePhoto(id);
    setViewing(null);
    refresh();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Progress Photos</h1>
        <p className="page-subtitle">Track how you change over time</p>
      </div>

      {/* Storage meter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--gray-500)',
          marginBottom: 16,
        }}
      >
        <HardDrive size={15} />
        <span>
          Photos using <strong>{formatBytes(totalBytes)}</strong> on this device
          {photos.length > 0 && ` · ${photos.length} photo${photos.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add photo
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={() => setShowCompare(true)}
          disabled={photos.length < 2}
        >
          <GitCompareArrows size={18} /> Compare
        </button>
      </div>

      {/* Pose filter */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${poseFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPoseFilter('all')}
        >
          All
        </button>
        {PHOTO_POSES.map((p) => (
          <button
            key={p.key}
            className={`filter-tab ${poseFilter === p.key ? 'active' : ''}`}
            onClick={() => setPoseFilter(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-title">Loading…</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <Camera size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
          <div className="empty-state-title">No photos yet</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            Add your first photo to start tracking your progress.
          </p>
        </div>
      ) : (
        groups.map(([date, items]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--gray-600)',
                marginBottom: 8,
              }}
            >
              {formatDate(date)}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setViewing(p)}
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 4',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'var(--gray-100)',
                  }}
                >
                  {urls[p.id] && (
                    <img
                      src={urls[p.id]}
                      alt={POSE_LABEL[p.pose]}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'white',
                      background: 'rgba(0,0,0,0.55)',
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}
                  >
                    {POSE_LABEL[p.pose]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {showAdd && (
        <AddPhotoModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            refresh();
          }}
        />
      )}

      {showCompare && (
        <CompareModal photos={photos} urls={urls} onClose={() => setShowCompare(false)} />
      )}

      {viewing && (
        <ViewPhotoModal
          photo={viewing}
          url={urls[viewing.id]}
          onClose={() => setViewing(null)}
          onDelete={() => handleDelete(viewing.id)}
        />
      )}
    </div>
  );
}

/* ---------- Add photo ---------- */

function AddPhotoModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [pose, setPose] = useState<PhotoPose>('front');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    if (!file) return;
    setSaving(true);
    try {
      await addPhoto(file, { date, pose, note: note.trim() || undefined });
      onAdded();
    } catch (e) {
      alert('Sorry, the photo could not be saved.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add photo</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            onClick={() => inputRef.current?.click()}
            style={{
              width: '100%',
              maxHeight: 280,
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gray-100)',
              marginBottom: 16,
              cursor: 'pointer',
            }}
          />
        ) : (
          <button
            className="btn btn-secondary btn-block"
            onClick={() => inputRef.current?.click()}
            style={{ height: 120, marginBottom: 16 }}
          >
            <Camera size={22} /> Choose a photo
          </button>
        )}

        <div className="form-group">
          <label className="form-label">Pose</label>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            {PHOTO_POSES.map((p) => (
              <button
                key={p.key}
                className={`filter-tab ${pose === p.key ? 'active' : ''}`}
                onClick={() => setPose(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input
            type="text"
            className="form-input"
            value={note}
            placeholder="e.g. after 4 weeks"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!file || saving}>
            {saving ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- View single photo ---------- */

function ViewPhotoModal({
  photo,
  url,
  onClose,
  onDelete,
}: {
  photo: ProgressPhoto;
  url?: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {POSE_LABEL[photo.pose]} · {formatDate(photo.date)}
          </h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {url && (
          <img
            src={url}
            alt={POSE_LABEL[photo.pose]}
            style={{
              width: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gray-100)',
            }}
          />
        )}
        {photo.note && (
          <p style={{ color: 'var(--gray-600)', fontSize: 14, marginTop: 12 }}>{photo.note}</p>
        )}
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Compare (before/after slider) ---------- */

function CompareModal({
  photos,
  urls,
  onClose,
}: {
  photos: ProgressPhoto[];
  urls: Record<string, string>;
  onClose: () => void;
}) {
  // Default to a pose that has at least two photos.
  const poseWithEnough =
    PHOTO_POSES.find((p) => photos.filter((ph) => ph.pose === p.key).length >= 2)?.key ?? 'front';
  const [pose, setPose] = useState<PhotoPose>(poseWithEnough);

  // Photos of this pose, oldest first so "before"/"after" feels natural.
  const ofPose = useMemo(
    () => photos.filter((p) => p.pose === pose).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [photos, pose]
  );

  const [beforeId, setBeforeId] = useState('');
  const [afterId, setAfterId] = useState('');
  const [pos, setPos] = useState(50); // slider divider 0..100

  // Pick sensible defaults (oldest vs newest) whenever the pose changes.
  useEffect(() => {
    if (ofPose.length >= 2) {
      setBeforeId(ofPose[0].id);
      setAfterId(ofPose[ofPose.length - 1].id);
    } else {
      setBeforeId('');
      setAfterId('');
    }
  }, [ofPose]);

  const before = ofPose.find((p) => p.id === beforeId);
  const after = ofPose.find((p) => p.id === afterId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Compare</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Pose (same pose compares fairly)</label>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            {PHOTO_POSES.map((p) => {
              const count = photos.filter((ph) => ph.pose === p.key).length;
              return (
                <button
                  key={p.key}
                  className={`filter-tab ${pose === p.key ? 'active' : ''}`}
                  onClick={() => setPose(p.key)}
                  disabled={count < 2}
                  style={count < 2 ? { opacity: 0.4 } : undefined}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {ofPose.length < 2 ? (
          <div className="empty-state">
            <div className="empty-state-title">Need two {POSE_LABEL[pose]} photos</div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
              Add at least two photos of this pose to compare them.
            </p>
          </div>
        ) : (
          <>
            {/* Slider viewer: "after" fills the frame; "before" sits on top,
                clipped to the left of the divider — so left = Before, right = After,
                matching the labels and date pickers below. */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3 / 4',
                maxHeight: '50vh',
                margin: '0 auto 4px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--gray-100)',
                userSelect: 'none',
              }}
            >
              {after && urls[after.id] && (
                <img
                  src={urls[after.id]}
                  alt="After"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
              {before && urls[before.id] && (
                <img
                  src={urls[before.id]}
                  alt="Before"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    clipPath: `inset(0 ${100 - pos}% 0 0)`,
                  }}
                />
              )}
              {/* Divider line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${pos}%`,
                  width: 2,
                  background: 'white',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  transform: 'translateX(-1px)',
                  pointerEvents: 'none',
                }}
              />
              {/* Labels */}
              <span style={cmpLabel('left')}>Before</span>
              <span style={cmpLabel('right')}>After</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              style={{ width: '100%', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Before</label>
                <select
                  className="form-select"
                  value={beforeId}
                  onChange={(e) => setBeforeId(e.target.value)}
                >
                  {ofPose.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.date)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">After</label>
                <select
                  className="form-select"
                  value={afterId}
                  onChange={(e) => setAfterId(e.target.value)}
                >
                  {ofPose.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.date)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function cmpLabel(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: 6,
    [side]: 6,
    fontSize: 11,
    fontWeight: 600,
    color: 'white',
    background: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    padding: '2px 6px',
  };
}
