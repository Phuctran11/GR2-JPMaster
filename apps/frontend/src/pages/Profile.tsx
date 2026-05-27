import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Container, Section, Breadcrumbs } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useProfileActions } from '../hooks/profile/useProfileActions';
import { useProfileForms } from '../hooks/profile/useProfileForms';
import { useProfilePageData } from '../hooks/profile/useProfilePageData';
import {
  ProfileAchievementsTab,
  ProfileGoalsTab,
  ProfileHero,
  ProfileOverviewTab,
  ProfileProgressTab,
  ProfileTabNav,
  type ProfileTab,
  type ProfileTabItem,
} from '../components/profile';

const profileTabs: Array<ProfileTabItem<ProfileTab>> = [
  { id: 'overview', label: 'Overview', icon: 'person' },
  { id: 'progress', label: 'Progress', icon: 'monitoring' },
  { id: 'goals', label: 'Goals', icon: 'flag' },
  { id: 'achievements', label: 'Achievements', icon: 'workspace_premium' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const { profileForm, goalForm, avatarUrl, username } = useProfileForms();
  const {
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
  } = useProfilePageData({
    user,
    authLoading,
    resetProfile: profileForm.reset,
    addToast,
    navigate,
  });
  const {
    saving,
    avatarUploading,
    onProfileSubmit,
    handleAvatarUpload,
    handleRemoveAvatar,
    onCreateGoal,
    handleDisableGoal,
  } = useProfileActions({
    setProfile,
    setGoals,
    resetProfile: profileForm.reset,
    resetGoal: goalForm.reset,
    getProfileValues: profileForm.getValues,
    updateUser,
    addToast,
  });

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
            <div className="mb-section-gap space-y-8">
              <ProfileHero
                profile={profile}
                completedCourseCount={completedCourses.length}
                activeCourseCount={activeCourses.length}
              />

              <div className="space-y-8">
                <ProfileTabNav tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'overview' && (
                  <ProfileOverviewTab
                    avatarUrl={avatarUrl}
                    username={username}
                    saving={saving}
                    avatarUploading={avatarUploading}
                    completedCourses={completedCourses}
                    registerProfile={profileForm.register}
                    profileErrors={profileForm.formState.errors}
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    onAvatarUpload={(file) => void handleAvatarUpload(file)}
                    onRemoveAvatar={() => void handleRemoveAvatar()}
                    onViewCertificate={(courseId) => navigate(`/courses/${courseId}/certificate`)}
                  />
                )}
                {activeTab === 'progress' && (
                  <ProfileProgressTab
                    summary={summary}
                    studyTime={studyTime}
                    enrollments={enrollments}
                    quizAttempts={quizAttempts}
                    jlptAttempts={jlptAttempts}
                  />
                )}

                {activeTab === 'goals' && (
                  <ProfileGoalsTab
                    goals={goals}
                    registerGoal={goalForm.register}
                    goalErrors={goalForm.formState.errors}
                    onSubmit={goalForm.handleSubmit(onCreateGoal)}
                    onDisableGoal={(goalId) => void handleDisableGoal(goalId)}
                  />
                )}
                {activeTab === 'achievements' && (
                  <ProfileAchievementsTab
                    achievements={achievements}
                    achievementTracks={achievementTracks}
                    filteredAchievementTracks={filteredAchievementTracks}
                    achievementFilter={achievementFilter}
                    onAchievementFilterChange={setAchievementFilter}
                  />
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
