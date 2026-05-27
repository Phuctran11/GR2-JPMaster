import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UserProfile } from '../../../services/api';
import { dangerButtonClass, inputClass } from '../adminClasses';
import type { AdminUserFormValues } from '../adminFormTypes';
import { Field, Modal, ModalActions } from '../DashboardUi';

export function UserFormModal({
  editingUserId,
  currentUserId,
  users,
  busy,
  initialValues,
  onSubmit,
  onClose,
  onDelete,
}: {
  editingUserId: number | null;
  currentUserId?: number;
  users: UserProfile[];
  busy: boolean;
  initialValues: AdminUserFormValues;
  onSubmit: (values: AdminUserFormValues) => void;
  onClose: () => void;
  onDelete: (item: UserProfile) => void;
}) {
  const { register, handleSubmit, reset } = useForm<AdminUserFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingUserId ? 'Edit User' : 'Create User'} subtitle="Manage account identity and access role." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Username"><input className={inputClass} {...register('username', { required: true })} /></Field>
        <Field label="Email"><input className={inputClass} type="email" {...register('email', { required: true })} /></Field>
        {!editingUserId && <Field label="Password"><input className={inputClass} type="password" {...register('password', { required: true })} /></Field>}
        <Field label="Role">
          <select className={inputClass} {...register('role')}>
            <option value="learner">Learner</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClass} disabled={!editingUserId} {...register('status')}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>
        {editingUserId && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md text-on-surface-variant">This marks the user as deleted and blocks sign-in. Related learning and payment history is kept.</p>
              </div>
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busy || currentUserId === editingUserId}
                onClick={() => {
                  const currentUser = users.find((item) => item.user_id === editingUserId);
                  if (currentUser) onDelete(currentUser);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        )}
        <ModalActions busy={busy} submitLabel={editingUserId ? 'Save Changes' : 'Create User'} onCancel={onClose} />
      </form>
    </Modal>
  );
}
