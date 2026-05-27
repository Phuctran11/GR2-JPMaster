export function QuestionMediaBlock({
  imageUrl,
  audioUrl,
  imageAlt = '',
  imageClassName = 'mt-4 max-h-80 w-full rounded-lg border border-outline-variant object-contain',
  audioClassName = 'mt-4 w-full',
  audioFallback,
}: {
  imageUrl?: string | null;
  audioUrl?: string | null;
  imageAlt?: string;
  imageClassName?: string;
  audioClassName?: string;
  audioFallback?: string;
}) {
  return (
    <>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt}
          className={imageClassName}
        />
      )}
      {audioUrl && (
        <audio controls src={audioUrl} className={audioClassName}>
          {audioFallback}
        </audio>
      )}
    </>
  );
}
