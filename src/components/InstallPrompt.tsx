import { useEffect, useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { useT } from '../i18n/context';
import { installPromptStrings } from '../i18n/strings/installPrompt';
import { isInstallPromptDismissed, setInstallPromptDismissed } from '../utils/uiFlags';

// The beforeinstallprompt event isn't in the default TS DOM types.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag when launched from the home screen.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Offers to install the app. On Android/desktop Chromium it uses the native
 * `beforeinstallprompt` flow; on iOS Safari (which never fires that event) it
 * shows manual "Share → Add to Home Screen" instructions. Hidden once installed
 * or after the user dismisses it.
 */
export default function InstallPrompt() {
  const t = useT(installPromptStrings);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isInstallPromptDismissed() || isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstallPromptDismissed();
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires beforeinstallprompt — show the manual path instead.
    if (isIos()) {
      setIosMode(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setInstallPromptDismissed();
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <>
      <div className="install-prompt" role="dialog">
        <span>{t('installTitle')}</span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={iosMode ? () => setShowIosHelp(true) : install}>
            <Download size={16} />
            {t('installButton')}
          </button>
          <button
            onClick={dismiss}
            aria-label={t('dismiss')}
            style={{ background: 'transparent', padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showIosHelp && (
        <div className="modal-overlay" onClick={() => setShowIosHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('iosTitle')}</h2>
              <button className="btn btn-ghost" onClick={() => setShowIosHelp(false)} aria-label={t('iosClose')}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--gray-600)', marginBottom: 16 }}>{t('iosIntro')}</p>

            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Share size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{t('iosStep1')}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Plus size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{t('iosStep2')}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Download size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{t('iosStep3')}</span>
              </li>
            </ol>

            <div className="modal-actions">
              <button className="btn btn-primary btn-block" onClick={() => setShowIosHelp(false)}>
                {t('iosClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
