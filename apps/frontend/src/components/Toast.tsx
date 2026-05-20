import { useToast } from '../contexts/ToastContext';
import { Icon } from './ui';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: 'check_circle',
          iconColor: 'text-white',
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: 'error',
          iconColor: 'text-white',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          icon: 'warning',
          iconColor: 'text-white',
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          icon: 'info',
          iconColor: 'text-white',
        };
    }
  };

  return (
    <div
      className="fixed top-24 left-1/2 z-[120] w-full max-w-md -translate-x-1/2 space-y-3 px-4 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type as any);
        return (
          <div
            key={toast.id}
            className={`${styles.bg} pointer-events-auto rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm transform transition-all duration-300 animate-in slide-in-from-top-2 fade-in`}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={styles.iconColor}>
                <Icon name={styles.icon} size="md" />
              </div>
              <p className="flex-1 text-white font-medium text-sm md:text-base">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="h-1 bg-white/30 animate-pulse"></div>
          </div>
        );
      })}
    </div>
  );
}

