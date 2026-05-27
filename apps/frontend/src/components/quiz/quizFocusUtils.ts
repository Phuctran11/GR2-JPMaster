export const formatQuizFocusTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const getQuizDurationSeconds = (timeLimitMinutes?: number | null) =>
  Math.max(1, timeLimitMinutes ?? 30) * 60;
