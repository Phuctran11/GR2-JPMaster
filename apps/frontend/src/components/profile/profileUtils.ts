import type {
  Achievement,
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

export const tierStyles: Record<Achievement['tier'], { shell: string; icon: string; label: string; accent: string; glow: string }> = {
  bronze: {
    shell: "border-[#b8784d]/45 bg-[#b8784d]/10 ring-1 ring-[#b8784d]/15 [html[data-theme='dark']_&]:border-[#d9905b]/55 [html[data-theme='dark']_&]:bg-[#2a1711] [html[data-theme='dark']_&]:ring-[#d9905b]/25",
    icon: "bg-[#b8784d] text-white shadow-sm shadow-[#b8784d]/30 [html[data-theme='dark']_&]:bg-gradient-to-br [html[data-theme='dark']_&]:from-[#e19a62] [html[data-theme='dark']_&]:to-[#9a5b37] [html[data-theme='dark']_&]:shadow-[#d9905b]/35",
    label: "text-[#8a4f2f] [html[data-theme='dark']_&]:text-[#f3b37f]",
    accent: "bg-[#b8784d] [html[data-theme='dark']_&]:bg-gradient-to-r [html[data-theme='dark']_&]:from-[#f3b37f] [html[data-theme='dark']_&]:to-[#b8784d]",
    glow: 'shadow-[#b8784d]/15',
  },
  silver: {
    shell: "border-slate-300 bg-slate-100/90 ring-1 ring-slate-300/30 [html[data-theme='dark']_&]:border-slate-300/55 [html[data-theme='dark']_&]:bg-gradient-to-br [html[data-theme='dark']_&]:from-slate-800 [html[data-theme='dark']_&]:via-slate-900 [html[data-theme='dark']_&]:to-slate-950 [html[data-theme='dark']_&]:ring-slate-300/25",
    icon: "bg-slate-600 text-white shadow-sm shadow-slate-400/30 [html[data-theme='dark']_&]:bg-gradient-to-br [html[data-theme='dark']_&]:from-slate-200 [html[data-theme='dark']_&]:to-slate-500 [html[data-theme='dark']_&]:text-slate-950 [html[data-theme='dark']_&]:shadow-slate-200/30",
    label: "text-slate-700 [html[data-theme='dark']_&]:text-slate-100",
    accent: "bg-slate-600 [html[data-theme='dark']_&]:bg-gradient-to-r [html[data-theme='dark']_&]:from-slate-100 [html[data-theme='dark']_&]:via-slate-300 [html[data-theme='dark']_&]:to-slate-500",
    glow: "shadow-slate-400/20 [html[data-theme='dark']_&]:shadow-slate-200/20",
  },
  gold: {
    shell: "border-[#d6a21e]/55 bg-[#fff4c2]/70 ring-1 ring-[#f4c84f]/25 [html[data-theme='dark']_&]:border-[#f7c948]/55 [html[data-theme='dark']_&]:bg-[#241b08] [html[data-theme='dark']_&]:ring-[#f7c948]/25",
    icon: "bg-[#d6a21e] text-white shadow-sm shadow-[#d6a21e]/35 [html[data-theme='dark']_&]:bg-gradient-to-br [html[data-theme='dark']_&]:from-[#fde68a] [html[data-theme='dark']_&]:to-[#d6a21e] [html[data-theme='dark']_&]:text-slate-950 [html[data-theme='dark']_&]:shadow-[#f7c948]/35",
    label: "text-[#936600] [html[data-theme='dark']_&]:text-[#fde68a]",
    accent: "bg-[#d6a21e] [html[data-theme='dark']_&]:bg-gradient-to-r [html[data-theme='dark']_&]:from-[#fde68a] [html[data-theme='dark']_&]:to-[#d6a21e]",
    glow: 'shadow-[#d6a21e]/25',
  },
  platinum: {
    shell: "border-[#7d8da1]/55 bg-[#eef7fb]/85 ring-1 ring-[#9fd9ea]/35 [html[data-theme='dark']_&]:border-[#9fd9ea]/55 [html[data-theme='dark']_&]:bg-[#081923] [html[data-theme='dark']_&]:ring-[#9fd9ea]/30",
    icon: "bg-[#51677f] text-white shadow-sm shadow-[#6faec4]/35 [html[data-theme='dark']_&]:bg-gradient-to-br [html[data-theme='dark']_&]:from-[#b7f0ff] [html[data-theme='dark']_&]:to-[#51677f] [html[data-theme='dark']_&]:text-slate-950 [html[data-theme='dark']_&]:shadow-[#9fd9ea]/35",
    label: "text-[#36566d] [html[data-theme='dark']_&]:text-[#b7f0ff]",
    accent: "bg-[#51677f] [html[data-theme='dark']_&]:bg-gradient-to-r [html[data-theme='dark']_&]:from-[#b7f0ff] [html[data-theme='dark']_&]:to-[#51677f]",
    glow: 'shadow-[#6faec4]/25',
  },
};

const achievementTrackLabels: Record<string, { title: string; icon: string }> = {
  completed_lessons: { title: 'Lesson completion', icon: 'menu_book' },
  completed_quizzes: { title: 'Quiz practice', icon: 'quiz' },
  total_study_minutes: { title: 'Study time', icon: 'timer' },
  completed_goal_days: { title: 'Goal consistency', icon: 'flag' },
  completed_jlpt_tests: { title: 'JLPT training', icon: 'language' },
  score_at_least: { title: 'Score mastery', icon: 'military_tech' },
};

export type AchievementTrack = {
  key: string;
  title: string;
  icon: string;
  items: Achievement[];
};

export const getAchievementTracks = (achievements: Achievement[]): AchievementTrack[] => {
  const groups = achievements.reduce<Record<string, Achievement[]>>((accumulator, achievement) => {
    const key = achievement.condition_key;
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(achievement);
    return accumulator;
  }, {});

  return Object.entries(groups).map(([key, items]) => {
    const label = achievementTrackLabels[key] ?? { title: key.replaceAll('_', ' '), icon: 'workspace_premium' };
    return {
      key,
      title: label.title,
      icon: label.icon,
      items: items.slice().sort((a, b) => a.condition_value - b.condition_value),
    };
  });
};
