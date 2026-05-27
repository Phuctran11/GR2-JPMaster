import { Button } from '../index';
import type { PaymentTransaction } from '../../services/api';
import { formatVnd } from './courseDetailUtils';

export function CoursePaymentModal({
  courseTitle,
  transaction,
  checkingPayment,
  embeddedError,
  onRefreshStatus,
  onClose,
}: {
  courseTitle: string;
  transaction: PaymentTransaction;
  checkingPayment: boolean;
  embeddedError: string | null;
  onRefreshStatus: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 sm:p-4">
      <div className="max-h-[calc(100vh-1rem)] w-full max-w-6xl overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant bg-surface shadow-2xl sm:max-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-label-md font-black uppercase tracking-wide text-primary">payOS Payment</p>
            <h2 className="mt-1 truncate text-title-lg font-bold text-on-surface sm:text-headline-sm">{courseTitle}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
              Scan the QR code with your banking app or open the payOS checkout link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            aria-label="Close payment dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(430px,640px)_minmax(300px,360px)] lg:justify-center sm:p-5">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
            <div
              id="payos-checkout-container"
              className="h-[520px] min-h-[420px] w-full overflow-hidden sm:h-[560px] lg:h-[600px] [&_iframe]:h-full [&_iframe]:min-h-[420px] [&_iframe]:w-full sm:[&_iframe]:min-h-[560px] lg:[&_iframe]:min-h-[600px]"
            />
            {embeddedError && (
              <div className="rounded-xl border border-warning/40 bg-warning-container p-4 text-on-warning-container">
                <p className="font-bold">Embedded checkout unavailable</p>
                <p className="mt-1 text-body-md">{embeddedError}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="text-label-md text-on-surface-variant">Amount</p>
                <p className="mt-1 text-title-lg font-bold text-primary">{formatVnd(transaction.amount)}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="text-label-md text-on-surface-variant">Status</p>
                <p className="mt-1 text-title-sm font-bold uppercase text-primary">{transaction.status}</p>
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <p className="text-label-md text-on-surface-variant">Transfer content</p>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <code className="min-w-0 break-all rounded-md bg-surface px-3 py-2 text-label-lg font-bold text-on-surface">
                  {transaction.payment_content}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(transaction.payment_content)}
                  className="inline-flex h-10 items-center gap-1 rounded-md border border-outline-variant bg-surface px-3 text-label-md font-bold text-primary hover:border-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-success/40 bg-success-container p-3 text-on-success-container">
              <p className="text-title-sm font-bold">Automatic activation</p>
              <p className="mt-1 text-body-sm">
                Course access is activated automatically after payOS sends a verified payment webhook to the system.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Button type="button" size="sm" className="min-h-10 rounded-md px-3 text-label-md" onClick={onRefreshStatus} disabled={checkingPayment}>
                {checkingPayment ? 'Checking...' : 'Check payment status'}
              </Button>
              {transaction.checkout_url && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="min-h-10 rounded-md px-3 text-label-md"
                  onClick={() => window.open(transaction.checkout_url || undefined, '_blank', 'noopener,noreferrer')}
                >
                  Open checkout
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" className="min-h-10 rounded-md px-3 text-label-md" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
