import type {
  AdminDashboardCommonProps,
  AdminDashboardJlptProps,
  AdminDashboardQuestionProps,
  AdminModalMap,
} from '../adminModalTypes';
import {
  AutoJlptQuestionsModal,
  JlptExamFormModal,
  JlptSectionFormModal,
  JlptSectionsManagerModal,
  ReadingPassageFormModal,
} from '../modals';

export function createJlptModalGroup({
  common,
  jlpt,
  questions,
}: {
  common: AdminDashboardCommonProps;
  jlpt: AdminDashboardJlptProps;
  questions: AdminDashboardQuestionProps;
}): AdminModalMap {
  return {
    jlptExam: (
      <JlptExamFormModal
        editingJlptExamId={jlpt.editingExamId}
        selectedJlptExam={jlpt.selectedExam}
        busy={common.busy}
        initialValues={jlpt.examForm}
        onSubmit={jlpt.submitExam}
        onClose={common.closeModal}
        onManageSections={jlpt.openManageSections}
        onDelete={jlpt.deleteExam}
      />
    ),
    jlptSections: (
      <JlptSectionsManagerModal
        selectedJlptExam={jlpt.selectedExam}
        sections={jlpt.sortedSections}
        questions={jlpt.sortedQuestions}
        readingPassages={jlpt.readingPassages}
        managingJlptSectionId={jlpt.managingSectionId}
        managingJlptSection={jlpt.managingSection}
        busy={common.busy}
        onClose={common.closeModal}
        onCreateSection={jlpt.openCreateSection}
        onManageQuestions={jlpt.openManageQuestions}
        onEditSection={jlpt.openEditSection}
        onDeleteSection={jlpt.deleteSection}
        onCreateReadingPassage={jlpt.openCreateReadingPassage}
        onRefreshReadingPassages={jlpt.refreshReadingPassages}
        onEditReadingPassage={jlpt.openEditReadingPassage}
        onAutoQuestions={jlpt.openAutoQuestions}
        onCreateQuestion={questions.openCreate}
        onEditQuestion={questions.openEdit}
        onMoveQuestion={questions.move}
        onDeleteQuestion={questions.deleteItem}
      />
    ),
    jlptSection: (
      <JlptSectionFormModal
        editingJlptSectionId={jlpt.editingSectionId}
        selectedJlptExam={jlpt.selectedExam}
        sections={jlpt.sections}
        busy={common.busy}
        initialValues={jlpt.sectionForm}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={jlpt.submitSection}
        onClose={() => common.setActiveModal('jlptSections')}
        onDelete={jlpt.deleteSection}
      />
    ),
    autoJlptQuestions: (
      <AutoJlptQuestionsModal
        section={jlpt.managingSection}
        selectedJlptExam={jlpt.selectedExam}
        busy={common.busy}
        initialValues={jlpt.autoQuestionsForm}
        onSubmit={jlpt.submitAutoQuestions}
        onClose={() => common.setActiveModal('jlptSections')}
      />
    ),
    readingPassage: (
      <ReadingPassageFormModal
        editingReadingPassageId={jlpt.editingReadingPassageId}
        selectedJlptExam={jlpt.selectedExam}
        busy={common.busy}
        initialValues={jlpt.readingPassageForm}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={jlpt.submitReadingPassage}
        onClose={() => common.setActiveModal('jlptSections')}
      />
    ),
  };
}
