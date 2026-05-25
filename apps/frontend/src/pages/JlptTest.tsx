import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  JlptBreakView,
  JlptFocusView,
  JlptIntroView,
  JlptLoadingView,
  JlptUnavailableView,
  sectionLabels,
} from '../components/jlpt';
import { useJlptTestController } from '../hooks/jlpt/useJlptTestController';

export default function JlptTest() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const numericExamId = Number(examId);
  const controller = useJlptTestController(numericExamId);
  const {
    exam,
    loading,
    error,
    phase,
    activeSectionIndex,
    remainingSeconds,
    startExam,
    startSection,
  } = controller;

  if (!Number.isFinite(numericExamId)) return <Navigate to="/tests" replace />;

  if (loading) {
    return <JlptLoadingView />;
  }

  if (error || !exam || exam.sections.length === 0) {
    return (
      <JlptUnavailableView
        message={error || 'This test has no available sections.'}
        onBack={() => navigate('/tests')}
      />
    );
  }

  if (phase === 'intro') {
    return (
      <JlptIntroView
        exam={exam}
        onStart={startExam}
        onBack={() => navigate('/tests')}
      />
    );
  }

  if (phase === 'break') {
    const nextSection = exam.sections[activeSectionIndex + 1];

    return (
      <JlptBreakView
        nextSectionTitle={nextSection?.title || sectionLabels[nextSection?.section_type ?? '']}
        remainingSeconds={remainingSeconds}
        onStartNext={() => startSection(activeSectionIndex + 1)}
      />
    );
  }

  return (
    <JlptFocusView
      controller={controller}
      onExit={() => navigate('/tests')}
    />
  );
}
