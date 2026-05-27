import type { AdminDashboardCommonProps, AdminDashboardUserProps, AdminModalMap } from '../adminModalTypes';
import { UserFormModal } from '../modals';

export function createUserModalGroup({
  common,
  users,
}: {
  common: AdminDashboardCommonProps;
  users: AdminDashboardUserProps;
}): AdminModalMap {
  return {
    user: (
      <UserFormModal
        editingUserId={users.editingId}
        currentUserId={users.currentUserId}
        users={users.users}
        busy={common.busy}
        initialValues={users.form}
        onSubmit={users.submit}
        onClose={common.closeModal}
        onDelete={users.deleteItem}
      />
    ),
  };
}
