import { useCallback, useEffect, useRef } from 'react';

const getAudioContextConstructor = () => {
  const audioWindow = window as Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
};

export function useQuizFocusAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    audioContextRef.current ??= new AudioContextConstructor();
    return audioContextRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext || audioContext.state !== 'suspended') return;

    audioContext.resume().catch(() => {
      // Browsers can reject audio until the next user gesture.
    });
  }, [getAudioContext]);

  const playTimeUpChime = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const play = () => {
      const startTime = audioContext.currentTime;
      const notes = [880, 1174.66, 1567.98];

      notes.forEach((frequency, index) => {
        const noteStart = startTime + index * 0.18;
        const noteEnd = noteStart + 0.14;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd + 0.02);
      });
    };

    if (audioContext.state === 'suspended') {
      audioContext.resume().then(play).catch(() => {
        // Keep timeout submission reliable even if sound is blocked.
      });
      return;
    }

    play();
  }, [getAudioContext]);

  useEffect(() => {
    const handleFirstInteraction = () => unlockAudio();

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [unlockAudio]);

  return {
    unlockAudio,
    playTimeUpChime,
  };
}
