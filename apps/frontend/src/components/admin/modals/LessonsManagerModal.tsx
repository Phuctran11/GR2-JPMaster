import type { AdminCourse, AdminLesson, AdminTest } from '../../../services/api';
import { actionButtonClass, dangerButtonClass, secondaryButtonClass } from '../adminClasses';
import { optionLabel } from '../adminHelpers';
import { courseLevelOptions } from '../adminOptions';
import { AdminTable, Modal } from '../DashboardUi';

export function LessonsManagerModal({
  selectedCourse,
  lessons,
  lessonQuizzes,
  busy,
  onClose,
  onCreateLesson,
  onEditLesson,
  onMoveLesson,
  onDeleteLesson,
}: {
  selectedCourse: AdminCourse | null;
  lessons: AdminLesson[];
  lessonQuizzes: AdminTest[];
  busy: boolean;
  onClose: () => void;
  onCreateLesson: (courseId?: number | null) => void;
  onEditLesson: (item: AdminLesson) => void;
  onMoveLesson: (lessonId: number, direction: 'up' | 'down') => void;
  onDeleteLesson: (item: AdminLesson) => void;
}) {
  return (
    <Modal
      title="Manage Lessons"
      subtitle={selectedCourse ? selectedCourse.title : 'Choose a course from the Courses table.'}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
          <div className="grid grid-cols-2 gap-3 text-label-md text-on-surface-variant md:grid-cols-4">
            <div>
              <p className="font-semibold text-on-surface">{optionLabel(courseLevelOptions, selectedCourse?.level)}</p>
              <p>Level</p>
            </div>
            <div>
              <p className="font-semibold text-on-surface">{lessons.length}</p>
              <p>Lessons</p>
            </div>
            <div>
              <p className="font-semibold text-on-surface">{selectedCourse?.duration || '-'}</p>
              <p>Minutes</p>
            </div>
            <div>
              <p className="font-semibold text-on-surface">{selectedCourse ? Number(selectedCourse.price).toLocaleString('en-US') : '-'}</p>
              <p>Price</p>
            </div>
          </div>
          <button className={actionButtonClass} onClick={() => onCreateLesson(selectedCourse?.course_id)} disabled={!selectedCourse?.course_id}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Lesson
          </button>
        </div>
        <AdminTable
          headers={['Order', 'Title', 'Content', 'Quiz', 'Duration', 'Actions']}
          rows={lessons.map((item, index) => [
            item.order_index,
            <div>
              <p className="font-semibold text-on-surface">{item.title}</p>
              <p className="text-label-md text-on-surface-variant">ID #{item.lesson_id}</p>
            </div>,
            <div className="flex flex-wrap gap-1">
              {item.video_url && <span className="rounded bg-primary/10 px-2 py-1 text-label-md text-primary">Video</span>}
              {item.content_text && <span className="rounded bg-secondary/10 px-2 py-1 text-label-md text-secondary">Text</span>}
              {item.audio_url && <span className="rounded bg-tertiary/10 px-2 py-1 text-label-md text-tertiary">Audio</span>}
              {!item.video_url && !item.content_text && !item.audio_url && <span className="text-on-surface-variant">Empty</span>}
            </div>,
            lessonQuizzes.some((quiz) => quiz.lesson_id === item.lesson_id) ? (
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-label-md font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                None
              </span>
            ),
            item.duration || '-',
            <div className="flex flex-wrap gap-2">
              <button className={secondaryButtonClass} disabled={busy || index === 0} onClick={() => onMoveLesson(item.lesson_id, 'up')}>
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
              </button>
              <button className={secondaryButtonClass} disabled={busy || index === lessons.length - 1} onClick={() => onMoveLesson(item.lesson_id, 'down')}>
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className={secondaryButtonClass} onClick={() => onEditLesson(item)}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button className={dangerButtonClass} disabled={busy} onClick={() => onDeleteLesson(item)}>
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>,
          ])}
        />
      </div>
    </Modal>
  );
}

