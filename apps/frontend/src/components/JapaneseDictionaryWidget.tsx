import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_ID = 'tudienjp-popup-script';
const SCRIPT_SRC = 'https://tudienjp.com/popup/tudienjp.js';
const STORAGE_KEY = 'jpmaster:tudienjp-enabled';
const OPEN_LESSON_AI_EVENT = 'jpmaster:open-lesson-ai';

export function JapaneseDictionaryWidget() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'false');
  const [open, setOpen] = useState(false);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const canOpenLessonAi = /^\/courses\/[^/]+\/lessons\/[^/]+$/.test(location.pathname);

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
    checkboxRef.current?.classList.toggle('tudienjp-off', !enabled);
  }, [enabled]);

  return (
    <>
      <div id="tudienjp" />
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
        className={`sr-only ${enabled ? '' : 'tudienjp-off'}`}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div
        className="group fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-2"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <div className={`flex flex-col items-end gap-2 transition-all duration-200 ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}>
          <button
            type="button"
            onClick={() => setEnabled((current) => !current)}
            className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-lg backdrop-blur transition ${
              enabled
                ? 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100'
                : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container'
            }`}
            aria-pressed={enabled}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-teal-600 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[22px]">translate</span>
            </span>
            <span className="min-w-0">
              <span className="block text-label-md font-black">JP Dictionary</span>
              <span className="block text-label-sm">{enabled ? 'Popup enabled' : 'Popup disabled'}</span>
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
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/25 transition hover:scale-105 hover:shadow-2xl"
          aria-label="Open study tools"
          aria-expanded={open}
        >
          <span className="material-symbols-outlined text-[28px]">widgets</span>
        </button>
      </div>
    </>
  );
}
