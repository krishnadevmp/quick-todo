import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  );
  // Persisted dismissal — shared with InstallBanner via isDismissed return value.
  // Legacy stored value "1" parses to number 1, which is truthy — backward-compat. ✓
  const [isDismissed, setIsDismissed] = useLocalStorage('pwa-install-dismissed', false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const mq = window.matchMedia('(display-mode: standalone)');
    const onMq = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', onMq);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
    setPromptEvent(null);
  };

  /** Persists dismissal and clears any pending native prompt. */
  const dismiss = () => {
    setIsDismissed(true);
    setPromptEvent(null);
  };

  return {
    /** True when the browser is ready to show an install prompt. */
    canInstall: !!promptEvent && !isInstalled && !isDismissed,
    install,
    dismiss,
    isInstalled,
    /** Exposed so consumers (e.g. iOS banner) can read dismissal state reactively. */
    isDismissed: !!isDismissed,
  };
}
