import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useT } from '../i18n/context';
import { shareStrings } from '../i18n/strings/share';
import { shareApp, APP_URL } from '../utils/appLinks';

interface ShareButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function ShareButton({ variant = 'secondary' }: ShareButtonProps) {
  const t = useT(shareStrings);
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  async function handleShare() {
    const result = await shareApp({ title: t('shareTitle'), message: t('shareMessage') });
    if (result === 'copied') {
      setCopied(true);
      setShowLink(false);
      setTimeout(() => setCopied(false), 2000);
    } else if (result === 'failed') {
      // Neither native share nor clipboard worked — show the link to copy by hand.
      setShowLink(true);
    }
  }

  return (
    <>
      <button className={`btn btn-${variant} btn-block`} onClick={handleShare}>
        <Share2 size={18} /> {t('share')}
      </button>

      {copied && (
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 10, marginBottom: 0 }}>
          {t('copied')}
        </p>
      )}

      {showLink && (
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 10, marginBottom: 0 }}>
          {t('copyManually')}
          <br />
          <span style={{ userSelect: 'all', wordBreak: 'break-all', color: 'var(--primary-dark)' }}>
            {APP_URL}
          </span>
        </p>
      )}
    </>
  );
}
