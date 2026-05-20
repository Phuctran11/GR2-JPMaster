import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, PasswordInput, Breadcrumbs, Header, Footer } from '../components';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { AuthLayout } from '../components/AuthLayout';
import { SocialLogin } from '../components/SocialLogin';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const { formData, errors, handleChange, validate } = useForm({
    initialValues: { email: '', password: '' },
    onValidate: (values) => ({
      email: validators.email(values.email),
      password: validators.password(values.password),
    }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(formData as any);
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
    <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-stack-md">
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={formData.email}
        onChange={handleChange}
        disabled={loading}
        error={errors.email}
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        disabled={loading}
        error={errors.password}
      />

      <div className="flex justify-end">
        <a href="#" className="text-primary font-label-md text-label-md hover:underline transition-all">
          Forgot password?
        </a>
      </div>

      <Button onClick={handleSubmit} className="w-full uppercase tracking-widest" disabled={loading}>
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
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Login' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <AuthLayout title="Welcome Back" subtitle="Continue your path to proficiency.">
        <LoginForm />
      </AuthLayout>
      <Footer />
    </div>
  );
}
