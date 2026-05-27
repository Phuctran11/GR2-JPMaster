import { useEffect } from 'react';

export function useQuizFocusGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
      window.alert('Please submit the quiz before leaving focus mode.');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', blockBack);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', blockBack);
    };
  }, [enabled]);
}
