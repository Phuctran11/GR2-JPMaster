import { useNavigate, useParams } from 'react-router-dom';
import {
  QuizFocusLoadingView,
  QuizFocusStartView,
  QuizFocusUnavailableView,
  QuizFocusView,
} from '../components/quiz';
import { useQuizFocusController } from '../hooks/quiz/useQuizFocusController';

export default function QuizFocus() {
  const navigate = useNavigate();
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId?: string }>();
  const controller = useQuizFocusController({ courseId, lessonId });
  const {
    isFinalTest,
    quiz,
    loading,
    error,
    readyToStart,
    startFinalTest,
    handleExit,
  } = controller;

  if (isFinalTest && !readyToStart) {
    return (
      <QuizFocusStartView
        onStart={startFinalTest}
        onBack={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}
      />
    );
  }

  if (loading) {
    return <QuizFocusLoadingView />;
  }

  if (error || !quiz) {
    return (
      <QuizFocusUnavailableView
        message={error || 'Quiz not found.'}
        onBack={handleExit}
      />
    );
  }

  return <QuizFocusView controller={controller} />;
}
