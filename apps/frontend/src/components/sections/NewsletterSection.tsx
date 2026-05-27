import { useForm } from 'react-hook-form';
import { Button } from '../Button';
import { Section } from '../ui';
import { Heading, Text } from '../ui/Typography';
import { formRules, getFieldError } from '../../utils/formValidation';

type NewsletterFormValues = {
  email: string;
};

export function NewsletterSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<NewsletterFormValues>({
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const onSubmit = () => {
    reset();
  };

  return (
    <Section bgColor="light" className="px-margin-desktop">
      <div className="max-w-[1280px] mx-auto relative group">
        <div className="absolute inset-0 bg-primary rounded-[3rem] rotate-1 group-hover:rotate-0 transition-transform duration-500 -z-10"></div>
        <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-on-primary relative overflow-hidden shadow-2xl">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="grid grid-cols-8 h-full w-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-r border-white/20"></div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-stack-lg">
            <Heading level="h2" size="headline-lg" className="text-white text-5xl tracking-tight">
              Stay Ahead of the Curve
            </Heading>
            <Text variant="body-lg" color="white" className="opacity-80 leading-relaxed">
              Get academic resources, flashcards, and exclusive course discounts delivered to your inbox weekly. Join over 50,000 active scholars.
            </Text>

            {/* Newsletter Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-12 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
              <div className="flex-1">
                <input
                  className="w-full px-6 py-4 rounded-xl bg-transparent text-white border-none focus:ring-0 placeholder:text-white/50 outline-none"
                  placeholder="Your academic email"
                  type="email"
                  {...register('email', formRules.email<NewsletterFormValues>())}
                />
                {errors.email && <p className="px-4 pb-2 text-left text-label-sm font-semibold text-white">{getFieldError(errors.email)}</p>}
                {isSubmitSuccessful && !errors.email && <p className="px-4 pb-2 text-left text-label-sm font-semibold text-white">Thanks for signing up.</p>}
              </div>
              <Button type="submit">Sign Up</Button>
            </form>

            <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-bold">
              Trusted by global language enthusiasts
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
