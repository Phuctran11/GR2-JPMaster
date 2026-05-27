import { useToast } from '../../contexts/ToastContext';
import { adminAPI, type AdminRole, type UserProfile } from '../../services/api';
import { emptyUser } from '../../components/admin/adminFormDefaults';
import type { AdminUserFormValues } from '../../components/admin/adminFormTypes';
import type { AdminUserStatus, ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminUsers({
  currentUserId,
  editingUserId,
  setEditingUserId,
  setUserForm,
  setActiveModal,
  closeModal,
  run,
  loadUsers,
  loadStats,
}: {
  currentUserId?: number;
  editingUserId: number | null;
  setEditingUserId: (value: number | null) => void;
  setUserForm: (values: AdminUserFormValues) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadUsers: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const { addToast } = useToast();

  const openCreateUser = () => {
    setEditingUserId(null);
    setUserForm(emptyUser);
    setActiveModal('user');
  };

  const openEditUser = (item: UserProfile) => {
    setEditingUserId(item.user_id);
    setUserForm({
      username: item.username,
      email: item.email,
      password: '',
      role: item.role as AdminRole,
      status: (item.status === 'suspended' ? 'suspended' : 'active') as AdminUserStatus,
    });
    setActiveModal('user');
  };

  const deleteUser = (item: UserProfile) => {
    if (currentUserId === item.user_id) {
      addToast('Cannot delete current account', 'error');
      return;
    }

    const confirmed = window.confirm(`Soft delete user "${item.username}"? The account will be marked deleted and blocked from signing in, while related history is kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteUser(item.user_id);
      if (editingUserId === item.user_id) {
        setEditingUserId(null);
        closeModal();
      }
      await Promise.all([loadUsers(), loadStats()]);
    }, 'User deleted successfully');
  };

  const submitUser = (values: AdminUserFormValues) => {
    void run(async () => {
      if (editingUserId) {
        await adminAPI.updateUser(editingUserId, {
          username: values.username,
          email: values.email,
          role: values.role,
          status: values.status,
        });
      } else {
        const created = await adminAPI.createUser(values);
        setEditingUserId(created.data.user_id);
        setUserForm({
          username: created.data.username,
          email: created.data.email,
          password: '',
          role: created.data.role as AdminRole,
          status: 'active',
        });
      }
      await Promise.all([loadUsers(), loadStats()]);
    }, editingUserId ? 'User updated successfully' : 'User created successfully');
  };

  return { openCreateUser, openEditUser, deleteUser, submitUser };
}
