import { useEffect, useMemo, useState } from 'react';
import type { UseFormReset } from 'react-hook-form';
import type { NavigateFunction } from 'react-router-dom';
import {
  achievementAPI,
  analyticsAPI,
  enrollmentAPI,
  goalAPI,
  userAPI,
  type Achievement,
  type AnalyticsAttempt,
  type AnalyticsSummary,
  type EnrolledCourse,
  type LearningGoal,
  type StudyTimePoint,
  type UserProfile,
} from '../../services/api';
import type { User } from '../../contexts/AuthContext';
import {
  getAchievementTracks,
  getEffectiveStatus,
  type AchievementTrack,
  type ProfileFormValues,
} from '../../components/profile';

type UseProfilePageDataParams = {
  user: User | null;
  authLoading: boolean;
  resetProfile: UseFormReset<ProfileFormValues>;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  navigate: NavigateFunction;
};

export function useProfilePageData({
  user,
  authLoading,
  resetProfile,
  addToast,
  navigate,
}: UseProfilePageDataParams) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [studyTime, setStudyTime] = useState<StudyTimePoint[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<AnalyticsAttempt[]>([]);
  const [jlptAttempts, setJlptAttempts] = useState<AnalyticsAttempt[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementFilter, setAchievementFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      addToast('Please log in to view your profile', 'error');
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [profileResult, enrollmentResult] = await Promise.all([
          userAPI.getMe(),
          enrollmentAPI.getMyCourses(100, 0),
        ]);
        const [summaryResult, studyTimeResult, quizResult, jlptResult, goalResult, achievementResult] = await Promise.all([
          analyticsAPI.getSummary(),
          analyticsAPI.getStudyTime('30d'),
          analyticsAPI.getQuizPerformance(),
          analyticsAPI.getJlptPerformance(),
          goalAPI.getGoals(),
          achievementAPI.getMine(),
        ]);

        setProfile(profileResult.data);
        resetProfile({
          username: profileResult.data.username,
          email: profileResult.data.email,
          avatarUrl: profileResult.data.avatar_url ?? '',
        });
        setEnrollments(enrollmentResult.data);
        setSummary(summaryResult.data);
        setStudyTime(studyTimeResult.data);
        setQuizAttempts(quizResult.data);
        setJlptAttempts(jlptResult.data);
        setGoals(goalResult.data);
        setAchievements(achievementResult.data);
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [addToast, authLoading, navigate, resetProfile, user]);

  const completedCourses = useMemo(() => {
    return enrollments.filter((enrollment) => getEffectiveStatus(enrollment) === 'completed');
  }, [enrollments]);

  const activeCourses = useMemo(() => {
    return enrollments.filter((enrollment) => getEffectiveStatus(enrollment) === 'active');
  }, [enrollments]);

  const achievementTracks = useMemo<AchievementTrack[]>(() => getAchievementTracks(achievements), [achievements]);
  const filteredAchievementTracks = useMemo(() => {
    if (achievementFilter === 'all') return achievementTracks;
    return achievementTracks.filter((track) => track.key === achievementFilter);
  }, [achievementFilter, achievementTracks]);

  return {
    profile,
    setProfile,
    enrollments,
    loading,
    summary,
    studyTime,
    quizAttempts,
    jlptAttempts,
    goals,
    setGoals,
    achievements,
    achievementFilter,
    setAchievementFilter,
    completedCourses,
    activeCourses,
    achievementTracks,
    filteredAchievementTracks,
  };
}
