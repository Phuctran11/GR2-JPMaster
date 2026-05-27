import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDraggableFloating } from '../hooks/useDraggableFloating';
import { OPEN_FLASHCARD_AI_EVENT } from '../hooks/flashcards/useFlashcardAiAssistant';

const SCRIPT_ID = 'tudienjp-popup-script';
const SCRIPT_SRC = 'https://tudienjp.com/popup/tudienjp.js';
const STORAGE_KEY = 'jpmaster:tudienjp-enabled';
const OPEN_LESSON_AI_EVENT = 'jpmaster:open-lesson-ai';

const isDictionaryBlockedPath = (pathname: string) =>
  /^\/courses\/[^/]+\/lessons\/[^/]+\/quiz$/.test(pathname) ||
  /^\/courses\/[^/]+\/final-test$/.test(pathname) ||
  /^\/tests\/[^/]+$/.test(pathname);

const hasSelectedText = () => Boolean(window.getSelection()?.toString().trim());

const clearSelectedText = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  selection.removeAllRanges();
};

export function JapaneseDictionaryWidget() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'false');
  const [open, setOpen] = useState(false);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const canOpenLessonAi = /^\/courses\/[^/]+\/lessons\/[^/]+$/.test(location.pathname);
  const canOpenFlashcardAi = /^\/flashcards\/[^/]+$/.test(location.pathname);
  const dictionaryBlocked = isDictionaryBlockedPath(location.pathname);
  const dictionaryActive = enabled && !dictionaryBlocked;
  const floating = useDraggableFloating<HTMLDivElement>({
    storageKey: 'jpmaster:study-tools-position',
    defaultRight: 24,
    defaultBottom: 24,
  });
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const floatingX = floating.position?.x ?? viewportWidth - 80;
  const floatingY = floating.position?.y ?? viewportHeight - 80;
  const openPanelToRight = floatingX < 220;
  const openPanelBelow = floatingY < 150;

  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && floating.ref.current?.contains(target)) return;
      setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointerDown);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [floating.ref, open]);

  useEffect(() => {
    const shouldDisableDictionary = !dictionaryActive;
    const dictionaryRoot = document.getElementById('tudienjp');

    checkboxRef.current?.classList.toggle('tudienjp-off', shouldDisableDictionary);
    document.body.classList.toggle('tudienjp-off', shouldDisableDictionary);
    document.documentElement.classList.toggle('tudienjp-off', shouldDisableDictionary);
    if (dictionaryRoot) {
      dictionaryRoot.style.display = shouldDisableDictionary ? 'none' : '';
    }

    if (!shouldDisableDictionary) return undefined;

    const blockDictionarySelection = (event: Event) => {
      if (event.type === 'selectionchange' || hasSelectedText()) {
        if (dictionaryBlocked) clearSelectedText();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('mouseup', blockDictionarySelection, true);
    window.addEventListener('pointerup', blockDictionarySelection, true);
    window.addEventListener('touchend', blockDictionarySelection, true);
    window.addEventListener('selectionchange', blockDictionarySelection, true);
    document.addEventListener('selectionchange', blockDictionarySelection, true);

    return () => {
      document.body.classList.remove('tudienjp-off');
      document.documentElement.classList.remove('tudienjp-off');
      if (dictionaryRoot) {
        dictionaryRoot.style.display = '';
      }
      window.removeEventListener('mouseup', blockDictionarySelection, true);
      window.removeEventListener('pointerup', blockDictionarySelection, true);
      window.removeEventListener('touchend', blockDictionarySelection, true);
      window.removeEventListener('selectionchange', blockDictionarySelection, true);
      document.removeEventListener('selectionchange', blockDictionarySelection, true);
    };
  }, [dictionaryActive, dictionaryBlocked]);

  return (
    <>
      <div id="tudienjp" />
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={dictionaryActive}
        onChange={(event) => setEnabled(event.target.checked)}
        className={`sr-only ${dictionaryActive ? '' : 'tudienjp-off'}`}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div
        ref={floating.ref}
        className="group fixed z-[80] h-14 w-14 touch-none"
        style={floating.style}
      >
        <div
          className={`absolute flex flex-col gap-2 transition-all duration-200 ${
            openPanelToRight ? 'left-0 items-start' : 'right-0 items-end'
          } ${
            openPanelBelow ? 'bottom-auto top-full mb-0 mt-2' : 'bottom-full top-auto mb-2 mt-0'
          } ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
        >
          <button
            type="button"
            disabled={dictionaryBlocked}
            onClick={() => setEnabled((current) => !current)}
            className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-lg backdrop-blur transition ${
              dictionaryActive
                ? 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100'
                : dictionaryBlocked
                  ? 'cursor-not-allowed border-outline-variant bg-surface-container-low text-on-surface-variant opacity-70'
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container'
            }`}
            aria-pressed={dictionaryActive}
            title={dictionaryBlocked ? 'JP Dictionary is disabled during quizzes and tests' : undefined}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${dictionaryActive ? 'bg-teal-600 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[22px]">translate</span>
            </span>
            <span className="min-w-0">
              <span className="block text-label-md font-black">JP Dictionary</span>
              <span className="block text-label-sm">
                {dictionaryBlocked ? 'Disabled in tests' : dictionaryActive ? 'Popup enabled' : 'Popup disabled'}
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={!canOpenLessonAi}
            onClick={() => {
              if (!canOpenLessonAi) return;
              window.dispatchEvent(new Event(OPEN_LESSON_AI_EVENT));
            }}
            className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-lg backdrop-blur transition ${
              canOpenLessonAi
                ? 'border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                : 'cursor-not-allowed border-outline-variant bg-surface-container-low text-on-surface-variant opacity-70'
            }`}
            title={canOpenLessonAi ? 'Open lesson AI assistant' : 'AI chat is available inside lessons only'}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${canOpenLessonAi ? 'bg-indigo-600 text-white' : 'bg-outline-variant/50 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </span>
            <span className="min-w-0">
              <span className="block text-label-md font-black">Lesson AI</span>
              <span className="block text-label-sm">{canOpenLessonAi ? 'Ask about this lesson' : 'Lesson only'}</span>
            </span>
          </button>

          <button
            type="button"
            disabled={!canOpenFlashcardAi}
            onClick={() => {
              if (!canOpenFlashcardAi) return;
              window.dispatchEvent(new Event(OPEN_FLASHCARD_AI_EVENT));
            }}
            className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-lg backdrop-blur transition ${
              canOpenFlashcardAi
                ? 'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100'
                : 'cursor-not-allowed border-outline-variant bg-surface-container-low text-on-surface-variant opacity-70'
            }`}
            title={canOpenFlashcardAi ? 'Open flashcard AI assistant' : 'Flashcard AI is available inside flashcard collections only'}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${canOpenFlashcardAi ? 'bg-violet-600 text-white' : 'bg-outline-variant/50 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </span>
            <span className="min-w-0">
              <span className="block text-label-md font-black">Flashcard AI</span>
              <span className="block text-label-sm">{canOpenFlashcardAi ? 'Practice selected cards' : 'Flashcards only'}</span>
            </span>
          </button>
        </div>

        <button
          type="button"
          {...floating.dragHandleProps}
          onClick={() => {
            if (floating.consumeDragClick()) return;
            setOpen((current) => !current);
          }}
          className="flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/25 transition hover:scale-105 hover:shadow-2xl active:cursor-grabbing"
          aria-label="Open study tools"
          aria-expanded={open}
          title="Drag to move study tools"
        >
          <span className="material-symbols-outlined text-[28px]">widgets</span>
        </button>
      </div>
    </>
  );
}
