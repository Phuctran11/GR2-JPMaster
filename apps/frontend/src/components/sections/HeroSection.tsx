import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../Button';
import { Badge, Stat, Container, AvatarGroup } from '../ui';
import { Heading, Text } from '../ui/Typography';

function HeroContent() {
  const navigate = useNavigate();
  return (
    <div className="relative z-10 space-y-stack-lg animate-fade-in-up">
      <Badge variant="primary">Academic Excellence</Badge>
      <Heading level="h1" size="display-lg">
        Master Japanese with <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Academic Precision.
        </span>
      </Heading>
      <Text variant="body-lg" color="on-surface-variant" className="max-w-lg leading-relaxed">
        Elevate your language proficiency through a structured, university-grade curriculum designed by expert linguists for serious learners.
      </Text>
      <div className="flex flex-wrap gap-stack-md pt-4">
        <PrimaryButton onClick={() => navigate('/explore')}>Explore Now</PrimaryButton>
      </div>
      <div className="flex items-center gap-8 pt-8">
        <Stat value="10k+" label="Scholars" />
        <div className="w-px h-10 bg-outline-variant"></div>
        <Stat value="98%" label="Success Rate" />
        <div className="w-px h-10 bg-outline-variant"></div>
        <AvatarGroup
          avatars={[
            { initials: 'JP', color: '#FFB703' },
            { initials: 'AM', color: '#8ECAE6' },
            { initials: 'KT', color: '#FB5607' }
          ]}
          maxShow={3}
          size="sm"
        />
      </div>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="relative lg:h-[650px] hidden lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-secondary-fixed opacity-20 rounded-[4rem] rotate-3 -z-10"></div>
      <div className="relative h-full w-full rounded-[3.5rem] overflow-hidden shadow-2xl shadow-primary/10 border-8 border-white group">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-0"></div>
        <img
          alt="Academic learning"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB70-ARwssAJU4XiPyDYISFLYUQWA95w3zdJcIoaLPlki0ZL_rvmDvMpOcTLoRHwbX40Oj-ugBSTK-_P0d9wdfz_q4arFf7rMH7vqfNkuY-q8pPabLzQMkn712ySLy106ozoO76LZOIZx-gcS4OWIVAUUUYnEbi55SY-y5YS1zrJ8rfX3eObLAJlxlVFZopRECMgoZ7byl3YNg1mGaQKjNI0JDPcBspokYNwxHftV7lQkGWllH1edrXxNG7TCxxvlozZR5uXrVB70l1"
        />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full h-full border-4 border-primary/10 rounded-[2.5rem] flex items-center justify-center relative">
            <img
              alt="Students learning"
              className="w-[85%] h-[85%] object-cover rounded-[2rem] shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZPFv7jLbMYWY4cToJTczLXvugyYJbNsX2opFGflbf9NykeMM4nhPmm-MyxLwR9ehDinO32D7qdGxTM-sUtDrLqCvn-MdHsli2z-vb21HrqpLnUI6aXm7v94Smvy5HsicmIjuv2YDxViGJnLlMamurZrtHodySRkONVQXPSUg5_GJ9CfVBrQiQqa-8peGgWvM5U5BbcQRdG8GLkN6f5fUUu0q4HY7XuZkcLqtZrsEFsqwbZrhxrMOfeRCBlyVQ7jX8xYed1iICSOJT"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card px-8 py-4 rounded-2xl border-2 border-primary/5 shadow-xl min-w-[280px]">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-2 rounded-lg text-white">
                  <span className="material-symbols-outlined text-lg">school</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-tighter">
                    Live Study Session
                  </div>
                  <div className="text-[10px] text-on-surface-variant">42 scholars active now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-[85vh] flex items-center pt-10 pb-20"
      style={{
        backgroundImage:
          'radial-gradient(circle at 2px 2px, rgba(0, 35, 111, 0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="blob top-[-10%] right-[-5%]"></div>
      <div className="blob bottom-[-10%] left-[-5%] rotate-180"></div>
      <Container className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <HeroContent />
        <HeroImage />
      </Container>
    </section>
  );
}
