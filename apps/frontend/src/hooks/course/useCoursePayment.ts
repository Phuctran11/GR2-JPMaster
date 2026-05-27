import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { paymentAPI, type PaymentTransaction } from '../../services/api';

declare global {
  interface Window {
    PayOSCheckout?: {
      usePayOS: (config: {
        RETURN_URL: string;
        ELEMENT_ID: string;
        CHECKOUT_URL: string;
        embedded: boolean;
        onSuccess?: (event: unknown) => void;
        onCancel?: (event: unknown) => void;
        onExit?: (event: unknown) => void;
      }) => {
        open: () => void;
        exit: () => void;
      };
    };
  }
}

export function useCoursePayment({
  navigate,
  showToast,
  onPaymentCompleted,
}: {
  navigate: NavigateFunction;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onPaymentCompleted: () => void;
}) {
  const [paymentTransaction, setPaymentTransaction] = useState<PaymentTransaction | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [payOsEmbeddedError, setPayOsEmbeddedError] = useState<string | null>(null);
  const paymentTransactionId = paymentTransaction?.payment_transaction_id;

  const refreshPaymentStatus = useCallback(async () => {
    if (!paymentTransactionId) return;

    try {
      setCheckingPayment(true);
      const result = await paymentAPI.getPaymentStatus(paymentTransactionId);
      setPaymentTransaction(result.data);
      if (result.data.status === 'paid' || result.data.purchase_status === 'completed') {
        showToast('Payment confirmed. Course access is active.', 'success');
        setPaymentModalOpen(false);
        onPaymentCompleted();
        navigate('/courses');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to check payment status', 'error');
    } finally {
      setCheckingPayment(false);
    }
  }, [navigate, onPaymentCompleted, paymentTransactionId, showToast]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentTransaction || paymentTransaction.status !== 'pending') return;

    const intervalId = window.setInterval(() => {
      refreshPaymentStatus();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [paymentModalOpen, paymentTransaction?.status, paymentTransactionId, refreshPaymentStatus]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentTransaction?.checkout_url) return;

    let cancelled = false;
    const containerId = 'payos-checkout-container';

    const loadPayOsScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.PayOSCheckout) {
          resolve();
          return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', () => reject(new Error('Failed to load payOS checkout')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load payOS checkout'));
        document.body.appendChild(script);
      });

    const mountPayOs = async () => {
      try {
        setPayOsEmbeddedError(null);
        await loadPayOsScript();
        if (cancelled || !window.PayOSCheckout) return;

        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';

        const checkout = window.PayOSCheckout.usePayOS({
          RETURN_URL: window.location.href,
          ELEMENT_ID: containerId,
          CHECKOUT_URL: paymentTransaction.checkout_url || '',
          embedded: true,
          onSuccess: () => {
            refreshPaymentStatus();
          },
          onCancel: () => {
            refreshPaymentStatus();
          },
          onExit: () => {
            refreshPaymentStatus();
          },
        });
        checkout.open();
      } catch (error) {
        if (!cancelled) setPayOsEmbeddedError(error instanceof Error ? error.message : 'Failed to load payOS checkout');
      }
    };

    mountPayOs();

    return () => {
      cancelled = true;
    };
  }, [paymentModalOpen, paymentTransaction?.checkout_url, refreshPaymentStatus]);

  return {
    paymentTransaction,
    setPaymentTransaction,
    paymentModalOpen,
    setPaymentModalOpen,
    checkingPayment,
    payOsEmbeddedError,
    refreshPaymentStatus,
  };
}
