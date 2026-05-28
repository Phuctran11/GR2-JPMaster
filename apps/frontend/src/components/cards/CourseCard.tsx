import { Card, ImageCard, InteractiveHoverCard, ProgressBar } from '../ui';
import { Heading, Text } from '../ui/Typography';
import { Icon } from '../ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';

function CourseTypeBadge({ isFree = false }: { isFree?: boolean }) {
  const badgeTheme = isFree
    ? 'border-success/40 bg-emerald-600 text-white'
    : 'border-sky-200 bg-slate-950 text-white';
  const dotTheme = isFree ? 'bg-lime-200' : 'bg-sky-200';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] shadow-xl backdrop-blur-sm transition-transform duration-200 hover:scale-105 ${badgeTheme}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotTheme}`}></span>
      <span className="font-black">{isFree ? 'Free' : 'Paid'}</span>
    </span>
  );
}

function CourseImagePlaceholder({ title, className = '' }: { title: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={title}
      className={`flex h-full w-full items-center justify-center bg-surface-container-high text-primary ${className}`}
    >
      <span className="material-symbols-outlined text-[56px] opacity-80">school</span>
    </div>
  );
}

function triggerEnroll(
  event: MouseEvent<HTMLButtonElement>,
  courseId: number | undefined,
  onEnroll?: (courseId: number) => void,
) {
  event.stopPropagation();
  if (typeof courseId === 'number') onEnroll?.(courseId);
}

const formatCourseDate = (value?: string) => {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCourseDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) return 'Flexible';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

interface CourseMetaProps {
  averageRating?: number;
  ratingCount?: number;
  createdBy?: string;
  createdAt?: string;
  duration?: number | null;
}

type CourseHoverPlacement = 'top' | 'bottom';

interface CourseHoverStyle {
  left: number;
  top: number;
  arrowLeft: number;
  placement: CourseHoverPlacement;
}

const HOVER_CARD_GAP = 18;
const HOVER_CARD_VIEWPORT_MARGIN = 16;

function CourseHoverInfo({
  averageRating,
  ratingCount,
  createdBy,
  createdAt,
  duration,
  visible,
  hoverStyle,
  cardRef,
}: CourseMetaProps & {
  visible: boolean;
  hoverStyle: CourseHoverStyle | null;
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const ratingLabel = typeof averageRating === 'number' && averageRating > 0
    ? `${averageRating.toFixed(1)} (${ratingCount || 0})`
    : 'No ratings';

  const items = [
    { icon: 'star', label: 'Rating', value: ratingLabel, highlight: true },
    { icon: 'person', label: 'Created by', value: createdBy || 'Instructor' },
    { icon: 'calendar_today', label: 'Created in', value: formatCourseDate(createdAt) },
    { icon: 'schedule', label: 'Duration', value: formatCourseDuration(duration) },
  ];

  return (
    <div
      ref={cardRef}
      style={hoverStyle ? { left: hoverStyle.left, top: hoverStyle.top } : undefined}
      className={`pointer-events-none fixed z-[80] w-[min(92vw,21rem)] rounded-[1.75rem] border border-primary/20 bg-surface/95 p-4 text-on-surface shadow-2xl shadow-primary/20 backdrop-blur-md transition-[opacity,transform] duration-200 sm:w-80 ${
        visible && hoverStyle ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {hoverStyle && (
        <>
          <span
            style={{ left: hoverStyle.arrowLeft }}
            className={`absolute h-4 w-4 -translate-x-1/2 rotate-45 border-primary/20 bg-surface/95 ${
              hoverStyle.placement === 'top'
                ? 'top-full -translate-y-2 border-b border-r'
                : 'bottom-full translate-y-2 border-l border-t'
            }`}
          ></span>
          <span
            style={{ left: hoverStyle.arrowLeft + 20 }}
            className={`absolute h-3 w-3 rounded-full border border-primary/15 bg-surface/95 shadow-lg ${
              hoverStyle.placement === 'top' ? 'top-[calc(100%+0.6rem)]' : 'bottom-[calc(100%+0.6rem)]'
            }`}
          ></span>
          <span
            style={{ left: hoverStyle.arrowLeft + 36 }}
            className={`absolute h-2 w-2 rounded-full border border-primary/10 bg-surface/90 shadow-md ${
              hoverStyle.placement === 'top' ? 'top-[calc(100%+1.45rem)]' : 'bottom-[calc(100%+1.45rem)]'
            }`}
          ></span>
        </>
      )}
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-primary/15 pb-3">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Course info</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-3 ${item.highlight ? 'border-secondary/40 bg-secondary/10' : 'border-outline-variant/40 bg-surface/80'}`}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
              {item.label}
            </div>
            <p className="truncate text-label-md font-black text-on-surface">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function useCourseHoverPosition() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoverStyle, setHoverStyle] = useState<CourseHoverStyle | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const card = cardRef.current;
    if (!trigger || !card) return;

    const triggerRect = trigger.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || Math.min(window.innerWidth * 0.92, 336);
    const cardHeight = cardRect.height || 180;
    const centerX = triggerRect.left + triggerRect.width / 2;
    const left = Math.min(
      Math.max(centerX - cardWidth / 2, HOVER_CARD_VIEWPORT_MARGIN),
      window.innerWidth - cardWidth - HOVER_CARD_VIEWPORT_MARGIN,
    );
    const topSpace = triggerRect.top;
    const bottomSpace = window.innerHeight - triggerRect.bottom;
    const placement: CourseHoverPlacement =
      topSpace < cardHeight + HOVER_CARD_GAP && bottomSpace > topSpace ? 'bottom' : 'top';
    const top = placement === 'top'
      ? Math.max(HOVER_CARD_VIEWPORT_MARGIN, triggerRect.top - cardHeight - HOVER_CARD_GAP)
      : Math.min(window.innerHeight - cardHeight - HOVER_CARD_VIEWPORT_MARGIN, triggerRect.bottom + HOVER_CARD_GAP);
    const arrowLeft = Math.min(Math.max(centerX - left, 28), cardWidth - 28);

    setHoverStyle({ left, top, arrowLeft, placement });
  }, []);

  useEffect(() => {
    if (!visible) return;

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition, visible]);

  const showHoverCard = () => {
    setVisible(true);
    window.requestAnimationFrame(updatePosition);
  };

  const hideHoverCard = () => {
    setVisible(false);
  };

  return {
    triggerRef,
    cardRef,
    hoverStyle,
    visible,
    showHoverCard,
    hideHoverCard,
  };
}

