import { Header, Footer } from '../components';
import { HeroSection, WhyChooseUsSection } from '../components/sections';
import { Suspense, lazy } from 'react';
import { LazySection } from '../components/ui/LazySection';
import { MotionFrame } from '../components/ui';
import { NewsletterSkeleton, SectionSkeleton } from '../components/ui/Skeleton';

const FeaturedCoursesSection = lazy(() => import('../components/sections').then(m => ({ default: m.FeaturedCoursesSection })));
const TestimonialsSection = lazy(() => import('../components/sections').then(m => ({ default: m.TestimonialsSection })));
const NewsletterSection = lazy(() => import('../components/sections').then(m => ({ default: m.NewsletterSection })));

export default function Homepage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <MotionFrame preset="hero" direction="down-right" duration={0.85} viewportAmount={0.08}>
          <HeroSection />
        </MotionFrame>

        <MotionFrame preset="sweep" direction="up-left" delay={0.04} duration={0.78}>
          <WhyChooseUsSection />
        </MotionFrame>

        <LazySection fallback={<SectionSkeleton className="mb-12" />} className="mb-12">
          <Suspense fallback={<SectionSkeleton className="mb-12" />}>
            <MotionFrame preset="lift" direction="up-right" duration={0.72}>
              <FeaturedCoursesSection />
            </MotionFrame>
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionSkeleton className="mb-12" />} className="mb-12">
          <Suspense fallback={<SectionSkeleton className="mb-12" />}>
            <MotionFrame preset="pop" direction="down-left" duration={0.68}>
              <TestimonialsSection />
            </MotionFrame>
          </Suspense>
        </LazySection>

        <LazySection fallback={<NewsletterSkeleton className="mb-12" />} className="mb-12">
          <Suspense fallback={<NewsletterSkeleton className="mb-12" />}>
            <MotionFrame preset="lift" direction="up" duration={0.75}>
              <NewsletterSection />
            </MotionFrame>
          </Suspense>
        </LazySection>
      </main>
      <Footer />
    </div>
  );
}
