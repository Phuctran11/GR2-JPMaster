import type { AdminJlptExam, AdminJlptSection, AdminQuizQuestion, AdminReadingPassage } from '../../../services/api';
import { actionButtonClass, dangerButtonClass, secondaryButtonClass } from '../adminClasses';
import { optionLabel } from '../adminHelpers';
import { questionTypeOptions, sectionTypeOptions } from '../adminOptions';
import { AdminTable, Modal } from '../DashboardUi';

export function JlptSectionsManagerModal({
  selectedJlptExam,
  sections,
  questions,
  readingPassages,
  managingJlptSectionId,
  managingJlptSection,
  busy,
  onClose,
  onCreateSection,
  onManageQuestions,
  onEditSection,
  onDeleteSection,
  onCreateReadingPassage,
  onRefreshReadingPassages,
  onEditReadingPassage,
  onAutoQuestions,
  onCreateQuestion,
  onEditQuestion,
  onMoveQuestion,
  onDeleteQuestion,
}: {
  selectedJlptExam: AdminJlptExam | null;
  sections: AdminJlptSection[];
  questions: AdminQuizQuestion[];
  readingPassages: AdminReadingPassage[];
  managingJlptSectionId: number | null;
  managingJlptSection: AdminJlptSection | null;
  busy: boolean;
  onClose: () => void;
  onCreateSection: () => void;
  onManageQuestions: (section: AdminJlptSection) => void;
  onEditSection: (section: AdminJlptSection) => void;
  onDeleteSection: (section: AdminJlptSection) => void;
  onCreateReadingPassage: () => void;
  onRefreshReadingPassages: () => void;
  onEditReadingPassage: (passage: AdminReadingPassage) => void;
  onAutoQuestions: () => void;
  onCreateQuestion: () => void;
  onEditQuestion: (question: AdminQuizQuestion) => void;
  onMoveQuestion: (questionId: number, direction: 'up' | 'down') => void;
  onDeleteQuestion: (question: AdminQuizQuestion) => void;
}) {
  const maxSections = sectionTypeOptions.length;
  const canAddSection = Boolean(selectedJlptExam) && sections.length < maxSections;

  return (
    <Modal
      title="Manage JLPT Sections"
      subtitle={selectedJlptExam ? `${selectedJlptExam.title} (${selectedJlptExam.jlpt_level})` : 'JLPT sections'}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-5">
        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-on-surface">{sections.length} / {maxSections} sections</p>
                <p className="text-label-md text-on-surface-variant">
                  {canAddSection ? 'Add, edit, hide sections, or select one to manage questions.' : 'All JLPT section types have been added.'}
                </p>
              </div>
              <button
                type="button"
                className={actionButtonClass}
                onClick={onCreateSection}
                disabled={!canAddSection}
                title={canAddSection ? 'Add section' : 'All 4 JLPT sections already exist'}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Section
              </button>
            </div>
          </div>
          <AdminTable
            headers={['Order', 'Section', 'Duration', 'Questions', 'Actions']}
            rows={sections.map((section) => [
              section.section_order || '-',
              <div>
                <p className="font-semibold text-on-surface">{section.title || optionLabel(sectionTypeOptions, section.section_type)}</p>
                <p className="text-label-md text-on-surface-variant">{optionLabel(sectionTypeOptions, section.section_type)}</p>
              </div>,
              section.duration_minutes || '-',
              section.question_count || 0,
              <div className="flex flex-wrap gap-2">
                <button className={secondaryButtonClass} onClick={() => onManageQuestions(section)}>
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                </button>
                <button className={secondaryButtonClass} onClick={() => onEditSection(section)}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button className={dangerButtonClass} disabled={busy} onClick={() => onDeleteSection(section)}>
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>,
            ])}
          />
        </div>
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
            <div>
              <p className="text-label-md font-semibold text-on-surface">
                {managingJlptSection ? `${optionLabel(sectionTypeOptions, managingJlptSection.section_type)} Questions` : 'Questions'}
              </p>
              <p className="text-label-md text-on-surface-variant">
                {managingJlptSection ? `${questions.length} questions in this section` : 'Select a section first'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {managingJlptSection?.section_type === 'reading' && (
                <button className={secondaryButtonClass} onClick={onCreateReadingPassage}>
                  <span className="material-symbols-outlined text-[18px]">article</span>
                  New Passage
                </button>
              )}
              <button
                className={secondaryButtonClass}
                onClick={onAutoQuestions}
                disabled={!managingJlptSectionId || !managingJlptSection || !['vocabulary', 'grammar'].includes(managingJlptSection.section_type)}
              >
                <span className="material-symbols-outlined text-[18px]">shuffle</span>
                Auto Add
              </button>
              <button className={actionButtonClass} onClick={onCreateQuestion} disabled={!managingJlptSectionId}>
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Question
              </button>
            </div>
          </div>
          {managingJlptSection?.section_type === 'reading' && (
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-label-md font-semibold text-on-surface">{readingPassages.length} reading passages</p>
                <button type="button" className={secondaryButtonClass} onClick={onRefreshReadingPassages}>
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {readingPassages.map((passage) => (
                  <button key={passage.passage_id} type="button" className="rounded-lg border border-outline-variant bg-surface p-3 text-left hover:border-primary" onClick={() => onEditReadingPassage(passage)}>
                    <p className="truncate font-semibold text-on-surface">{passage.title || `Passage #${passage.passage_id}`}</p>
                    <p className="mt-1 line-clamp-2 text-label-md text-on-surface-variant">{passage.passage_text || passage.image_url || 'Image passage'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!managingJlptSectionId ? (
            <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-on-surface-variant">
              Select a section to view and manage its questions.
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-on-surface-variant">
              No questions in this section yet.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <article key={question.question_id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-1 text-label-sm font-semibold text-primary">#{question.order_index || index + 1}</span>
                        <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">{optionLabel(questionTypeOptions, question.question_type)}</span>
                        <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">{question.options.length} options</span>
                        {question.image_url && <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">Image</span>}
                        {question.audio_url && <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">Audio</span>}
                      </div>
                      <p className="break-words text-body-md font-semibold text-on-surface">{question.question_text}</p>
                      {question.explanation && <p className="mt-1 break-words text-label-md text-on-surface-variant">{question.explanation}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button className={secondaryButtonClass} disabled={busy || index === 0} onClick={() => onMoveQuestion(question.question_id, 'up')}>
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                      </button>
                      <button className={secondaryButtonClass} disabled={busy || index === questions.length - 1} onClick={() => onMoveQuestion(question.question_id, 'down')}>
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                      </button>
                      <button className={secondaryButtonClass} onClick={() => onEditQuestion(question)}>
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button className={dangerButtonClass} disabled={busy} onClick={() => onDeleteQuestion(question)}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