interface MyLearningCardProps {
  courseId: number;
  title: string;
  progress: number;
  status: 'In Progress' | 'Completed' | 'Not Started';
  image?: string | null;
  needsFinalTest?: boolean;
  onClick?: (courseId: number) => void;
  onGetStarted?: (courseId: number) => void;
  onViewCertificate?: (courseId: number) => void;
}

export function MyLearningCard({
  courseId,
  title,
  progress,
  status,
  image,
  needsFinalTest = false,
  onClick,
  onGetStarted,
  onViewCertificate,
}: MyLearningCardProps) {
  const handleClick = () => {
    onClick?.(courseId);
  };

  const handleGetStarted = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onGetStarted?.(courseId);
  };

  const handleViewCertificate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onViewCertificate?.(courseId);
  };

  return (
    <InteractiveHoverCard className="group h-full rounded-[2rem]" tone={status === 'Completed' ? 'success' : 'primary'}>
      <Card
        className="w-full p-4 md:p-5 flex flex-row items-center gap-4 md:gap-5 h-full cursor-pointer transition-transform"
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (!onClick) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 group overflow-hidden rounded-lg">
          {image ? (
            <ImageCard src={image} alt={title} hoverScale={105} rounded="md" />
          ) : (
            <CourseImagePlaceholder title={title} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Heading level="h3" size="headline-sm" className="truncate mb-3">
            {title}
          </Heading>
          <div className="w-full max-w-2xl">
            <ProgressBar value={progress} showLabel variant="default" showIndicator={false} />
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-stretch gap-2 sm:items-end">
          {status === 'In Progress' ? (
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary"
            >
              {needsFinalTest && <span className="material-symbols-outlined text-[18px]">assignment</span>}
              {needsFinalTest ? 'Take Final Test' : 'Get Started'}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="whitespace-nowrap rounded-full bg-surface-container px-4 py-2 text-label-md font-semibold text-on-surface-variant"
              >
                {status === 'Completed' ? 'Completed' : 'Not Started'}
              </button>
              {status === 'Completed' && (
                <button
                  type="button"
                  onClick={handleViewCertificate}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-label-md font-bold text-on-primary shadow-md transition-colors hover:bg-primary-container hover:text-on-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  Certification
                </button>
              )}
            </>
          )}
        </div>
      </Card>
    </InteractiveHoverCard>
  );
}

interface CourseGridCardProps {
  title: string;
  price: string;
  image?: string | null;
  description: string;
  isFree?: boolean;
  courseId?: number;
  onEnroll?: (courseId: number) => void;
  averageRating?: number;
  ratingCount?: number;
  createdBy?: string;
  createdAt?: string;
  duration?: number | null;
}

export function CourseGridCard({
  title,
  description,
  price,
  image,
  isFree,
  courseId,
  onEnroll,
  averageRating,
  ratingCount,
  createdBy,
  createdAt,
  duration,
}: CourseGridCardProps) {
  const hover = useCourseHoverPosition();

  return (
    <div
      ref={hover.triggerRef}
      className="group relative overflow-visible"
      onMouseEnter={hover.showHoverCard}
      onMouseLeave={hover.hideHoverCard}
      onFocus={hover.showHoverCard}
      onBlur={hover.hideHoverCard}
    >
      <CourseHoverInfo
        averageRating={averageRating}
        ratingCount={ratingCount}
        createdBy={createdBy}
        createdAt={createdAt}
        duration={duration}
        visible={hover.visible}
        hoverStyle={hover.hoverStyle}
        cardRef={hover.cardRef}
      />
      <InteractiveHoverCard className="rounded-[2rem]" tone={isFree ? 'success' : 'primary'}>
      <Card className="flex flex-col relative overflow-hidden border-2 border-outline-variant hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-2 bg-surface-container-high">
      <div className="relative overflow-hidden">
        {image ? (
          <ImageCard
            src={image}
            alt={title}
            overlay={{ gradient: true }}
            aspectRatio="square"
            hoverScale={110}
            rounded="xl"
            className="w-full"
          />
        ) : (
          <CourseImagePlaceholder title={title} className="aspect-square rounded-xl" />
        )}
        <div className="absolute top-4 left-4">
          <CourseTypeBadge isFree={isFree} />
        </div>
      </div>
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <Heading level="h4" size="headline-sm" className="mb-3 line-clamp-2 text-on-surface">
          {title}
        </Heading>
        <Text variant="body-md" color="on-surface-variant" className="mb-5 line-clamp-2 flex-grow">
          {description}
        </Text>
        <div className="flex items-end justify-between pt-4 border-t border-outline-variant/30 gap-3">
          <span className="font-headline-sm text-primary text-title-lg font-bold">{price}₫</span>
          <button
            type="button"
            aria-label={`View ${title}`}
            title="View course"
            onClick={(event) => triggerEnroll(event, courseId, onEnroll)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-all duration-200 hover:bg-primary-container hover:text-on-primary hover:shadow-lg"
          >
            <Icon name="arrow_forward" size="md" />
          </button>
        </div>
      </div>
      </Card>
      </InteractiveHoverCard>
    </div>
  );
}

interface FeaturedCourseCardProps {
  title: string;
  description: string;
  price: string;
  isFree?: boolean;
  image?: string | null;
  courseId: number;
  onEnroll?: (courseId: number) => void;
  lessonCount?: number;
  averageRating?: number;
  ratingCount?: number;
  createdBy?: string;
  createdAt?: string;
  duration?: number | null;
}

export function FeaturedCourseCard({
  title,
  description,
  price,
  isFree = false,
  image,
  courseId,
  onEnroll,
  lessonCount,
  averageRating,
  ratingCount,
  createdBy,
  createdAt,
  duration,
}: FeaturedCourseCardProps) {
  const hover = useCourseHoverPosition();

  return (
    <div
      ref={hover.triggerRef}
      className="lg:col-span-2 group relative overflow-visible"
      onMouseEnter={hover.showHoverCard}
      onMouseLeave={hover.hideHoverCard}
      onFocus={hover.showHoverCard}
      onBlur={hover.hideHoverCard}
    >
      <CourseHoverInfo
        averageRating={averageRating}
        ratingCount={ratingCount}
        createdBy={createdBy}
        createdAt={createdAt}
        duration={duration}
        visible={hover.visible}
        hoverStyle={hover.hoverStyle}
        cardRef={hover.cardRef}
      />
      <InteractiveHoverCard className="rounded-2xl" tone="secondary">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary shadow-2xl border-3 border-secondary hover:border-secondary-fixed transition-all duration-300 hover:shadow-3xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Icon name="verified_user" size="lg" />
        </div>
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-secondary/15 rounded-full blur-3xl group-hover:blur-2xl transition-all"></div>
        <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl group-hover:blur-2xl transition-all"></div>
        <div className="relative flex flex-col lg:flex-row h-full z-10">
        <div className="lg:w-1/2 relative group/img min-h-[320px] lg:min-h-full overflow-hidden">
          {image ? (
            <ImageCard
              src={image}
              alt={title}
              overlay={{ color: 'absolute inset-0 bg-gradient-to-r from-[#00164e]/40 to-transparent' }}
              hoverScale={105}
              aspectRatio="auto"
              rounded="2xl"
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <CourseImagePlaceholder title={title} className="absolute inset-0" />
          )}
        </div>
        <div className="lg:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="px-4 py-2 rounded-full text-label-sm font-black inline-flex items-center gap-2 uppercase tracking-widest shadow-lg hover:shadow-xl transition-all transform group-hover:scale-105 border-2 border-warning/40 bg-gradient-to-r from-warning to-secondary text-on-secondary">
                  <span className="font-black">Top Recommendation</span>
                </span>
                <CourseTypeBadge isFree={isFree} />
              </div>
              <Heading level="h3" size="display-lg" className="text-white mb-4 sm:mb-5 font-bold leading-tight text-2xl sm:text-3xl lg:text-4xl">
                {title}
              </Heading>
              <Text variant="body-lg" color="white" className="max-w-md opacity-95 leading-relaxed text-base sm:text-lg">
                {description}
              </Text>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-label-md opacity-85 block font-medium">Starting at</span>
              <span className="text-display-md font-bold text-secondary-fixed">{price}₫</span>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                aria-label={`View ${title}`}
                title="View course"
                onClick={(event) => triggerEnroll(event, courseId, onEnroll)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-surface hover:text-primary"
              >
                <Icon name="arrow_forward" size="lg" />
              </button>
            </div>
          </div>
          {typeof lessonCount !== 'undefined' && (
            <div className="mt-4 text-secondary-fixed">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="font-bold">{lessonCount} Lessons</span>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      </InteractiveHoverCard>
    </div>
  );
}
