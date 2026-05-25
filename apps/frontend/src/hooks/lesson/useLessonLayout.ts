import { useCallback, useEffect, useRef, useState } from 'react';

export function useLessonLayout({
  loading,
  lessonId,
  courseName,
}: {
  loading: boolean;
  lessonId?: string;
  courseName: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [sidebarTopPx, setSidebarTopPx] = useState<number>(73);
  const sectionRef = useRef<HTMLElement | null>(null);
  const lessonContentRef = useRef<HTMLElement | null>(null);
  const lessonMainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureLessonLayout = () => {
      const headerEl = document.querySelector('[data-app-header]');
      const breadcrumbEl = document.querySelector('nav[aria-label="Breadcrumb"]');
      const headerH = headerEl instanceof HTMLElement ? headerEl.offsetHeight : 0;
      const breadcrumbH = breadcrumbEl instanceof HTMLElement ? breadcrumbEl.offsetHeight : 0;

      setSidebarTopPx(Math.max(0, headerH + breadcrumbH));
    };

    const frameId = requestAnimationFrame(measureLessonLayout);
    const resizeObserver = new ResizeObserver(measureLessonLayout);
    const observedElements = [
      document.querySelector('[data-app-header]'),
      document.querySelector('nav[aria-label="Breadcrumb"]'),
      sectionRef.current,
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);

    observedElements.forEach((element) => resizeObserver.observe(element));
    window.addEventListener('resize', measureLessonLayout);
    window.addEventListener('orientationchange', measureLessonLayout);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureLessonLayout);
      window.removeEventListener('orientationchange', measureLessonLayout);
    };
  }, [loading, lessonId, courseName]);

  useEffect(() => {
    if (!lessonId) return;

    requestAnimationFrame(() => {
      if (isStudyMode) {
        lessonMainRef.current?.scrollTo({ top: 0, left: 0 });
        return;
      }

      window.scrollTo({ top: 0, left: 0 });
    });
  }, [lessonId, isStudyMode]);

  const handleToggleStudyMode = useCallback(() => {
    setIsStudyMode((previous) => {
      const next = !previous;

      if (next) {
        setIsSidebarOpen(false);
        requestAnimationFrame(() => {
          const lessonContentTop = lessonContentRef.current?.getBoundingClientRect().top;
          if (lessonContentTop == null) return;

          window.scrollTo({
            top: Math.max(0, window.scrollY + lessonContentTop - sidebarTopPx - 16),
            behavior: 'smooth',
          });
        });
      }

      return next;
    });
  }, [sidebarTopPx]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(min-width: 768px)');
      setIsSidebarOpen(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
      if (mq.addEventListener) {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
      mq.addListener(handler);
      return () => {
        mq.removeListener(handler);
      };
    }
  }, []);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isStudyMode,
    sidebarTopPx,
    sectionRef,
    lessonContentRef,
    lessonMainRef,
    handleToggleStudyMode,
  };
}
