import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset, AdminJlptExam, AdminJlptSection, AdminReadingPassage, AdminTest } from '../../../services/api';
import { inputClass } from '../adminClasses';
import type { AdminQuestionFormValues } from '../adminFormTypes';
import { optionLabel } from '../adminHelpers';
import { sectionTypeOptions } from '../adminOptions';
import { Field, Modal, ModalActions } from '../DashboardUi';
import { QuestionMediaFields, QuestionMetaFields, QuestionOptionsEditor } from './question';

export function QuestionFormModal({
  editingQuestionId,
  managingJlptSectionId,
  managingJlptSection,
  selectedJlptExam,
  managingQuestionsQuiz,
  readingPassages,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
}: {
  editingQuestionId: number | null;
  managingJlptSectionId: number | null;
  managingJlptSection: AdminJlptSection | null;
  selectedJlptExam: AdminJlptExam | null;
  managingQuestionsQuiz: AdminTest | null;
  readingPassages: AdminReadingPassage[];
  busy: boolean;
  initialValues: AdminQuestionFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminQuestionFormValues) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminQuestionFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal
      title={editingQuestionId ? 'Edit Question' : 'Create Question'}
      subtitle={
        managingJlptSection
          ? `${selectedJlptExam?.title || 'JLPT test'} - ${optionLabel(sectionTypeOptions, managingJlptSection.section_type)}`
          : managingQuestionsQuiz
            ? managingQuestionsQuiz.title
            : 'Question'
      }
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Field label="Question Text">
              <textarea className={inputClass} required rows={5} {...register('question_text', { required: true })} />
            </Field>
            <Field label="Explanation">
              <textarea className={inputClass} rows={3} {...register('explanation')} />
            </Field>
            <QuestionMediaFields
              form={form}
              managingJlptSectionId={managingJlptSectionId}
              uploadingField={uploadingField}
              onUpload={onUpload}
              setValue={setValue}
            />
            <QuestionOptionsEditor form={form} setValue={setValue} />
          </div>
          <QuestionMetaFields
            form={form}
            managingJlptSectionId={managingJlptSectionId}
            readingPassages={readingPassages}
            register={register}
            setValue={setValue}
          />
        </div>
        <ModalActions busy={busy} submitLabel={editingQuestionId ? 'Save Question' : 'Create Question'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

