import { Card } from '../index';
import type { ReviewCard } from './courseDetailUtils';

export function ReviewItem({ review, isUser, isHighlighted }: { review: ReviewCard; isUser?: boolean; isHighlighted?: boolean }) {
  const getInitials = (username: string | undefined) => (username || 'U').substring(0, 2).toUpperCase();
  const colors = ['bg-primary-fixed', 'bg-secondary-fixed', 'bg-tertiary-fixed'];
  const highlightClass = isHighlighted ? 'ring-4 ring-secondary-container shadow-xl shadow-secondary-container/30' : '';
  const userClass = isUser ? 'bg-primary-fixed/20 border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/25' : 'bg-white border-outline-variant';

  return (
    <Card id={`review-${review.rating_id}`} className={`h-full relative p-6 border scroll-mt-24 transition-all ${userClass} ${highlightClass}`}>
      <div className="absolute -top-4 -left-4 text-primary opacity-10">
        <span className="material-symbols-outlined text-6xl">format_quote</span>
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex text-secondary">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
        {isUser && (
          <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-bold">
            Your Review
          </span>
        )}
      </div>
      <p className="text-on-surface italic font-body-md mb-6 leading-relaxed min-h-[84px]">"{review.review || 'No review text provided'}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className={`w-10 h-10 ${colors[review.user_id % colors.length]} rounded-full flex items-center justify-center font-bold text-xs`}>
          {getInitials(review.username)}
        </div>
        <div>
          <p className="text-label-md font-bold">{review.username || 'Anonymous'}</p>
          <p className="text-[12px] text-on-surface-variant">{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
