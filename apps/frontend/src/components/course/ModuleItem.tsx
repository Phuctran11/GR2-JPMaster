import type { Lesson } from '../../services/api';
import { formatLessonDuration, type CourseModule } from './courseDetailUtils';

export function ModuleItem({
  module,
  lesson,
  onPlay,
  canPlay,
}: {
  module: CourseModule;
  lesson?: Lesson;
  onPlay?: () => void;
  canPlay: boolean;
}) {
  const isCompleted = Boolean(lesson?.is_completed);
  const isLocked = !isCompleted && !canPlay;

  return (
    <div
      className={`group p-stack-lg border transition-all flex justify-between items-center shadow-sm ${
        isCompleted
          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 hover:border-emerald-400 hover:bg-emerald-100'
          : isLocked
            ? 'bg-surface-container-low border-outline-variant opacity-80'
            : 'bg-white border-outline-variant hover:border-primary'
      }`}
    >
      <div className="flex gap-stack-lg">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-headline-sm font-bold transition-colors ${
            isCompleted
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
              : isLocked
                ? 'bg-surface-container text-on-surface-variant border-outline-variant'
                : 'bg-surface text-outline-variant border-outline-variant group-hover:border-primary group-hover:text-primary'
          }`}
        >
          {String(module.id).padStart(2, '0')}
        </div>
        <span
          className={`hidden font-headline-md transition-colors ${
            isCompleted ? 'text-emerald-700 group-hover:text-emerald-800' : 'text-outline-variant group-hover:text-primary'
          }`}
        >
          {String(module.id).padStart(2, '0')}
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-headline-sm ${isCompleted ? 'text-emerald-900' : 'text-on-surface'}`}>{module.title}</h3>
          </div>
          <div className={`flex items-center gap-4 text-label-md ${isCompleted ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
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
        <button
          type="button"
          onClick={onPlay}
          className={`px-4 py-2 font-label-md transition-all flex items-center gap-2 ${
            isCompleted
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
              : 'bg-surface-container hover:bg-primary-container hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
        </button>
      ) : (
        <div className="px-4 py-2 font-label-md flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">lock</span>
        </div>
      )}
    </div>
  );
}
