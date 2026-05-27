import type { Lesson } from '../../services/api';
import { formatLessonDuration, type CourseModule } from './courseDetailUtils';

export function ModuleItem({
  module,
  lesson,
  onPlay,
  canPlay,
  isCurrent = false,
}: {
  module: CourseModule;
  lesson?: Lesson;
  onPlay?: () => void;
  canPlay: boolean;
  isCurrent?: boolean;
}) {
  const isCompleted = Boolean(lesson?.is_completed);
  const isLocked = !isCompleted && !canPlay;
  const handleSelect = () => {
    if (canPlay) onPlay?.();
  };

  return (
    <div
      role={canPlay ? 'button' : undefined}
      tabIndex={canPlay ? 0 : undefined}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (!canPlay) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSelect();
        }
      }}
      className={`group p-stack-lg border transition-all flex justify-between items-center shadow-sm ${
        isCompleted
          ? 'cursor-pointer bg-success-container border-success/40 ring-1 ring-success/20 hover:border-success hover:bg-success-container'
          : isLocked
            ? 'bg-surface-container-low border-outline-variant opacity-80'
            : `cursor-pointer bg-surface border-outline-variant hover:border-primary ${isCurrent ? 'ring-2 ring-primary/15 border-primary/40' : ''}`
      }`}
    >
      <div className="flex gap-stack-lg">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-headline-sm font-bold transition-colors ${
            isCompleted
              ? 'bg-success text-on-primary border-success shadow-md shadow-success/20'
              : isLocked
                ? 'bg-surface-container text-on-surface-variant border-outline-variant'
                : 'bg-surface text-outline-variant border-outline-variant group-hover:border-primary group-hover:text-primary'
          }`}
        >
          {isCompleted ? (
            <span className="material-symbols-outlined text-[24px]">check</span>
          ) : (
            String(module.id).padStart(2, '0')
          )}
        </div>
        <span
          className={`hidden font-headline-md transition-colors ${
            isCompleted ? 'text-on-success-container group-hover:text-on-success-container' : 'text-outline-variant group-hover:text-primary'
          }`}
        >
          {String(module.id).padStart(2, '0')}
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-headline-sm ${isCompleted ? 'text-on-success-container' : 'text-on-surface'}`}>{module.title}</h3>
            {isCurrent && (
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm font-bold text-on-primary-fixed">
                Current
              </span>
            )}
          </div>
          <div className={`flex items-center gap-4 text-label-md ${isCompleted ? 'text-on-success-container' : 'text-on-surface-variant'}`}>
            {lesson && (
              <>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">{lesson.video_url ? 'play_circle' : 'description'}</span>
                  {[lesson.video_url ? 'Video' : null, lesson.content_text ? 'Text' : null, lesson.audio_url ? 'Audio' : null].filter(Boolean).join(' + ') || 'Lesson'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {formatLessonDuration(lesson.duration)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {canPlay ? (
        <span
          className={`px-4 py-2 font-label-md transition-all flex items-center gap-2 ${
            isCompleted
              ? 'bg-success text-on-primary shadow-md shadow-success/20'
              : 'bg-surface-container group-hover:bg-primary-container group-hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
        </span>
      ) : (
        <div className="px-4 py-2 font-label-md flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">lock</span>
        </div>
      )}
    </div>
  );
}
