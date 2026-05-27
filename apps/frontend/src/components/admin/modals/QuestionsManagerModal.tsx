import type { AdminQuizQuestion, AdminTest } from '../../../services/api';
import { actionButtonClass, dangerButtonClass, secondaryButtonClass } from '../adminClasses';
import { optionLabel } from '../adminHelpers';
import { questionTypeOptions, sectionTypeOptions } from '../adminOptions';
import { AdminTable, Modal } from '../DashboardUi';

export function QuestionsManagerModal({
  quiz,
  questions,
  busy,
  onClose,
  onCreateQuestion,
  onEditQuestion,
  onMoveQuestion,
  onDeleteQuestion,
}: {
  quiz: AdminTest | null;
  questions: AdminQuizQuestion[];
  busy: boolean;
  onClose: () => void;
  onCreateQuestion: () => void;
  onEditQuestion: (item: AdminQuizQuestion) => void;
  onMoveQuestion: (questionId: number, direction: 'up' | 'down') => void;
  onDeleteQuestion: (item: AdminQuizQuestion) => void;
}) {
  const sortedQuestions = [...questions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id);

  return (
    <Modal title="Manage Questions" subtitle={quiz ? quiz.title : 'Quiz questions'} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
          <div>
            <p className="text-label-md font-semibold text-on-surface">{questions.length} questions</p>
            <p className="text-label-md text-on-surface-variant">Total marks are recalculated from question marks.</p>
          </div>
          <button className={actionButtonClass} onClick={onCreateQuestion} disabled={!quiz}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Question
          </button>
        </div>
        <AdminTable
          headers={['Order', 'Question', 'Section', 'Type', 'Marks', 'Options', 'Actions']}
          rows={sortedQuestions.map((question, index) => [
            question.order_index || '-',
            <div>
              <p className="font-semibold text-on-surface">{question.question_text}</p>
              {question.explanation && <p className="text-label-md text-on-surface-variant">{question.explanation}</p>}
            </div>,
            optionLabel(sectionTypeOptions, question.section_type),
            optionLabel(questionTypeOptions, question.question_type),
            question.marks,
            question.options.length,
            <div className="flex flex-wrap gap-2">
              <button className={secondaryButtonClass} disabled={busy || index === 0} onClick={() => onMoveQuestion(question.question_id, 'up')}>
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
              </button>
              <button className={secondaryButtonClass} disabled={busy || index === sortedQuestions.length - 1} onClick={() => onMoveQuestion(question.question_id, 'down')}>
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>
              <button className={secondaryButtonClass} onClick={() => onEditQuestion(question)}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button className={dangerButtonClass} disabled={busy} onClick={() => onDeleteQuestion(question)}>
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>,
          ])}
        />
      </div>
    </Modal>
  );
}

