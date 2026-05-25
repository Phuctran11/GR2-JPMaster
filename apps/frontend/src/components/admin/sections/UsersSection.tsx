import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminRole, AdminSortOrder, UserProfile } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import { sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type UserFilter = { search: string; role: AdminRole | 'all'; sort_order: AdminSortOrder; limit: number; offset: number };

export function UsersSection({
  users,
  totalCount,
  currentUserId,
  busy,
  filter,
  setFilter,
  onCreate,
  onEdit,
  onDelete,
}: {
  users: UserProfile[];
  totalCount: number;
  currentUserId?: number;
  busy: boolean;
  filter: UserFilter;
  setFilter: Dispatch<SetStateAction<UserFilter>>;
  onCreate: () => void;
  onEdit: (item: UserProfile) => void;
  onDelete: (item: UserProfile) => void;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="Users" actionLabel="New User" onAction={onCreate}>
        <input className={inputClass} placeholder="Search by name or email" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, offset: 0 })} />
        <select className={inputClass} value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value as AdminRole | 'all', offset: 0 })}>
          <option value="all">All roles</option>
          <option value="learner">Learner</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
        <select className={inputClass} value={filter.sort_order} onChange={(e) => setFilter({ ...filter, sort_order: e.target.value as AdminSortOrder, offset: 0 })}>
          {sortOrderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </SectionToolbar>
      <AdminTable
        headers={['ID', 'Username', 'Email', 'Role', 'Status', 'Actions']}
        rows={users.map((item) => [
          item.user_id,
          item.username,
          item.email,
          item.role,
          item.status || 'active',
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={() => onEdit(item)}>Edit</button>
            <button className={dangerButtonClass} disabled={busy || currentUserId === item.user_id} onClick={() => onDelete(item)}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>,
        ])}
      />
      <Pagination page={page} pageSize={pageSize} itemCount={users.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
