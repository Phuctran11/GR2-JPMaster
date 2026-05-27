import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminPayment, AdminPaymentStatus, AdminSortOrder } from '../../../services/api';
import { formatVnd } from '../../course';
import { inputClass } from '../adminClasses';
import { sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type PaymentFilter = { search: string; status: AdminPaymentStatus; sort_order: AdminSortOrder; limit: number; offset: number };

const paymentStatusOptions: Array<{ value: AdminPaymentStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'expired', label: 'Expired' },
];

const statusClass: Record<Exclude<AdminPaymentStatus, 'all'>, string> = {
  pending: 'border-warning/40 bg-warning-container text-on-warning-container',
  paid: 'border-success/40 bg-success-container text-on-success-container',
  failed: 'border-error/40 bg-error-container text-on-error-container',
  canceled: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
  expired: 'border-warning/40 bg-warning-container text-on-warning-container',
};

const formatDateTime = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '-';

export function PaymentsSection({
  payments,
  totalCount,
  filter,
  setFilter,
}: {
  payments: AdminPayment[];
  totalCount: number;
  filter: PaymentFilter;
  setFilter: Dispatch<SetStateAction<PaymentFilter>>;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="Payments">
        <input
          className={inputClass}
          placeholder="Search user, course, content, order"
          value={filter.search}
          onChange={(event) => setFilter({ ...filter, search: event.target.value, offset: 0 })}
        />
        <select
          className={inputClass}
          value={filter.status}
          onChange={(event) => setFilter({ ...filter, status: event.target.value as AdminPaymentStatus, offset: 0 })}
        >
          {paymentStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={filter.sort_order}
          onChange={(event) => setFilter({ ...filter, sort_order: event.target.value as AdminSortOrder, offset: 0 })}
        >
          {sortOrderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </SectionToolbar>

      <AdminTable
        headers={['ID', 'User', 'Course', 'Amount', 'Payment Status', 'Purchase', 'Order', 'Created', 'Expired/Paid']}
        rows={payments.map((item) => [
          item.payment_transaction_id,
          <div>
            <p className="font-semibold">{item.username}</p>
            <p className="text-label-sm text-on-surface-variant">{item.email}</p>
          </div>,
          item.course_title || item.course_id,
          formatVnd(item.amount),
          <span className={`inline-flex rounded-full border px-3 py-1 text-label-sm font-bold uppercase ${statusClass[item.status]}`}>
            {item.status}
          </span>,
          item.purchase_status,
          <div>
            <p className="font-semibold">{item.order_code ?? '-'}</p>
            <p className="max-w-[220px] truncate text-label-sm text-on-surface-variant" title={item.payment_content}>
              {item.payment_content}
            </p>
          </div>,
          formatDateTime(item.created_at),
          item.status === 'paid' ? formatDateTime(item.paid_at) : formatDateTime(item.expired_at),
        ])}
      />

      <Pagination page={page} pageSize={pageSize} itemCount={payments.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
