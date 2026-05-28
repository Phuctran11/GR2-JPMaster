import { useCallback, useEffect, useRef, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
  }
}

interface SocialLoginProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function SocialLogin({ loading, setLoading }: SocialLoginProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  const handleCredentialResponse = useCallback(async (response: any) => {
    if (!response.credential) {
      addToast('No credential received from Google', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    const slowLoginTimer = window.setTimeout(() => {
      addToast('Google sign-in is taking longer than usual. The backend may be waking up, please wait.', 'info');
    }, 12000);

    try {
      const res = await authAPI.googleLogin({ token: response.credential });
      if (!res.token) {
        throw new Error('Google login response did not include an authentication token');
      }

      login(res.data, res.token);
      addToast('Google login successful!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Google login failed', 'error');
      console.error('Google login error:', err);
    } finally {
      window.clearTimeout(slowLoginTimer);
      setLoading(false);
    }
  }, [addToast, login, navigate, setLoading]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      addToast('Google Client ID not configured. Check VITE_GOOGLE_CLIENT_ID in frontend .env', 'error');
      console.error('Missing VITE_GOOGLE_CLIENT_ID in frontend .env');
      return;
    }

    const initializeGoogleButton = () => {
      if (!googleButtonRef.current || !window.google?.accounts?.id) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          error_callback: () => {
            addToast('Google Sign-In error. Check console and Google Cloud Console origin settings', 'error');
            console.error('Google initialization callback error');
            setLoading(false);
          },
        });

        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'en',
          width: 360,
        });
        setGoogleReady(true);
        return true;
      } catch (initError) {
        const message = initError instanceof Error ? initError.message : 'Unknown error';
        console.error('Google initialization error:', initError);

        if (message.includes('origin')) {
          addToast('IMPORTANT: Origin not allowed!\n\n1. Go to Google Cloud Console\n2. Find YOUR CORRECT OAuth Client ID (check the Client ID value)\n3. Edit it\n4. Make SURE you add http://localhost:5173 to "Authorized JavaScript origins"\n5. Wait 60 seconds\n6. Refresh this page', 'error');
        } else {
          addToast(message, 'error');
        }
        setLoading(false);
        return true;
      }
    };

    if (initializeGoogleButton()) return;

    const checkGoogleLoaded = window.setInterval(() => {
      if (initializeGoogleButton()) {
        window.clearInterval(checkGoogleLoaded);
      }
    }, 100);

    const timeout = window.setTimeout(() => {
      window.clearInterval(checkGoogleLoaded);
      if (!window.google?.accounts?.id) {
        addToast('Google Sign-In library not loaded. Please check network or index.html script', 'error');
        console.error('window.google.accounts.id is undefined. Google script may not have loaded.');
      }
    }, 5000);

    return () => {
      window.clearInterval(checkGoogleLoaded);
      window.clearTimeout(timeout);
      googleButtonRef.current?.replaceChildren();
      setGoogleReady(false);
    };
  }, [addToast, handleCredentialResponse, setLoading]);

  const handleGoogleLogin = () => {
    if (!googleReady) {
      addToast('Google Sign-In is still loading. Please try again in a moment.', 'error');
    }
  };

  return (
    <>
      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-4 text-on-surface-variant font-label-md text-label-md">OR</span>
        </div>
      </div>

      {/* Social Login Button */}
      <div className="grid grid-cols-1 gap-gutter">
        <div className={loading ? 'pointer-events-none opacity-50' : ''}>
          <div ref={googleButtonRef} className="min-h-[44px]" />
          {!googleReady && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaGoogle className="w-5 h-5" />
              <span className="font-label-md text-label-md text-on-surface">Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
