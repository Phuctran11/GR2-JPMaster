import { Card, Container } from '../ui';
import { Heading, Text } from '../ui/Typography';
import type { Course, Quiz } from '../../services/api';
import { getCourseLessonCount } from '../../utils/course';
import { formatCourseDuration, type CourseModule } from './courseDetailUtils';
import { ModuleItem } from './ModuleItem';

interface CourseContentSectionProps {
  course: Course;
  modules: CourseModule[];
  firstUnfinishedLessonIndex: number;
  finalQuiz: Quiz | null;
  enrollmentStatus: string | null;
  shouldShowFinalTestButton: boolean;
  finalQuizPassed: boolean;
  allLessonsCompleted: boolean;
  onSelectLesson: (lessonId: number) => void;
  onTakeFinalTest: () => void;
}

export function CourseContentSection({
  course,
  modules,
  firstUnfinishedLessonIndex,
  finalQuiz,
  enrollmentStatus,
  shouldShowFinalTestButton,
  finalQuizPassed,
  allLessonsCompleted,
  onSelectLesson,
  onTakeFinalTest,
}: CourseContentSectionProps) {
  return (
    <section className="py-section-gap">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div className="md:col-span-4">
            <div className="sticky top-32">
              <Heading level="h2" size="headline-lg" className="text-primary mb-stack-md">
                Course Content
              </Heading>
              <Text variant="body-md" color="on-surface-variant" className="mb-stack-lg leading-relaxed">
                This course contains {getCourseLessonCount(course)} lessons designed to help you master the material progressively.
              </Text>
              <Card className="p-6 bg-secondary-fixed/20 border border-secondary-fixed-dim">
                <h4 className="font-bold text-on-surface mb-2">What's Included:</h4>
                <ul className="space-y-2 text-on-surface-variant font-label-md">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                    {getCourseLessonCount(course)} Interactive Lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                    {formatCourseDuration(course.duration)} Total Duration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                    {course.lessons?.filter((lesson) => Boolean(lesson.video_url?.trim())).length || 0} Video Lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                    Progress Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                    Lifetime Access
                  </li>
                </ul>
              </Card>
            </div>
          </div>
          <div className="md:col-span-8 space-y-stack-md">
            {modules.length > 0 ? (
              <>
                {modules.map((module, index) => {
                  const lesson = course.lessons?.[index];

                  return (
                    <ModuleItem
                      key={module.id}
                      module={module}
                      lesson={lesson}
                      canPlay={Boolean(enrollmentStatus && (lesson?.is_completed || index === firstUnfinishedLessonIndex))}
                      onPlay={() => {
                        if (lesson?.lesson_id) {
                          onSelectLesson(lesson.lesson_id);
                        }
                      }}
                    />
                  );
                })}
                {finalQuiz && enrollmentStatus && (
                  <div className={`border p-stack-lg shadow-sm ${shouldShowFinalTestButton ? 'border-primary bg-primary-fixed/20' : finalQuizPassed ? 'border-emerald-300 bg-emerald-50' : 'border-outline-variant bg-surface-container-low'}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-label-md font-bold uppercase tracking-wide text-primary">Final test</p>
                        <h3 className="mt-1 font-headline-sm text-on-surface">{finalQuiz.title}</h3>
                        <p className="mt-1 text-label-md text-on-surface-variant">
                          {finalQuizPassed
                            ? finalQuiz.latest_attempt?.score != null
                              ? `Requirement satisfied. Latest score: ${Number(finalQuiz.latest_attempt.score).toFixed(2)}%.`
                              : 'Requirement satisfied.'
                            : allLessonsCompleted
                              ? 'Complete this test to finish the course and unlock certification.'
                              : 'Unlocks after all lessons are completed.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onTakeFinalTest}
                        disabled={!allLessonsCompleted}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">assignment</span>
                        {finalQuizPassed ? 'Retake final' : 'Take final test'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-on-surface-variant text-center py-8">No lessons yet</p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
