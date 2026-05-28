import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Container, Breadcrumbs } from '../components';
import {
  LessonActions,
  LessonAiAssistantModal,
  LessonContent,
  LessonFlashcardDialog,
  LessonHeaderSection,
  LessonMedia,
  LessonNoteDialog,
  LessonSidebarPanels,
  LessonStatusPage,
} from '../components/lesson';
import { NoteComposer } from '../components/notes';
import { useLessonAiAssistant } from '../hooks/lesson/useLessonAiAssistant';
import { useLessonData } from '../hooks/lesson/useLessonData';
import { useLessonFlashcards } from '../hooks/lesson/useLessonFlashcards';
import { useLessonLayout } from '../hooks/lesson/useLessonLayout';
import { useLessonNotes } from '../hooks/lesson/useLessonNotes';
import { useLessonProgressActions } from '../hooks/lesson/useLessonProgressActions';
import { useLessonQuiz } from '../hooks/lesson/useLessonQuiz';
import { useToastMessages } from '../hooks/useToastMessages';

export default function Lesson() {
  const navigate = useNavigate();
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const toast = useToastMessages();
  const {
    lessons,
    setLessons,
    courseName,
    loading,
    currentLessonIndex,
    currentLesson,
    lessonItems,
    hasNextLesson,
    progressPercent,
  } = useLessonData({ courseId, lessonId });
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isStudyMode,
    sidebarTopPx,
    sectionRef,
    lessonContentRef,
    lessonMainRef,
    handleToggleStudyMode,
  } = useLessonLayout({ loading, lessonId, courseName });
  const {
    aiSelectedText,
    isAiAssistantOpen,
    handleAskAIAboutSelection,
    closeAiAssistant,
  } = useLessonAiAssistant({ lessonId });
  const { lessonQuiz, quizLoading, lessonQuizPassed } = useLessonQuiz({ courseId, currentLesson });
  const {
    actionLoading,
    actionError,
    handleMarkCompleted,
    handleNextLesson,
  } = useLessonProgressActions({
    courseId,
    currentLesson,
    currentLessonIndex,
    lessons,
    setLessons,
    navigate,
  });
  const {
    textNote,
    videoNotes,
    highlightNotes,
    activeHighlightNote,
    videoNoteDraft,
    setVideoNoteDraft,
    handleNoteSaved,
    handleNoteDeleted,
    handleSaveAiSummaryNote,
    handleAddVideoNote,
  } = useLessonNotes({ currentLesson, highlightText, aiSelectedText });
  const {
    flashcardCollections,
    flashcardCollectionLoading,
    flashcardSaving,
    flashcardUploadingMedia,
    flashcardDraft,
    updateFlashcardDraft,
    handleSaveSelectionFlashcard,
    closeFlashcardDraft,
    submitFlashcardDraft,
    uploadFlashcardMedia,
  } = useLessonFlashcards({ currentLesson, toast });

  const hasLessonMedia = Boolean(currentLesson?.video_url?.trim());
  const canMarkCurrentLessonComplete = lessonQuizPassed;
  const completeBlockedReason = lessonQuiz ? 'Pass the lesson quiz to unlock completion.' : undefined;

  useEffect(() => {
    if (!courseId || !lessonId || !currentLesson) return;
    if (Number(lessonId) !== currentLesson.lesson_id) {
      navigate(`/courses/${courseId}/lessons/${currentLesson.lesson_id}`, { replace: true });
    }
  }, [courseId, currentLesson, lessonId, navigate]);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'My Learning', path: '/courses' },
    { label: courseName || 'Course', path: courseId ? `/courses/${courseId}` : undefined },
    { label: currentLesson?.title || 'Lesson' },
  ];

  if (loading) {
    return <LessonStatusPage message="Loading lesson..." />;
  }

  if (!currentLesson) {
    return <LessonStatusPage message="Lesson not found" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />

      {!isStudyMode && (
        <LessonHeaderSection
          lesson={currentLesson}
          isSidebarOpen={isSidebarOpen}
          progressPercent={progressPercent}
          currentLessonNumber={currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1}
          totalLessons={lessons.length}
          sectionRef={sectionRef}
          onBackToCourse={() => navigate(`/courses/${courseId}`)}
          onToggleSidebar={() => setIsSidebarOpen((previous) => !previous)}
          onToggleStudyMode={handleToggleStudyMode}
        />
      )}

      <div className="flex flex-1 relative">
        <LessonSidebarPanels
          lessons={lessonItems}
          isOpen={isSidebarOpen}
          topPx={sidebarTopPx}
          onSelect={(selectedLessonId) => navigate(`/courses/${courseId}/lessons/${selectedLessonId}`)}
          onMobileSelect={(selectedLessonId) => {
            setIsSidebarOpen(false);
            navigate(`/courses/${courseId}/lessons/${selectedLessonId}`);
          }}
          onToggle={() => setIsSidebarOpen((previous) => !previous)}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main
          ref={lessonMainRef}
          className={
            isStudyMode
              ? 'fixed inset-0 z-[60] overflow-y-auto bg-surface-container-low transition-all duration-300'
              : `flex-1 bg-surface-container-low py-10 transition-all duration-300 md:py-12 ${isSidebarOpen ? 'md:ml-80' : 'md:ml-16'}`
          }
        >
          {isStudyMode && (
            <div className="sticky top-0 z-20 border-b border-outline-variant bg-surface/95 backdrop-blur">
              <Container className="max-w-none px-margin-mobile py-3 md:px-margin-desktop">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-label-md font-bold uppercase tracking-wide text-primary">Study mode</p>
                    <h1 className="truncate text-title-lg font-bold text-on-surface">{currentLesson.title}</h1>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleStudyMode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 font-bold text-on-surface hover:border-primary hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                    Exit study mode
                  </button>
                </div>
              </Container>
            </div>
          )}

          <Container className={isStudyMode ? 'max-w-none px-margin-mobile py-5 md:px-margin-desktop md:py-6' : ''}>
            <div
              className={
                isStudyMode
                  ? hasLessonMedia
                    ? 'mx-auto grid w-full max-w-[1600px] gap-6 xl:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.05fr)] xl:items-start'
                    : 'mx-auto flex w-full max-w-[940px] flex-col gap-6'
                  : 'mx-auto flex max-w-[860px] flex-col gap-6'
              }
            >
              {hasLessonMedia && (
                <section className={isStudyMode ? 'min-w-0 xl:self-start' : ''}>
                  <LessonMedia
                    lesson={currentLesson}
                    videoNotes={videoNotes}
                    onAddVideoNote={handleAddVideoNote}
                    onEditVideoNote={(note) => setVideoNoteDraft({ timestamp: note.video_timestamp_seconds ?? 0, note })}
                  />
                </section>
              )}

              <div className={isStudyMode && hasLessonMedia ? 'flex min-w-0 flex-col gap-6' : 'contents'}>
                <LessonContent
                  lesson={currentLesson}
                  isStudyMode={isStudyMode}
                  articleRef={lessonContentRef}
                  onAddHighlightNote={setHighlightText}
                  onSaveFlashcard={handleSaveSelectionFlashcard}
                  onAskAIAboutSelection={handleAskAIAboutSelection}
                  highlightNotes={highlightNotes}
                />

                <NoteComposer
                  lessonId={currentLesson.lesson_id}
                  noteType="text_note"
                  existingNote={textNote}
                  title="Lesson note"
                  placeholder="Grammar note, vocabulary tip, lesson summary..."
                  onSaved={handleNoteSaved}
                  onDeleted={handleNoteDeleted}
                />

              {highlightText && (
                <LessonNoteDialog
                  lessonId={currentLesson.lesson_id}
                  noteType="highlight"
                  selectedText={highlightText}
                  existingNote={activeHighlightNote}
                  title="Add highlight note"
                  onSaved={handleNoteSaved}
                  onDeleted={handleNoteDeleted}
                  onClose={() => setHighlightText(null)}
                />
              )}

              {videoNoteDraft && (
                <LessonNoteDialog
                  lessonId={currentLesson.lesson_id}
                  noteType="video_note"
                  videoTimestampSeconds={videoNoteDraft.timestamp ?? 0}
                  existingNote={videoNoteDraft.note}
                  title={videoNoteDraft.note ? 'Edit video note' : 'Add video note'}
                  onSaved={handleNoteSaved}
                  onDeleted={handleNoteDeleted}
                  onClose={() => setVideoNoteDraft(null)}
                />
              )}

              {flashcardDraft && (
                <LessonFlashcardDialog
                  lessonTitle={currentLesson.title}
                  draft={flashcardDraft}
                  collections={flashcardCollections}
                  collectionLoading={flashcardCollectionLoading}
                  saving={flashcardSaving}
                  uploadingMedia={flashcardUploadingMedia}
                  onUpdateDraft={updateFlashcardDraft}
                  onUploadMedia={(file, mediaKind) => void uploadFlashcardMedia(file, mediaKind)}
                  onSubmit={() => void submitFlashcardDraft()}
                  onClose={closeFlashcardDraft}
                />
              )}
                {quizLoading && (
                  <section className="rounded-xl border border-outline-variant bg-surface p-5 text-on-surface-variant shadow-sm">
                    Loading quizzes...
                  </section>
                )}

                {lessonQuiz && (
                  <section className={`rounded-xl border p-5 shadow-sm ${
                    lessonQuizPassed
                      ? 'border-success/40 bg-success-container'
                      : 'border-warning/40 bg-warning-container'
                  }`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className={`text-label-md font-bold uppercase tracking-wide ${
                          lessonQuizPassed ? 'text-on-success-container' : 'text-on-warning-container'
                        }`}>
                          {lessonQuizPassed ? 'Lesson quiz passed' : 'Lesson quiz required'}
                        </p>
                        <h3 className="mt-1 text-headline-sm font-bold text-on-surface">{lessonQuiz.title}</h3>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                          {lessonQuizPassed
                            ? 'You can retake this quiz anytime. Your completed lesson status will stay completed.'
                            : 'Pass this quiz in focus mode before marking the lesson complete.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/courses/${courseId}/lessons/${currentLesson.lesson_id}/quiz`)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary"
                      >
                        <span className="material-symbols-outlined">quiz</span>
                        {lessonQuizPassed ? 'Retake quiz' : 'Start quiz'}
                      </button>
                    </div>
                  </section>
                )}

              </div>

              <div
                className={
                  isStudyMode && hasLessonMedia
                    ? 'mx-auto w-full max-w-[900px] xl:col-span-2'
                    : 'w-full'
                }
              >
                {actionError && (
                  <p className="mb-3 rounded-lg bg-error-container px-4 py-3 text-on-error-container">{actionError}</p>
                )}
                <LessonActions
                  isCompleted={Boolean(currentLesson.is_completed)}
                  isCompleting={actionLoading === 'complete'}
                  isLoadingNext={actionLoading === 'next'}
                  hasNextLesson={hasNextLesson}
                  canMarkComplete={canMarkCurrentLessonComplete}
                  completeBlockedReason={completeBlockedReason}
                  onMarkCompleted={handleMarkCompleted}
                  onNextLesson={handleNextLesson}
                />
              </div>
            </div>
          </Container>
        </main>
      </div>

      {isAiAssistantOpen && (
        <LessonAiAssistantModal
          lesson={currentLesson}
          selectedText={aiSelectedText}
          onClose={closeAiAssistant}
          onSaveAnswer={handleSaveAiSummaryNote}
        />
      )}

      <Footer />
    </div>
  );
}
