import { useForm } from 'react-hook-form';
import type { GoalFormValues, ProfileFormValues } from '../../components/profile';

export function useProfileForms() {
  const profileForm = useForm<ProfileFormValues>({
    defaultValues: { username: '', email: '', avatarUrl: '' },
    mode: 'onBlur',
  });
  const goalForm = useForm<GoalFormValues>({
    defaultValues: {
      goalType: 'lessons_per_day',
      goalTarget: 2,
      goalPeriod: 'daily',
    },
    mode: 'onBlur',
  });

  return {
    profileForm,
    goalForm,
    avatarUrl: profileForm.watch('avatarUrl'),
    username: profileForm.watch('username'),
  };
}
