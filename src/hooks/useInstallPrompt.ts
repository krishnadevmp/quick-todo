import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );
  const [isDismissed] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === '1'
  );

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

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setPromptEvent(null);
  };

  return {
    canInstall: !!promptEvent && !isInstalled && !isDismissed,
    install,
    dismiss,
    isInstalled,
  };
}
