import type { ModalName } from './adminTypes';
import type { AdminModalMap } from './adminModalTypes';

export function AdminModalRouter({
  activeModal,
  modals,
}: {
  activeModal: ModalName;
  modals: AdminModalMap;
}) {
  if (!activeModal) return null;

  return <>{modals[activeModal] ?? null}</>;
}
