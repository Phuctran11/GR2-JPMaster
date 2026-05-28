import { createPortal } from 'react-dom';
import { LessonSidebar } from './LessonSidebar';
import type { LessonItem } from './types';

interface LessonSidebarPanelsProps {
  lessons: LessonItem[];
  isOpen: boolean;
  topPx: number;
  onSelect: (lessonId: number) => void;
  onMobileSelect: (lessonId: number) => void;
  onToggle: () => void;
  onCloseMobile: () => void;
}

export function LessonSidebarPanels({
  lessons,
  isOpen,
  topPx,
  onSelect,
  onMobileSelect,
  onToggle,
  onCloseMobile,
}: LessonSidebarPanelsProps) {
  const sidebarPanels = (
    <>
      <div
        className={`fixed left-0 z-40 border-r border-outline-variant bg-surface transition-all duration-300 overflow-hidden hidden md:flex flex-col ${
          isOpen ? 'w-80' : 'w-16'
        }`}
        style={{ top: `${topPx}px`, bottom: 0 }}
      >
        <LessonSidebar lessons={lessons} onSelect={onSelect} onToggle={onToggle} isOpen={isOpen} />
      </div>

      {isOpen && (
        <div
          className="fixed left-0 right-0 z-30 bg-black/50 md:hidden"
          onClick={onCloseMobile}
          role="presentation"
          style={{ top: `${topPx}px`, bottom: 0 }}
        />
      )}
      <div
        className={`fixed left-0 z-40 w-full border-r border-outline-variant bg-surface transition-transform duration-300 overflow-hidden flex flex-col md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: `${topPx}px`, bottom: 0 }}
      >
        <LessonSidebar lessons={lessons} onSelect={onMobileSelect} onToggle={onToggle} isOpen={isOpen} />
      </div>
    </>
  );

  return createPortal(sidebarPanels, document.body);
}
