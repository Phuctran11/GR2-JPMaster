import type {
  AdminDashboardCommonProps,
  AdminDashboardJlptProps,
  AdminDashboardQuestionProps,
  AdminModalMap,
} from '../adminModalTypes';
import { QuestionFormModal, QuestionsManagerModal } from '../modals';

export function createQuestionModalGroup({
  common,
  jlpt,
  questions,
}: {
  common: AdminDashboardCommonProps;
  jlpt: AdminDashboardJlptProps;
  questions: AdminDashboardQuestionProps;
}): AdminModalMap {
  return {
    questions: (
      <QuestionsManagerModal
        quiz={questions.managingQuiz}
        questions={questions.visibleQuestions}
        busy={common.busy}
        onClose={common.closeModal}
        onCreateQuestion={questions.openCreate}
        onEditQuestion={questions.openEdit}
        onMoveQuestion={questions.move}
        onDeleteQuestion={questions.deleteItem}
      />
    ),
    question: (
      <QuestionFormModal
        editingQuestionId={questions.editingId}
        managingJlptSectionId={jlpt.managingSectionId}
        managingJlptSection={jlpt.managingSection}
        selectedJlptExam={jlpt.selectedExam}
        managingQuestionsQuiz={questions.managingQuiz}
        readingPassages={jlpt.readingPassages}
        busy={common.busy}
        initialValues={questions.form}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={questions.submit}
        onClose={questions.closeForm}
      />
    ),
  };
}
