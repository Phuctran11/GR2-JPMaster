import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button, Card } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { LearningGoal } from '../../services/api';
import { getFieldError, validationMessages } from '../../utils/formValidation';
import { getGoalVisualState } from './profileUtils';
import { goalTypeLabels, type GoalFormValues } from './profileTypes';

export function ProfileGoalsTab({
  goals,
  registerGoal,
  goalErrors,
  onSubmit,
  onDisableGoal,
}: {
  goals: LearningGoal[];
  registerGoal: UseFormRegister<GoalFormValues>;
  goalErrors: FieldErrors<GoalFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDisableGoal: (goalId: number) => void;
}) {
  return (
    <Card className="p-6 md:p-8 border border-outline-variant">
      <div className="mb-6">
        <Heading level="h2" size="headline-lg" className="text-primary">Personal Goals</Heading>
        <Text variant="body-md" color="on-surface-variant" className="mt-2">Set daily or weekly learning targets.</Text>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 md:grid-cols-[1fr_120px_120px_auto]">
        <select className="rounded-lg border border-outline-variant bg-surface px-3 py-2" {...registerGoal('goalType', { required: validationMessages.required('Goal type') })}>
          {Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" type="number" min="1" {...registerGoal('goalTarget', {
          required: validationMessages.required('Target'),
          valueAsNumber: true,
          min: { value: 1, message: validationMessages.min('Target', 1) },
        })} />
        <select className="rounded-lg border border-outline-variant bg-surface px-3 py-2" {...registerGoal('goalPeriod', { required: validationMessages.required('Period') })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <Button type="submit">Add Goal</Button>
        {(goalErrors.goalType || goalErrors.goalTarget || goalErrors.goalPeriod) && (
          <p className="text-label-sm font-semibold text-error md:col-span-4">
            {getFieldError(goalErrors.goalType) || getFieldError(goalErrors.goalTarget) || getFieldError(goalErrors.goalPeriod)}
          </p>
        )}
      </form>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const visualState = getGoalVisualState(goal);
          const progressPercent = Math.min(100, ((goal.current_value ?? 0) / goal.target_value) * 100);

          return (
            <div key={goal.goal_id} className={`rounded-xl border p-4 transition-colors ${visualState.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-title-md font-bold text-on-surface">{goalTypeLabels[goal.goal_type]}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm font-black uppercase ${visualState.badge}`}>
                      <span className="material-symbols-outlined text-[14px]">{visualState.icon}</span>
                      {visualState.label}
                    </span>
                  </div>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {goal.current_value ?? 0} / {goal.target_value} {goal.period}
                  </p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visualState.iconShell}`}>
                  <span className="material-symbols-outlined text-[22px]">{visualState.icon}</span>
                </span>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-surface">
                <div className={`h-full rounded-full ${visualState.progress}`} style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-label-md font-semibold text-on-surface-variant">{Math.round(progressPercent)}% complete</p>
                {goal.is_active && (
                  <button type="button" className="text-label-md font-semibold text-error hover:underline" onClick={() => onDisableGoal(goal.goal_id)}>Disable</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
