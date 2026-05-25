import type { LearningGoalPeriod, LearningGoalType } from '../../services/api';

export type ProfileTab = 'overview' | 'progress' | 'goals' | 'achievements';

export type ProfileFormValues = {
  username: string;
  email: string;
  avatarUrl: string;
};

export type GoalFormValues = {
  goalType: LearningGoalType;
  goalTarget: number;
  goalPeriod: LearningGoalPeriod;
};

export const goalTypeLabels: Record<LearningGoalType, string> = {
  lessons_per_day: 'Lessons per day',
  quizzes_per_day: 'Quizzes per day',
  study_minutes_per_day: 'Study minutes per day',
  jlpt_tests_per_week: 'JLPT tests per week',
};
