export const formatDisplayDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString();

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCourseDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) return 'Self-paced';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
};

export const toPdfText = (value: string) => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

export const sanitizeFileName = (value: string) => {
  const safeName = toPdfText(value).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return safeName || 'certificate';
};
