import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Section, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
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
  type LearningGoalPeriod,
  type LearningGoalType,
  type StudyTimePoint,
  type UserProfile,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const formatDate = (value?: string) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getEffectiveStatus = (enrollment: EnrolledCourse): 'active' | 'completed' | 'dropped' => {
  return enrollment.status;
};

type ProfileTab = 'overview' | 'progress' | 'goals' | 'achievements';

const profileTabs: Array<{ id: ProfileTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'person' },
  { id: 'progress', label: 'Progress', icon: 'monitoring' },
  { id: 'goals', label: 'Goals', icon: 'flag' },
  { id: 'achievements', label: 'Achievements', icon: 'workspace_premium' },
];

const goalTypeLabels: Record<LearningGoalType, string> = {
  lessons_per_day: 'Lessons per day',
  quizzes_per_day: 'Quizzes per day',
  study_minutes_per_day: 'Study minutes per day',
  jlpt_tests_per_week: 'JLPT tests per week',
};

const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatCompactDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const averageScore = (attempts: AnalyticsAttempt[]) => {
  const scores = attempts.map((attempt) => attempt.score).filter((score): score is number => typeof score === 'number');
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

const tierStyles: Record<Achievement['tier'], { shell: string; icon: string; label: string; accent: string }> = {
  bronze: {
    shell: 'border-[#b8784d]/35 bg-[#b8784d]/10',
    icon: 'bg-[#b8784d] text-white',
    label: 'text-[#8a4f2f]',
    accent: 'bg-[#b8784d]',
  },
  silver: {
    shell: 'border-slate-300 bg-slate-100',
    icon: 'bg-slate-500 text-white',
    label: 'text-slate-600',
    accent: 'bg-slate-500',
  },
  gold: {
    shell: 'border-yellow-500/40 bg-yellow-500/10',
    icon: 'bg-yellow-500 text-on-surface',
    label: 'text-yellow-700',
    accent: 'bg-yellow-500',
  },
  platinum: {
    shell: 'border-cyan-500/35 bg-cyan-500/10',
    icon: 'bg-cyan-600 text-white',
    label: 'text-cyan-700',
    accent: 'bg-cyan-600',
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

type AchievementTrack = {
  key: string;
  title: string;
  icon: string;
  items: Achievement[];
};

const getAchievementTracks = (achievements: Achievement[]): AchievementTrack[] => {
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

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [studyTime, setStudyTime] = useState<StudyTimePoint[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<AnalyticsAttempt[]>([]);
  const [jlptAttempts, setJlptAttempts] = useState<AnalyticsAttempt[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goalType, setGoalType] = useState<LearningGoalType>('lessons_per_day');
  const [goalTarget, setGoalTarget] = useState(2);
  const [goalPeriod, setGoalPeriod] = useState<LearningGoalPeriod>('daily');
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
        setUsername(profileResult.data.username);
        setEmail(profileResult.data.email);
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
  }, [addToast, authLoading, navigate, user]);

  const completedCourses = useMemo(() => {
    return enrollments.filter((enrollment) => getEffectiveStatus(enrollment) === 'completed');
  }, [enrollments]);

  const activeCourses = useMemo(() => {
    return enrollments.filter((enrollment) => getEffectiveStatus(enrollment) === 'active');
  }, [enrollments]);

  const achievementTracks = useMemo(() => getAchievementTracks(achievements), [achievements]);
  const filteredAchievementTracks = useMemo(() => {
    if (achievementFilter === 'all') return achievementTracks;
    return achievementTracks.filter((track) => track.key === achievementFilter);
  }, [achievementFilter, achievementTracks]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextUsername = username.trim();
    const nextEmail = email.trim().toLowerCase();

    if (!nextUsername || !nextEmail) {
      addToast('Username and email are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await userAPI.updateMe({
        username: nextUsername,
        email: nextEmail,
      });

      setProfile(result.data);
      setUsername(result.data.username);
      setEmail(result.data.email);
      updateUser({
        user_id: result.data.user_id,
        username: result.data.username,
        email: result.data.email,
        role: result.data.role,
      });
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const created = await goalAPI.createGoal({ goal_type: goalType, target_value: Number(goalTarget), period: goalPeriod });
      setGoals((current) => [created.data, ...current]);
      addToast('Goal created successfully', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to create goal', 'error');
    }
  };

  const handleDisableGoal = async (goalId: number) => {
    try {
      await goalAPI.deleteGoal(goalId);
      setGoals((current) => current.map((goal) => goal.goal_id === goalId ? { ...goal, is_active: false } : goal));
      addToast('Goal disabled', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to disable goal', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Profile' },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Profile unavailable</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Section bgColor="light">
          <Container>
            <div className="mb-section-gap grid grid-cols-1 gap-8 lg:grid-cols-12">
              <aside className="lg:col-span-4">
                <Card className="overflow-hidden border border-outline-variant bg-surface">
                  <div className="bg-gradient-to-br from-primary to-secondary p-8 text-on-primary">
                    <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/40 bg-white/15 text-display-md font-bold shadow-xl">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <Heading level="h1" size="headline-lg" className="text-on-primary">
                      {profile.username}
                    </Heading>
                    <p className="mt-2 text-label-md text-white/85 break-all">{profile.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-6">
                    <div className="rounded-xl border border-outline-variant bg-primary-fixed/20 p-4">
                      <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Completed</p>
                      <p className="mt-2 text-headline-md font-bold text-primary">{completedCourses.length}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-secondary-container/30 p-4">
                      <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">In progress</p>
                      <p className="mt-2 text-headline-md font-bold text-primary">{activeCourses.length}</p>
                    </div>
                    <div className="col-span-2 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                      <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Member since</p>
                      <p className="mt-2 text-title-md font-bold text-on-surface">{formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                </Card>
              </aside>

              <div className="space-y-8 lg:col-span-8">
                <div className="flex w-full items-center gap-5 overflow-x-auto rounded-xl border border-outline-variant bg-surface px-6 py-2">
                  {profileTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-title-sm font-bold transition-colors ${
                        activeTab === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' && (
                <>
                <Card className="p-6 md:p-8 border border-outline-variant">
                  <div className="mb-6">
                    <Heading level="h2" size="headline-lg" className="text-primary">
                      Basic Information
                    </Heading>
                    <Text variant="body-md" color="on-surface-variant" className="mt-2">
                      Update your display name and contact email.
                    </Text>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="username" className="mb-2 block text-label-lg font-bold text-on-surface">
                        Username
                      </label>
                      <input
                        id="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-label-lg font-bold text-on-surface">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card className="p-6 md:p-8 border border-outline-variant">
                  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <Heading level="h2" size="headline-lg" className="text-primary">
                        Certifications
                      </Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-2">
                        Certificates earned from completed courses.
                      </Text>
                    </div>
                    <Link to="/courses" className="text-label-md font-bold text-primary hover:underline">
                      View My Learning
                    </Link>
                  </div>

                  {completedCourses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
                      <span className="material-symbols-outlined text-[56px] text-outline">workspace_premium</span>
                      <Text variant="body-md" color="on-surface-variant" className="mt-3">
                        Complete a course to unlock your first certificate.
                      </Text>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {completedCourses.map((enrollment) => (
                        <div
                          key={enrollment.enrollment_id}
                          className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary-container/40 to-surface p-5 shadow-sm"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-label-sm font-black uppercase tracking-wide text-secondary">Certified Course</p>
                              <h3 className="mt-2 text-title-lg font-bold text-on-surface">{enrollment.course.title}</h3>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                              <span className="material-symbols-outlined">verified</span>
                            </div>
                          </div>
                          <div className="mb-4 grid grid-cols-2 gap-3 text-label-md">
                            <div className="rounded-xl bg-white/70 p-3">
                              <p className="font-bold text-on-surface-variant">Progress</p>
                              <p className="text-primary font-bold">{enrollment.progress_percent ?? 100}%</p>
                            </div>
                            <div className="rounded-xl bg-white/70 p-3">
                              <p className="font-bold text-on-surface-variant">Enrolled</p>
                              <p className="text-primary font-bold">{formatDate(enrollment.enrollment_date)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => navigate(`/courses/${enrollment.course_id}/certificate`)}
                            className="w-full"
                          >
                            View Certificate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                </>
                )}

                {activeTab === 'progress' && (
                  <Card className="overflow-hidden border border-outline-variant">
                    <div className="border-b border-outline-variant bg-surface-container-low p-5 md:p-8">
                      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] xl:items-end">
                        <div>
                          <p className="text-label-md font-black uppercase tracking-wide text-secondary">Learning analytics</p>
                          <Heading level="h2" size="headline-lg" className="mt-2 text-primary">Progress Dashboard</Heading>
                          <Text variant="body-md" color="on-surface-variant" className="mt-2">
                            Study time is calculated from completed lesson durations and resets into weekly and monthly cycles.
                          </Text>
                        </div>
                        <StudyTimeOverview summary={summary} />
                      </div>
                    </div>
                    <div className="space-y-6 p-5 md:p-8">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ProgressMetric label="Completed lessons" value={summary?.completed_lessons ?? 0} icon="menu_book" />
                      <ProgressMetric label="Quiz avg score" value={`${Math.round(summary?.average_quiz_score ?? averageScore(quizAttempts))}%`} icon="quiz" />
                      <ProgressMetric label="JLPT avg score" value={`${Math.round(summary?.average_jlpt_score ?? averageScore(jlptAttempts))}%`} icon="language" />
                      <ProgressMetric label="Active courses" value={summary?.active_courses ?? 0} icon="school" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                      <StudyTimeChart points={studyTime} />
                      <CourseProgressPanel enrollments={enrollments} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <ScoreAnalysisCard
                        title="Quiz analysis"
                        icon="quiz"
                        attempts={quizAttempts}
                        average={summary?.average_quiz_score ?? averageScore(quizAttempts)}
                        count={summary?.quiz_attempts ?? quizAttempts.length}
                      />
                      <ScoreAnalysisCard
                        title="JLPT test analysis"
                        icon="language"
                        attempts={jlptAttempts}
                        average={summary?.average_jlpt_score ?? averageScore(jlptAttempts)}
                        count={summary?.jlpt_attempts ?? jlptAttempts.length}
                      />
                    </div>
                    </div>
                  </Card>
                )}

                {activeTab === 'goals' && (
                  <Card className="p-6 md:p-8 border border-outline-variant">
                    <div className="mb-6">
                      <Heading level="h2" size="headline-lg" className="text-primary">Personal Goals</Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-2">Set daily or weekly learning targets.</Text>
                    </div>
                    <form onSubmit={handleCreateGoal} className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 md:grid-cols-[1fr_120px_120px_auto]">
                      <select className="rounded-lg border border-outline-variant bg-surface px-3 py-2" value={goalType} onChange={(e) => setGoalType(e.target.value as LearningGoalType)}>
                        {Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" type="number" min="1" value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} />
                      <select className="rounded-lg border border-outline-variant bg-surface px-3 py-2" value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value as LearningGoalPeriod)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <Button type="submit">Add Goal</Button>
                    </form>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {goals.map((goal) => (
                        <div key={goal.goal_id} className={`rounded-xl border p-4 ${goal.is_active ? 'border-primary/25 bg-primary/5' : 'border-outline-variant bg-surface-container-low opacity-70'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-title-md font-bold text-on-surface">{goalTypeLabels[goal.goal_type]}</h3>
                              <p className="text-body-md text-on-surface-variant">{goal.current_value ?? 0} / {goal.target_value} {goal.period}</p>
                            </div>
                            {goal.completed_today && <span className="material-symbols-outlined text-primary">check_circle</span>}
                          </div>
                          <div className="mt-4 h-2 rounded-full bg-surface-container">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((goal.current_value ?? 0) / goal.target_value) * 100)}%` }} />
                          </div>
                          {goal.is_active && (
                            <button type="button" className="mt-3 text-label-md font-semibold text-error" onClick={() => handleDisableGoal(goal.goal_id)}>Disable</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {activeTab === 'achievements' && (
                  <Card className="p-6 md:p-8 border border-outline-variant">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <Heading level="h2" size="headline-lg" className="text-primary">Achievements</Heading>
                        <Text variant="body-md" color="on-surface-variant" className="mt-2">Collect tiered badges as you build strong study habits.</Text>
                      </div>
                      <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-right">
                        <p className="text-headline-sm font-bold text-primary">{achievements.filter((item) => item.earned_at).length}/{achievements.length}</p>
                        <p className="text-label-md text-on-surface-variant">earned</p>
                      </div>
                    </div>
                    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
                        <div key={tier} className={`rounded-xl border p-3 ${tierStyles[tier].shell}`}>
                          <p className={`text-label-sm font-black uppercase ${tierStyles[tier].label}`}>{tier}</p>
                          <p className="mt-2 text-headline-sm font-bold text-on-surface">
                            {achievements.filter((item) => item.tier === tier && item.earned_at).length}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6 overflow-x-auto">
                      <div className="flex min-w-max gap-2">
                        <button
                          type="button"
                          onClick={() => setAchievementFilter('all')}
                          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-label-md font-bold transition-colors ${
                            achievementFilter === 'all'
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">apps</span>
                          All
                        </button>
                        {achievementTracks.map((track) => (
                          <button
                            key={track.key}
                            type="button"
                            onClick={() => setAchievementFilter(track.key)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-label-md font-bold transition-colors ${
                              achievementFilter === track.key
                                ? 'border-primary bg-primary text-on-primary'
                                : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{track.icon}</span>
                            {track.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {filteredAchievementTracks.map((track) => (
                        <AchievementLevelCard key={track.key} track={track} />
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function StudyTimeOverview({ summary }: { summary: AnalyticsSummary | null }) {
  const totalSeconds = summary?.total_study_seconds ?? 0;
  const weekSeconds = summary?.study_seconds_this_week ?? 0;
  const monthSeconds = summary?.study_seconds_this_month ?? 0;
  const monthPercent = totalSeconds > 0 ? Math.min(100, Math.round((monthSeconds / totalSeconds) * 100)) : 0;
  const weekPercent = monthSeconds > 0 ? Math.min(100, Math.round((weekSeconds / monthSeconds) * 100)) : 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="rounded-lg bg-primary text-on-primary p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label-md font-bold uppercase tracking-wide text-on-primary/80">Total study time</p>
            <span className="material-symbols-outlined text-[22px]">timer</span>
          </div>
          <p className="mt-3 text-headline-md font-black">{formatMinutes(totalSeconds)}</p>
          <p className="mt-1 text-label-md text-on-primary/85">From completed lessons</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <p className="text-label-md font-bold text-on-surface-variant">This week</p>
          <p className="mt-2 text-headline-sm font-black text-primary">{formatMinutes(weekSeconds)}</p>
          <div className="mt-3 h-2 rounded-full bg-surface">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${weekPercent}%` }} />
          </div>
          <p className="mt-2 text-label-md text-on-surface-variant">{weekPercent}% of this month</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <p className="text-label-md font-bold text-on-surface-variant">This month</p>
          <p className="mt-2 text-headline-sm font-black text-primary">{formatMinutes(monthSeconds)}</p>
          <div className="mt-3 h-2 rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: `${monthPercent}%` }} />
          </div>
          <p className="mt-2 text-label-md text-on-surface-variant">{monthPercent}% of total</p>
        </div>
      </div>
    </div>
  );
}

function ProgressMetric({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-headline-sm font-bold text-on-surface">{value}</p>
          <p className="mt-1 text-label-md text-on-surface-variant">{label}</p>
        </div>
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
    </div>
  );
}

function AttemptList({ title, attempts }: { title: string; attempts: AnalyticsAttempt[] }) {
  return (
    <div className="mt-6 rounded-xl border border-outline-variant bg-surface p-4">
      <h3 className="mb-3 text-title-md font-bold text-on-surface">{title}</h3>
      {attempts.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No attempts yet.</p>
      ) : (
        <div className="space-y-3">
          {attempts.slice(0, 5).map((attempt) => (
            <div key={attempt.attempt_id} className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3">
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-on-surface">{attempt.title}</p>
                <p className="text-label-md text-on-surface-variant">{formatDate(attempt.submitted_at || attempt.started_at)}</p>
              </div>
              <p className="text-title-md font-bold text-primary">{attempt.score ?? 0}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudyTimeChart({ points }: { points: StudyTimePoint[] }) {
  const maxSeconds = Math.max(...points.map((item) => item.duration_seconds), 1);
  const totalSeconds = points.reduce((sum, item) => sum + item.duration_seconds, 0);
  const activeDays = points.filter((item) => item.duration_seconds > 0).length;
  const averageSeconds = activeDays ? Math.round(totalSeconds / activeDays) : 0;
  const peakPoint = points.reduce<StudyTimePoint | null>((peak, point) => {
    if (!peak || point.duration_seconds > peak.duration_seconds) return point;
    return peak;
  }, null);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">monitoring</span>
            <h3 className="text-title-md font-bold text-on-surface">Study time trend</h3>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">Completed lesson duration by day over the last 30 days.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-left sm:text-right">
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{formatMinutes(totalSeconds)}</p>
            <p className="text-label-md text-on-surface-variant">Total</p>
          </div>
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{formatMinutes(averageSeconds)}</p>
            <p className="text-label-md text-on-surface-variant">Daily avg</p>
          </div>
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{peakPoint ? formatMinutes(peakPoint.duration_seconds) : '0 min'}</p>
            <p className="text-label-md text-on-surface-variant">Best day</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface-container-low p-3">
        <div className="flex h-52 min-w-[620px] items-end gap-1">
          {points.map((point, index) => {
            const isActive = point.duration_seconds > 0;
            const showLabel = index === 0 || index === points.length - 1 || index % 7 === 0;
            return (
              <div key={point.study_date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-md bg-surface/45 px-0.5">
                  <div
                    title={`${formatDate(point.study_date)}: ${formatMinutes(point.duration_seconds)}`}
                    className={`w-full rounded-t transition-all hover:scale-y-105 ${isActive ? 'bg-primary hover:bg-secondary' : 'bg-outline-variant/50'}`}
                    style={{ height: `${isActive ? Math.max(8, (point.duration_seconds / maxSeconds) * 100) : 4}%` }}
                  />
                </div>
                <span className="h-4 text-[10px] font-semibold text-on-surface-variant">
                  {showLabel ? formatCompactDate(point.study_date) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-label-md text-on-surface-variant sm:grid-cols-3">
        <div className="rounded-lg bg-surface-container-low px-3 py-2">
          <span className="font-bold text-on-surface">{activeDays}</span> active days
        </div>
        <div className="rounded-lg bg-surface-container-low px-3 py-2">
          Peak: <span className="font-bold text-on-surface">{peakPoint ? formatCompactDate(peakPoint.study_date) : 'None'}</span>
        </div>
        <div className="rounded-lg bg-surface-container-low px-3 py-2">
          Range: <span className="font-bold text-on-surface">{points[0] ? formatCompactDate(points[0].study_date) : ''}</span>
          {' - '}
          <span className="font-bold text-on-surface">{points[points.length - 1] ? formatCompactDate(points[points.length - 1].study_date) : ''}</span>
        </div>
      </div>
    </div>
  );
}

function CourseProgressPanel({ enrollments }: { enrollments: EnrolledCourse[] }) {
  const visibleCourses = enrollments.slice(0, 5);
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.progress_percent ?? 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            <h3 className="text-title-md font-bold text-on-surface">Course completion</h3>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">Progress by enrolled course.</p>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-right">
          <p className="text-title-md font-bold text-primary">{averageProgress}%</p>
          <p className="text-label-md text-on-surface-variant">Average</p>
        </div>
      </div>
      {visibleCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-on-surface-variant">
          Enroll in a course to see progress analysis.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCourses.map((enrollment) => {
            const progress = enrollment.progress_percent ?? 0;
            return (
              <div key={enrollment.enrollment_id}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate text-body-md font-semibold text-on-surface">{enrollment.course.title}</p>
                  <span className="text-label-md font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-surface-container-low">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreTrendLine({ attempts }: { attempts: AnalyticsAttempt[] }) {
  const points = attempts
    .filter((attempt) => typeof attempt.score === 'number')
    .slice()
    .reverse()
    .slice(-8);
  const width = 320;
  const height = 120;
  const padding = 18;

  if (points.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl bg-surface-container-low text-body-md text-on-surface-variant">
        No score data yet.
      </div>
    );
  }

  const coordinates = points.map((attempt, index) => {
    const x = points.length === 1 ? width / 2 : padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((attempt.score ?? 0) / 100) * (height - padding * 2);
    return { x, y, score: attempt.score ?? 0, title: attempt.title };
  });
  const pathData = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label="Score trend line chart">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-outline-variant" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-outline-variant" />
        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
        {coordinates.map((point, index) => (
          <g key={`${point.title}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" className="fill-secondary stroke-surface" strokeWidth="2">
              <title>{`${point.title}: ${point.score}%`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-label-md text-on-surface-variant">
        <span>Oldest</span>
        <span>Score %</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

function ScoreAnalysisCard({
  title,
  icon,
  attempts,
  average,
  count,
}: {
  title: string;
  icon: string;
  attempts: AnalyticsAttempt[];
  average: number;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{icon}</span>
            <h3 className="text-title-md font-bold text-on-surface">{title}</h3>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">Average score and recent score trend.</p>
        </div>
        <div className="text-right">
          <p className="text-headline-sm font-bold text-primary">{Math.round(average)}%</p>
          <p className="text-label-md text-on-surface-variant">{count} attempts</p>
        </div>
      </div>
      <ScoreTrendLine attempts={attempts} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-label-md text-on-surface-variant">Best score</p>
          <p className="text-title-md font-bold text-primary">{Math.max(0, ...attempts.map((attempt) => attempt.score ?? 0))}%</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-label-md text-on-surface-variant">Latest score</p>
          <p className="text-title-md font-bold text-primary">{attempts[0]?.score ?? 0}%</p>
        </div>
      </div>
      <AttemptList title="Recent attempts" attempts={attempts} />
    </div>
  );
}

function AchievementLevelCard({ track }: { track: AchievementTrack }) {
  const defaultIndex = track.items.reduce((latestIndex, achievement, index) => {
    return achievement.earned_at ? index : latestIndex;
  }, 0);
  const [levelIndex, setLevelIndex] = useState(defaultIndex);
  const achievement = track.items[levelIndex] ?? track.items[0];
  const earned = Boolean(achievement.earned_at);
  const styles = tierStyles[achievement.tier];
  const progressPercent = Math.min(100, (achievement.current_value / achievement.condition_value) * 100);
  const canGoPrevious = levelIndex > 0;
  const canGoNext = levelIndex < track.items.length - 1;

  return (
    <div className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${earned ? styles.shell : 'border-outline-variant bg-surface-container-low'}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${earned ? styles.accent : 'bg-outline-variant'}`} />

      <button
        type="button"
        onClick={() => setLevelIndex((current) => Math.max(0, current - 1))}
        disabled={!canGoPrevious}
        className={`absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm transition-all md:opacity-0 md:group-hover:opacity-100 ${
          canGoPrevious ? 'text-primary hover:border-primary hover:bg-primary hover:text-on-primary' : 'cursor-not-allowed text-outline opacity-40'
        }`}
        aria-label={`View previous ${track.title} level`}
      >
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
      </button>

      <button
        type="button"
        onClick={() => setLevelIndex((current) => Math.min(track.items.length - 1, current + 1))}
        disabled={!canGoNext}
        className={`absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm transition-all md:opacity-0 md:group-hover:opacity-100 ${
          canGoNext ? 'text-primary hover:border-primary hover:bg-primary hover:text-on-primary' : 'cursor-not-allowed text-outline opacity-40'
        }`}
        aria-label={`View next ${track.title} level`}
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </button>

      <div className="flex items-start gap-4 px-8 sm:px-10">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${earned ? styles.icon : 'bg-surface text-outline'}`}>
          <span className="material-symbols-outlined text-[30px]">{achievement.badge_icon || track.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-label-md font-black uppercase tracking-wide text-on-surface-variant">{track.title}</p>
              <h3 className="mt-1 truncate text-title-lg font-bold text-on-surface">{achievement.name}</h3>
            </div>
            <span className={`rounded-full bg-surface px-2 py-1 text-label-sm font-black uppercase ${earned ? styles.label : 'text-on-surface-variant'}`}>
              {achievement.tier}
            </span>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">{achievement.description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-label-md">
            <span className="font-semibold text-on-surface-variant">Level {levelIndex + 1} / {track.items.length}</span>
            <span className={earned ? styles.label : 'font-semibold text-primary'}>
              {Math.min(achievement.current_value, achievement.condition_value)} / {achievement.condition_value}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface">
            <div className={`h-full rounded-full ${earned ? styles.accent : 'bg-primary/60'}`} style={{ width: `${earned ? 100 : progressPercent}%` }} />
          </div>
          <p className={`mt-2 text-label-md font-semibold ${earned ? styles.label : 'text-primary'}`}>
            {earned ? `Earned ${formatDate(achievement.earned_at || undefined)}` : `${Math.min(achievement.current_value, achievement.condition_value)} / ${achievement.condition_value} to unlock`}
          </p>
          <div className="mt-4 flex gap-1">
            {track.items.map((item, index) => (
              <button
                key={item.achievement_id}
                type="button"
                onClick={() => setLevelIndex(index)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === levelIndex ? styles.accent : item.earned_at ? 'bg-primary/40' : 'bg-outline-variant'
                }`}
                aria-label={`View ${item.tier} level`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
