import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../ui';
import type { Lesson as LessonData, LessonNote } from '../../services/api';
import { getYouTubeEmbedUrl } from './lessonUtils';

interface LessonMediaProps {
  lesson: LessonData;
  onAddVideoNote?: (timestampSeconds: number | null) => void;
  videoNotes?: LessonNote[];
  onEditVideoNote?: (note: LessonNote) => void;
}

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

type YouTubePlayer = {
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLIFrameElement, options?: Record<string, unknown>) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

const loadYouTubeIframeApi = () => {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

export function LessonMedia({ lesson, onAddVideoNote, videoNotes = [], onEditVideoNote }: LessonMediaProps) {
  const embedUrl = getYouTubeEmbedUrl(lesson.video_url);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const [youtubeReady, setYoutubeReady] = useState(false);

  const iframeSrc = useMemo(() => {
    if (!embedUrl) return null;
    const url = new URL(embedUrl);
    url.searchParams.set('enablejsapi', '1');
    if (typeof window !== 'undefined') {
      url.searchParams.set('origin', window.location.origin);
    }
    return url.toString();
  }, [embedUrl]);

  useEffect(() => {
    if (!iframeSrc || !iframeRef.current) return;

    let cancelled = false;
    setYoutubeReady(false);

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.YT?.Player) return;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            if (!cancelled) setYoutubeReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      setYoutubeReady(false);
    };
  }, [iframeSrc]);

  const getCurrentTimestamp = () => {
    if (videoRef.current) {
      return Math.floor(videoRef.current.currentTime);
    }

    if (youtubeReady && youtubePlayerRef.current) {
      return Math.floor(youtubePlayerRef.current.getCurrentTime());
    }

    return 0;
  };

  if (!lesson.video_url) {
    return null;
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">smart_display</span>
          <p className="truncate text-label-md font-label-md text-on-surface">Lesson media</p>
        </div>
        <span className="rounded-lg bg-surface px-2.5 py-1 text-label-sm text-on-surface-variant">
          Video
        </span>
      </div>
      <div className="relative w-full aspect-video bg-inverse-surface overflow-hidden">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 h-full w-full"
            src={iframeSrc ?? embedUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            controls
            playsInline
            src={lesson.video_url}
          />
        )}
      </div>
      {onAddVideoNote && (
        <div className="border-t border-outline-variant bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onAddVideoNote(getCurrentTimestamp());
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary"
          >
            <span className="material-symbols-outlined text-[18px]">add_notes</span>
            Add video note
          </button>
          {embedUrl && !youtubeReady && (
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Video timestamp is preparing. If needed, wait a moment before adding the note.
            </p>
          )}
          {videoNotes.length > 0 && (
            <div className="mt-4 border-t border-outline-variant pt-3">
              <p className="mb-2 text-label-md font-bold text-on-surface">Note timestamps</p>
              <div className="flex flex-wrap gap-2">
                {videoNotes.map((note) => (
                  <button
                    key={note.note_id}
                    type="button"
                    onClick={() => onEditVideoNote?.(note)}
                    className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md font-bold text-primary hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    {formatTimestamp(note.video_timestamp_seconds ?? 0)} noted
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
