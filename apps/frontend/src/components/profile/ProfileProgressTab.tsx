import { Card } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { AnalyticsAttempt, AnalyticsSummary, EnrolledCourse, StudyTimePoint } from '../../services/api';
import {
  CourseProgressPanel,
  ProgressMetric,
  ScoreAnalysisCard,
  StudyTimeChart,
  StudyTimeOverview,
} from './ProfileAnalytics';
import { averageScore } from './profileUtils';

export function ProfileProgressTab({
  summary,
  studyTime,
  enrollments,
  quizAttempts,
  jlptAttempts,
}: {
  summary: AnalyticsSummary | null;
  studyTime: StudyTimePoint[];
  enrollments: EnrolledCourse[];
  quizAttempts: AnalyticsAttempt[];
  jlptAttempts: AnalyticsAttempt[];
}) {
  return (
    <Card className="overflow-hidden border border-outline-variant">
      <div className="border-b border-outline-variant bg-surface-container-low p-5 md:p-8">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] xl:items-end">
          <div>
            <p className="text-label-md font-black uppercase tracking-wide text-secondary">Learning analytics</p>
            <Heading level="h2" size="headline-lg" className="mt-2 text-primary">Progress Dashboard</Heading>
            <Text variant="body-md" color="on-surface-variant" className="mt-2">
              Study time is calculated from completed lesson durations and resets into weekly and monthly cycles.
            </Text>
          </div>
          <StudyTimeOverview summary={summary} />
        </div>
      </div>
      <div className="space-y-6 p-5 md:p-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ProgressMetric label="Completed lessons" value={summary?.completed_lessons ?? 0} icon="menu_book" />
          <ProgressMetric label="Quiz avg score" value={`${Math.round(summary?.average_quiz_score ?? averageScore(quizAttempts))}%`} icon="quiz" />
          <ProgressMetric label="JLPT avg score" value={`${Math.round(summary?.average_jlpt_score ?? averageScore(jlptAttempts))}%`} icon="language" />
          <ProgressMetric label="Active courses" value={summary?.active_courses ?? 0} icon="school" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <StudyTimeChart points={studyTime} />
          <CourseProgressPanel enrollments={enrollments} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ScoreAnalysisCard
            title="Quiz analysis"
            icon="quiz"
            attempts={quizAttempts}
            average={summary?.average_quiz_score ?? averageScore(quizAttempts)}
            count={summary?.quiz_attempts ?? quizAttempts.length}
          />
          <ScoreAnalysisCard
            title="JLPT test analysis"
            icon="language"
            attempts={jlptAttempts}
            average={summary?.average_jlpt_score ?? averageScore(jlptAttempts)}
            count={summary?.jlpt_attempts ?? jlptAttempts.length}
          />
        </div>
      </div>
    </Card>
  );
}
