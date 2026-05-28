import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, GlassCard, Icon, PasswordInput, Breadcrumbs, Header, Footer } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { MotionSectionFrame } from '../components/ui';
import { authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { formRules, getFieldError, sameAs } from '../utils/formValidation';
import signupBackground from '../assets/bg3.png';

type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function SignupForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      await authAPI.signup({
        username: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      addToast('Account created successfully. Please log in.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Sign up failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-stack-md w-full">
      <Input
        id="name"
        label="Full Name"
        type="text"
        placeholder="John Doe"
        {...register('name', formRules.required<SignupFormValues>('Full name'))}
        disabled={loading}
        error={getFieldError(errors.name)}
      />

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="student@example.com"
        {...register('email', formRules.email<SignupFormValues>())}
        disabled={loading}
        error={getFieldError(errors.email)}
      />

      {/* Password Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <PasswordInput
          id="password"
          label="Password"
          {...register('password', formRules.password<SignupFormValues>())}
          disabled={loading}
          error={getFieldError(errors.password)}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          {...register('confirmPassword', {
            validate: sameAs(watch('password'), 'Password'),
          })}
          disabled={loading}
          error={getFieldError(errors.confirmPassword)}
        />
      </div>

      <Button type="submit" className="w-full mt-stack-lg flex items-center justify-center gap-2 group" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
        <Icon name="arrow_right_alt" size="md" />
      </Button>

      <div className="pt-stack-md text-center">
        <Text variant="body-md" color="on-surface-variant">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary font-semibold hover:underline underline-offset-4"
          >
            Login
          </button>
        </Text>
      </div>
    </form>
  );
}

function SignupBentoCards() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-8">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-secondary-fixed rounded-lg">
          <Icon name="verified_user" />
        </div>
        <div>
          <span className="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider">
            Accredited
          </span>
          <span className="block font-body-md text-on-surface font-semibold">Global Standards</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-tertiary-fixed rounded-lg">
          <Icon name="import_contacts" />
        </div>
        <div>
          <span className="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider">
            Resource
          </span>
          <span className="block font-body-md text-on-surface font-semibold">2,000+ Kanji</span>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Sign Up' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main
        className="relative flex-grow py-24 pb-section-gap flex items-center justify-center overflow-hidden bg-background"
        style={{
          backgroundImage: `url(${signupBackground})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] dark:bg-background/82" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        {/* Registration Container */}
        <div className="w-full flex justify-center relative z-10">
          <GlassCard className="w-full mx-margin-mobile md:mx-margin-desktop max-w-[520px] p-stack-lg md:p-12 rounded-xl shadow-lg">
            <MotionSectionFrame index={0} preset="hero">
              <div className="mb-stack-lg">
                <Heading level="h1" size="headline-lg" className="mb-2">
                  Master the Art of Japanese
                </Heading>
                <Text variant="body-md" color="on-surface-variant">
                  Begin your scholarly journey with elite curriculum and focused study tools.
                </Text>
              </div>
            </MotionSectionFrame>

            <MotionSectionFrame index={1} preset="sweep">
              <SignupForm />
            </MotionSectionFrame>
            <MotionSectionFrame index={2} preset="pop">
              <SignupBentoCards />
            </MotionSectionFrame>
          </GlassCard>
        </div>
      </main>
      <Footer />
    </div>
  );
}
