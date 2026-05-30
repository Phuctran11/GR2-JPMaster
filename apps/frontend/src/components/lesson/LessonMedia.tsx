import { useEffect, useMemo, useRef } from 'react';
import { Card } from '../ui';
import type { Lesson as LessonData } from '../../services/api';
import { getYouTubeEmbedUrl } from './lessonUtils';

interface LessonMediaProps {
  lesson: LessonData;
}

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

export function LessonMedia({ lesson }: LessonMediaProps) {
  const embedUrl = getYouTubeEmbedUrl(lesson.video_url);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);

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

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.YT?.Player) return;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new window.YT.Player(iframeRef.current);
    });

    return () => {
      cancelled = true;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [iframeSrc]);

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
    </Card>
  );
}
