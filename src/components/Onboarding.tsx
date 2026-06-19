import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Repeat, TrendingUp, Camera, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../i18n/context';
import { onboardingStrings } from '../i18n/strings/onboarding';
import { getUserProfile, saveUserProfile } from '../utils/profileStorage';

const SLIDES: { icon: LucideIcon; titleKey: string; bodyKey: string }[] = [
  { icon: Dumbbell, titleKey: 'slide1Title', bodyKey: 'slide1Body' },
  { icon: Repeat, titleKey: 'slide2Title', bodyKey: 'slide2Body' },
  { icon: TrendingUp, titleKey: 'slide3Title', bodyKey: 'slide3Body' },
  { icon: Camera, titleKey: 'slide4Title', bodyKey: 'slide4Body' },
];

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

/** First-run welcome overlay: a few intro slides shown over the app. */
export default function Onboarding({ open, onClose }: OnboardingProps) {
  const t = useT(onboardingStrings);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(() => getUserProfile().name ?? '');

  if (!open) return null;

  // The final step (after the intro slides) asks for the user's name.
  const nameStep = SLIDES.length;
  const isNameStep = step === nameStep;
  const isLast = isNameStep;
  const slide = isNameStep ? null : SLIDES[step];
  const Icon = slide?.icon ?? User;

  function finish() {
    const trimmed = name.trim();
    if (trimmed) saveUserProfile({ ...getUserProfile(), name: trimmed });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        zIndex: 400,
        background: 'var(--hero-gradient)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            opacity: 0.85,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 8,
          }}
        >
          {t('skip')}
        </button>
      </div>

      {/* Slide content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 20,
          maxWidth: 360,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={44} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
          {isNameStep ? t('nameStepTitle') : t(slide!.titleKey)}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.95 }}>
          {isNameStep ? t('nameStepBody') : t(slide!.bodyKey)}
        </p>
        {isNameStep && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              fontSize: 16,
              fontFamily: 'var(--font-body)',
              color: 'var(--gray-900)',
              textAlign: 'center',
            }}
          />
        )}
        {step === SLIDES.length - 1 && (
          <Link
            to="/privacy"
            onClick={onClose}
            style={{ color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}
          >
            {t('slide4PrivacyLink')}
          </Link>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {Array.from({ length: SLIDES.length + 1 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: i === step ? 22 : 8,
              height: 8,
              borderRadius: 999,
              background: i === step ? 'white' : 'rgba(255,255,255,0.4)',
              transition: 'width 0.2s',
            }}
          />
        ))}
      </div>

      {/* Next / Get started */}
      <button
        className="btn btn-block"
        onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        style={{ background: 'white', color: 'var(--primary-dark)' }}
      >
        {isLast ? t('getStarted') : t('next')}
      </button>
    </div>
  );
}
