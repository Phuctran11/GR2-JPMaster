import type { RefObject } from 'react';
import { Button } from '../Button';
import { Container } from '../ui';
import { Heading } from '../ui/Typography';
import type { Lesson as LessonData } from '../../services/api';
import { formatLessonDuration } from './lessonUtils';

interface LessonHeaderSectionProps {
  lesson: LessonData;
  isSidebarOpen: boolean;
  progressPercent: number;
  currentLessonNumber: number;
  totalLessons: number;
  sectionRef: RefObject<HTMLElement | null>;
  onBackToCourse: () => void;
  onToggleSidebar: () => void;
  onToggleStudyMode: () => void;
}

export function LessonHeaderSection({
  lesson,
  isSidebarOpen,
  progressPercent,
  currentLessonNumber,
  totalLessons,
  sectionRef,
  onBackToCourse,
  onToggleSidebar,
  onToggleStudyMode,
}: LessonHeaderSectionProps) {
  return (
    <section ref={sectionRef} className={`bg-surface py-stack-lg border-b border-outline-variant transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'md:ml-16'}`}>
      <Container>
        <div className="mb-stack-md md:hidden">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-on-surface shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-unit">
            <Button
              variant="secondary"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-on-surface shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:text-primary sm:w-fit"
              onClick={onBackToCourse}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Course
            </Button>
            <Heading level="h1" size="headline-lg" className="text-on-surface">
              {lesson.title}
            </Heading>
            <div className="flex flex-col gap-3 text-on-surface-variant sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap items-center gap-x-stack-md gap-y-2">
                <span className="flex items-center gap-1 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  {formatLessonDuration(lesson.duration)}
                </span>
                <span className="flex items-center gap-1 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  {[lesson.video_url?.trim() ? 'Video' : null, lesson.content_text?.trim() ? 'Text' : null, lesson.audio_url?.trim() ? 'Audio' : null].filter(Boolean).join(' + ') || 'Lesson'}
                </span>
              </div>
              <div className="flex min-w-[180px] flex-1 items-center gap-3 sm:max-w-xs">
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="shrink-0 text-label-md font-label-md">
                  {currentLessonNumber}/{totalLessons || 1}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full lg:w-auto lg:justify-end">
            <button
              type="button"
              onClick={onToggleStudyMode}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary px-5 py-2.5 font-bold text-on-primary shadow-sm transition-all hover:bg-primary/90 sm:w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Study mode
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
