import { Card, Pagination } from '../';
import { TestCard } from '../cards';
import type { JlptExamSummary } from '../../services/api';
import { getExamType, TEST_LIST_PAGE_SIZE, testImages } from './testListData';

interface TestGridSectionProps {
  error: string | null;
  loading: boolean;
  page: number;
  tests: JlptExamSummary[];
  totalCount: number;
  totalQuestions: number;
  onPageChange: (page: number) => void;
  onStartTest: (examId: number) => void;
}

export function TestGridSection({
  error,
  loading,
  page,
  tests,
  totalCount,
  totalQuestions,
  onPageChange,
  onStartTest,
}: TestGridSectionProps) {
  return (
    <section className="py-section-gap max-w-[1280px] mx-auto px-margin-desktop">
      <div className="flex items-center justify-between mb-section-gap">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Available Tests</h2>
          <div className="w-16 h-1 bg-secondary mt-2"></div>
        </div>
        <span className="text-label-md text-on-surface-variant">
          {loading ? 'Loading tests...' : `${totalCount} tests, ${totalQuestions} questions on this page`}
        </span>
      </div>

      {error && <p className="mb-stack-md rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      {!loading && !error && tests.length === 0 && (
        <Card className="border border-outline-variant bg-surface p-stack-lg text-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">No JLPT tests available</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Try another level or section, or ask an admin to publish questions for this test type.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {tests.map((test, index) => (
          <TestCard
            key={test.exam_id}
            title={test.title}
            level={test.jlpt_level}
            type={getExamType(test)}
            duration={test.duration_minutes ? `${test.duration_minutes} min` : `${test.question_count} questions`}
            image={testImages[index % testImages.length]}
            onStart={() => onStartTest(test.exam_id)}
          />
        ))}
      </div>
      {!loading && !error && tests.length > 0 && (
        <Pagination
          page={page}
          pageSize={TEST_LIST_PAGE_SIZE}
          itemCount={tests.length}
          totalCount={totalCount}
          onPageChange={onPageChange}
          className="mt-section-gap"
        />
      )}
    </section>
  );
}
