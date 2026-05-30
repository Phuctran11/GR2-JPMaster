import type {
  AnalyticsAttempt,
  EnrolledCourse,
  LearningGoal,
} from '../../services/api';

export const formatDate = (value?: string) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getEffectiveStatus = (enrollment: EnrolledCourse): 'active' | 'completed' | 'dropped' => {
  return enrollment.status;
};

export const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const formatCompactDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const averageScore = (attempts: AnalyticsAttempt[]) => {
  const scores = attempts.map((attempt) => attempt.score).filter((score): score is number => typeof score === 'number');
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

export const getGoalVisualState = (goal: LearningGoal) => {
  if (!goal.is_active) {
    return {
      label: 'Disabled',
      icon: 'pause_circle',
      card: 'border-outline-variant bg-surface-container-low opacity-75',
      badge: 'border-outline-variant bg-surface text-on-surface-variant',
      iconShell: 'bg-outline-variant/35 text-on-surface-variant',
      progress: 'bg-outline-variant',
    };
  }

  if (goal.completed_today) {
    return {
      label: 'Completed',
      icon: 'check_circle',
      card: 'border-emerald-300 bg-emerald-50 shadow-sm',
      badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
      iconShell: 'bg-emerald-600 text-white',
      progress: 'bg-emerald-600',
    };
  }

  return {
    label: 'In progress',
    icon: 'radio_button_unchecked',
    card: 'border-amber-300 bg-amber-50 shadow-sm',
    badge: 'border-amber-300 bg-amber-100 text-amber-800',
    iconShell: 'bg-amber-500 text-on-surface',
    progress: 'bg-amber-500',
  };
};
