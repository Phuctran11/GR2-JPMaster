import type { Blog } from '../../services/api';
import { estimateReadTime, fallbackBlogImage, formatBlogDate } from './blogDetailUtils';

export function BlogHero({ blog }: { blog: Blog }) {
  return (
    <>
      <header className="mx-auto mb-section-gap max-w-5xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 text-label-md font-semibold text-on-primary-fixed">
          <span className="material-symbols-outlined text-[18px]">article</span>
          {blog.category || 'Article'}
        </div>
        <h1 className="mx-auto max-w-4xl font-headline-lg text-display-lg text-on-surface mb-6">{blog.title}</h1>
        {blog.excerpt && (
          <p className="mx-auto mb-stack-lg max-w-3xl text-body-lg leading-relaxed text-on-surface-variant">
            {blog.excerpt}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-on-surface-variant flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">person</span>
            <span className="font-body-md">{blog.author_username || 'JPMaster'}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">calendar_today</span>
            <span className="font-body-md">{formatBlogDate(blog.published_at || blog.created_at)}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">schedule</span>
            <span className="font-body-md">{estimateReadTime(blog.content)}</span>
          </div>
        </div>
      </header>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg">
        <img alt={blog.title} className="w-full h-full object-cover" src={blog.image_url || fallbackBlogImage} />
      </div>
    </>
  );
}
