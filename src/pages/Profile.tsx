import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, User, Camera, Trash2, Info } from 'lucide-react';
import { useT } from '../i18n/context';
import { profileStrings } from '../i18n/strings/profile';
import {
  getUserProfile,
  saveUserProfile,
  fileToAvatarDataUrl,
  computeAge,
} from '../utils/profileStorage';
import { getBodyProfile, saveBodyProfile, getMeasurements } from '../utils/bodyStorage';

export default function Profile() {
  const t = useT(profileStrings);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = getUserProfile();
  const body = getBodyProfile();
  const measurements = getMeasurements();
  const latestWeight = measurements[measurements.length - 1]?.weightKg ?? null;

  const [name, setName] = useState(profile.name ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '');
  const [avatar, setAvatar] = useState(profile.avatar ?? '');
  const [heightCm, setHeightCm] = useState<string>(body.heightCm != null ? String(body.heightCm) : '');
  const [saved, setSaved] = useState(false);

  const age = computeAge(birthDate);

  async function handlePhoto(file: File) {
    try {
      setAvatar(await fileToAvatarDataUrl(file));
    } catch {
      /* ignore — keep the previous photo */
    }
  }

  function save() {
    saveUserProfile({
      name: name.trim() || undefined,
      city: city.trim() || undefined,
      birthDate: birthDate || undefined,
      avatar: avatar || undefined,
    });
    const h = parseFloat(heightCm);
    saveBodyProfile({ ...body, heightCm: heightCm && !isNaN(h) ? h : undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const closeButton = (
    <button
      className="btn btn-ghost"
      onClick={() => navigate(-1)}
      aria-label={t('close')}
      style={{ color: 'white' }}
    >
      <X size={22} />
    </button>
  );

  return (
    <div className="home">
      {/* Reuse the mint hero but show the avatar in place of the stat chips. */}
      <header className="home-hero">
        <div className="home-hero-top">
          <div>
            <p className="home-eyebrow">{t('eyebrow')}</p>
            <h1 className="home-title">{t('title')}</h1>
          </div>
          {closeButton}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => fileRef.current?.click()}
            aria-label={avatar ? t('changePhoto') : t('addPhoto')}
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {avatar ? (
              <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} style={{ color: 'white' }} />
            )}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Camera size={15} /> {avatar ? t('changePhoto') : t('addPhoto')}
            </button>
            {avatar && (
              <button
                onClick={() => setAvatar('')}
                aria-label={t('removePhoto')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handlePhoto(f);
        }}
      />

      <main className="home-sheet">
        <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 16 }}>
          <Info size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          {t('optionalNote')}
        </p>

        {/* Details */}
        <div className="card" style={{ textAlign: 'left' }}>
          <div className="card-header">
            <div className="card-title">{t('detailsTitle')}</div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('name')}</label>
            <input
              className="form-input"
              value={name}
              placeholder={t('namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('city')}</label>
            <input
              className="form-input"
              value={city}
              placeholder={t('cityPlaceholder')}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('birthDate')}</label>
            <input
              type="date"
              className="form-input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            {age != null && (
              <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '6px 2px 0' }}>
                {t('ageLabel', { age })}
              </p>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('height')}</label>
            <input
              type="number"
              inputMode="numeric"
              className="form-input"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
        </div>

        {/* Current weight (read-only; lives in the Body section) */}
        <div className="card" style={{ textAlign: 'left' }}>
          <div className="card-header">
            <div className="card-title">{t('weightTitle')}</div>
          </div>
          {latestWeight != null ? (
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)' }}>
              {t('weightValue', { weight: latestWeight })}
            </div>
          ) : (
            <div className="card-subtitle">{t('noWeight')}</div>
          )}
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '8px 0 12px' }}>
            {t('weightFromBody')}
          </p>
          <Link to="/photos" className="btn btn-secondary btn-block">
            {t('updateWeight')}
          </Link>
        </div>

        <button className="btn btn-primary btn-block" onClick={save} style={{ marginTop: 8 }}>
          {saved ? t('saved') : t('save')}
        </button>

        <Link
          to="/about"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 8, marginBottom: 8 }}
        >
          {t('aboutLink')}
        </Link>
      </main>
    </div>
  );
}
