import type { EnrolledCourse } from '../../services/api';

export function CourseProgressPanel({ enrollments }: { enrollments: EnrolledCourse[] }) {
  const visibleCourses = enrollments.slice(0, 5);
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.progress_percent ?? 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            <h3 className="text-title-md font-bold text-on-surface">Course completion</h3>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">Progress by enrolled course.</p>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-right dark:bg-primary/15">
          <p className="text-title-md font-bold text-primary dark:text-primary-fixed">{averageProgress}%</p>
          <p className="text-label-md text-on-surface-variant">Average</p>
        </div>
      </div>
      {visibleCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-on-surface-variant">
          Enroll in a course to see progress analysis.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCourses.map((enrollment) => {
            const progress = enrollment.progress_percent ?? 0;
            return (
              <div key={enrollment.enrollment_id}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate text-body-md font-semibold text-on-surface">{enrollment.course.title}</p>
                  <span className="text-label-md font-bold text-primary dark:text-primary-fixed">{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-surface-container-low shadow-inner ring-1 ring-outline-variant/50 dark:bg-surface-container-high dark:ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-success shadow-sm shadow-primary/25 dark:from-[#8fb3ff] dark:via-[#38d5c8] dark:to-[#6ee7b7] dark:shadow-[#38d5c8]/35"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
