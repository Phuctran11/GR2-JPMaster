export interface CourseModule {
  id: number;
  title: string;
  videos: number;
}

export interface ReviewCard {
  rating_id: number;
  user_id: number;
  username?: string;
  review: string | null;
  rating: number;
  created_at: string;
}

export const formatCourseDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) {
    return 'Self-paced';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${durationMinutes} min`;
  }

  const hourLabel = hours === 1 ? 'hr' : 'hrs';

  if (minutes === 0) {
    return `${hours} ${hourLabel}`;
  }

  return `${hours} ${hourLabel} ${minutes} min`;
};

export const formatLessonDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) {
    return 'Self-paced';
  }

  return durationMinutes < 60 ? `${durationMinutes} min` : formatCourseDuration(durationMinutes);
};

export const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
