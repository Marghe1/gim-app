import { useNavigate, Link } from 'react-router-dom';
import { X, Smartphone, CloudOff, Lock, EyeOff, HardDrive, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../i18n/context';
import { privacyStrings } from '../i18n/strings/privacy';
import PageHero from '../components/PageHero';

const SECTIONS: { icon: LucideIcon; titleKey: string; bodyKey: string }[] = [
  { icon: Smartphone, titleKey: 's1Title', bodyKey: 's1Body' },
  { icon: CloudOff, titleKey: 's2Title', bodyKey: 's2Body' },
  { icon: Lock, titleKey: 's3Title', bodyKey: 's3Body' },
  { icon: EyeOff, titleKey: 's4Title', bodyKey: 's4Body' },
  { icon: HardDrive, titleKey: 's5Title', bodyKey: 's5Body' },
  { icon: FileText, titleKey: 's6Title', bodyKey: 's6Body' },
];

export default function Privacy() {
  const t = useT(privacyStrings);
  const navigate = useNavigate();

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
      <PageHero eyebrow={t('eyebrow')} title={t('title')} action={closeButton} />

      <main className="home-sheet">
        {SECTIONS.map(({ icon: Icon, titleKey, bodyKey }) => (
          <div className="card" key={titleKey} style={{ textAlign: 'left' }}>
            <div className="card-header" style={{ gap: 10, alignItems: 'center' }}>
              <Icon size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div className="card-title">{t(titleKey)}</div>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--gray-600)',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {t(bodyKey)}
            </p>
            {bodyKey === 's5Body' && (
              <Link
                to="/about"
                className="btn btn-secondary btn-block"
                style={{ marginTop: 12 }}
              >
                <HardDrive size={16} /> {t('backupCta')}
              </Link>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
