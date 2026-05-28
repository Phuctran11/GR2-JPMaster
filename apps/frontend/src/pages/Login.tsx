import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Input, Button, PasswordInput, Breadcrumbs, Header, Footer } from '../components';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { formRules, getFieldError } from '../utils/formValidation';
import { AuthLayout } from '../components/AuthLayout';
import { SocialLogin } from '../components/SocialLogin';
import { MotionSectionFrame } from '../components/ui';

type LoginFormValues = {
  email: string;
  password: string;
};

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values);
      if (!response.token) {
        throw new Error('Login response did not include an authentication token');
      }
      login(response.data, response.token);
      addToast('Sign in successful!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Sign in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[400px] space-y-stack-md">
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="your@email.com"
        {...register('email', formRules.email<LoginFormValues>())}
        disabled={loading}
        error={getFieldError(errors.email)}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        {...register('password', formRules.password<LoginFormValues>())}
        disabled={loading}
        error={getFieldError(errors.password)}
      />

      <div className="flex justify-end">
        <a href="#" className="text-primary font-label-md text-label-md hover:underline transition-all">
          Forgot password?
        </a>
      </div>

      <Button type="submit" className="w-full uppercase tracking-widest" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <SocialLogin loading={loading} setLoading={setLoading} />

      {/* Sign Up Link */}
      <p className="text-center pt-stack-md font-body-md text-on-surface-variant">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="text-primary font-semibold hover:underline"
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}

export default function Login() {
  const { loading, isAuthenticated } = useAuth();
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Login' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="mx-auto my-20 text-center">
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <AuthLayout title="Welcome Back" subtitle="Continue your path to proficiency.">
        <MotionSectionFrame index={0} preset="sweep">
          <LoginForm />
        </MotionSectionFrame>
      </AuthLayout>
      <Footer />
    </div>
  );
}
