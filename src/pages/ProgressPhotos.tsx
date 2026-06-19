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
import PageHero from '../components/PageHero';
import { useT, useLang } from '../i18n/context';
import { progressPhotosStrings } from '../i18n/strings/progressPhotos';
import { localeFor } from '../i18n/data';
import type { Lang } from '../i18n/context';

// Translation-table key for each pose, used to look up the localized label.
const POSE_KEY: Record<PhotoPose, string> = {
  front: 'poseFront',
  side: 'poseSide',
  back: 'poseBack',
};

// Translate a pose to its localized label using the page's `t` function.
function poseLabel(t: (key: string) => string, pose: PhotoPose): string {
  return t(POSE_KEY[pose]);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgressPhotos() {
  const t = useT(progressPhotosStrings);
  const { lang } = useLang();
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
    if (!confirm(t('deleteConfirm'))) return;
    await deletePhoto(id);
    setViewing(null);
    refresh();
  }

  return (
    <div className="home">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        stats={[
          { value: photos.length, label: photos.length === 1 ? t('photoSingular') : t('photoPlural') },
          {
            value: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={20} />
                {formatBytes(totalBytes)}
              </span>
            ),
            label: t('usedOnThisDevice'),
          },
        ]}
      />

      <main className="home-sheet">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowAdd(true)}>
          <Plus size={18} /> {t('addPhoto')}
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={() => setShowCompare(true)}
          disabled={photos.length < 2}
        >
          <GitCompareArrows size={18} /> {t('compare')}
        </button>
      </div>

      {/* Pose filter */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${poseFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPoseFilter('all')}
        >
          {t('poseAll')}
        </button>
        {PHOTO_POSES.map((p) => (
          <button
            key={p.key}
            className={`filter-tab ${poseFilter === p.key ? 'active' : ''}`}
            onClick={() => setPoseFilter(p.key)}
          >
            {poseLabel(t, p.key)}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-title">{t('loading')}</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <Camera size={40} style={{ color: 'var(--gray-300)', marginBottom: 12 }} />
          <div className="empty-state-title">{t('emptyTitle')}</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
            {t('emptyBody')}
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
              {formatDate(date, lang)}
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
                      alt={poseLabel(t, p.pose)}
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
                    {poseLabel(t, p.pose)}
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
          t={t}
        />
      )}

      {showCompare && (
        <CompareModal
          photos={photos}
          urls={urls}
          onClose={() => setShowCompare(false)}
          t={t}
          lang={lang}
        />
      )}

      {viewing && (
        <ViewPhotoModal
          photo={viewing}
          url={urls[viewing.id]}
          onClose={() => setViewing(null)}
          onDelete={() => handleDelete(viewing.id)}
          t={t}
          lang={lang}
        />
      )}
      </main>
    </div>
  );
}

/* ---------- Add photo ---------- */

function AddPhotoModal({
  onClose,
  onAdded,
  t,
}: {
  onClose: () => void;
  onAdded: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
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
      alert(t('saveError'));
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('addPhoto')}</h2>
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
            alt={t('previewAlt')}
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
            <Camera size={22} /> {t('choosePhoto')}
          </button>
        )}

        <div className="form-group">
          <label className="form-label">{t('poseLabel')}</label>
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
            {PHOTO_POSES.map((p) => (
              <button
                key={p.key}
                className={`filter-tab ${pose === p.key ? 'active' : ''}`}
                onClick={() => setPose(p.key)}
              >
                {poseLabel(t, p.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('dateLabel')}</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('noteLabel')}</label>
          <input
            type="text"
            className="form-input"
            value={note}
            placeholder={t('notePlaceholder')}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!file || saving}>
            {saving ? t('saving') : t('save')}
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
  t,
  lang,
}: {
  photo: ProgressPhoto;
  url?: string;
  onClose: () => void;
  onDelete: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {poseLabel(t, photo.pose)} · {formatDate(photo.date, lang)}
          </h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {url && (
          <img
            src={url}
            alt={poseLabel(t, photo.pose)}
            style={{
              width: '100%',
              maxHeight: '50dvh',
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
            <Trash2 size={16} /> {t('delete')}
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
  t,
  lang,
}: {
  photos: ProgressPhoto[];
  urls: Record<string, string>;
  onClose: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
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
          <h2 className="modal-title">{t('compare')}</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">{t('comparePoseLabel')}</label>
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
                  {poseLabel(t, p.key)}
                </button>
              );
            })}
          </div>
        </div>

        {ofPose.length < 2 ? (
          <div className="empty-state">
            <div className="empty-state-title">{t('needTwoPhotos', { pose: poseLabel(t, pose) })}</div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
              {t('needTwoPhotosBody')}
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
                  alt={t('after')}
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
                  alt={t('before')}
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
              <span style={cmpLabel('left')}>{t('before')}</span>
              <span style={cmpLabel('right')}>{t('after')}</span>
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
                <label className="form-label">{t('before')}</label>
                <select
                  className="form-select"
                  value={beforeId}
                  onChange={(e) => setBeforeId(e.target.value)}
                >
                  {ofPose.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.date, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">{t('after')}</label>
                <select
                  className="form-select"
                  value={afterId}
                  onChange={(e) => setAfterId(e.target.value)}
                >
                  {ofPose.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.date, lang)}
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
