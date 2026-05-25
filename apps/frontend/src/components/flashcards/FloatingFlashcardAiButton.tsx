import type { useDraggableFloating } from '../../hooks/useDraggableFloating';

type DraggableButton = ReturnType<typeof useDraggableFloating<HTMLButtonElement>>;

export function FloatingFlashcardAiButton({
  aiButton,
  onOpen,
}: {
  aiButton: DraggableButton;
  onOpen: () => void;
}) {
  return (
    <button
      ref={aiButton.ref}
      type="button"
      {...aiButton.dragHandleProps}
      onClick={() => {
        if (aiButton.consumeDragClick()) return;
        onOpen();
      }}
      className="fixed z-[80] inline-flex h-14 w-14 touch-none cursor-grab items-center justify-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/25 transition hover:scale-105 hover:shadow-2xl active:cursor-grabbing"
      style={aiButton.style}
      title="Drag to move AI assistant"
      aria-label="Open AI assistant"
    >
      <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
    </button>
  );
}
