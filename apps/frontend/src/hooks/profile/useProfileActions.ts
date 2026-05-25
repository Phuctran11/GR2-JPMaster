import { useState, type Dispatch, type SetStateAction } from 'react';
import type { UseFormGetValues, UseFormReset } from 'react-hook-form';
import {
  assetAPI,
  goalAPI,
  userAPI,
  type LearningGoal,
  type UserProfile,
} from '../../services/api';
import type { User } from '../../contexts/AuthContext';
import type { GoalFormValues, ProfileFormValues } from '../../components/profile';

type UseProfileActionsParams = {
  setProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setGoals: Dispatch<SetStateAction<LearningGoal[]>>;
  resetProfile: UseFormReset<ProfileFormValues>;
  resetGoal: UseFormReset<GoalFormValues>;
  getProfileValues: UseFormGetValues<ProfileFormValues>;
  updateUser: (user: User) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
};

export function useProfileActions({
  setProfile,
  setGoals,
  resetProfile,
  resetGoal,
  getProfileValues,
  updateUser,
  addToast,
}: UseProfileActionsParams) {
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const saveProfile = async (values: ProfileFormValues, avatarUrlOverride?: string | null) => {
    const nextUsername = values.username.trim();
    const nextEmail = values.email.trim().toLowerCase();
    const nextAvatarUrl = avatarUrlOverride === undefined ? values.avatarUrl.trim() || null : avatarUrlOverride;
    const result = await userAPI.updateMe({
      username: nextUsername,
      email: nextEmail,
      avatar_url: nextAvatarUrl,
    });

    setProfile(result.data);
    resetProfile({
      username: result.data.username,
      email: result.data.email,
      avatarUrl: result.data.avatar_url ?? '',
    });
    updateUser({
      user_id: result.data.user_id,
      username: result.data.username,
      email: result.data.email,
      avatar_url: result.data.avatar_url ?? null,
      role: result.data.role,
    });

    return result.data;
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true);
      const updated = await saveProfile(values);
      if (updated) addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true);
      const uploaded = await assetAPI.upload({ file, media_kind: 'image', scope: 'avatars' });
      const updated = await saveProfile(getProfileValues(), uploaded.data.secure_url);
      if (updated) addToast('Avatar updated successfully', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to upload avatar', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      const updated = await saveProfile(getProfileValues(), null);
      if (updated) addToast('Avatar removed', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to remove avatar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onCreateGoal = async (values: GoalFormValues) => {
    try {
      const created = await goalAPI.createGoal({ goal_type: values.goalType, target_value: Number(values.goalTarget), period: values.goalPeriod });
      setGoals((current) => [created.data, ...current]);
      resetGoal({ goalType: values.goalType, goalTarget: 2, goalPeriod: values.goalPeriod });
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

  return {
    saving,
    avatarUploading,
    onProfileSubmit,
    handleAvatarUpload,
    handleRemoveAvatar,
    onCreateGoal,
    handleDisableGoal,
  };
}
