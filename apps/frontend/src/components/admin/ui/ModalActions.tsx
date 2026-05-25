import { actionButtonClass, secondaryButtonClass } from '../adminClasses';

export function ModalActions({ busy, submitLabel, onCancel }: { busy: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
      <button type="button" className={secondaryButtonClass} onClick={onCancel}>
        Cancel
      </button>
      <button className={actionButtonClass} disabled={busy}>
        {submitLabel}
      </button>
    </div>
  );
}
