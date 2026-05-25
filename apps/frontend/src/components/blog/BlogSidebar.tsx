import { Link } from 'react-router-dom';
import type { Blog } from '../../services/api';
import { estimateReadTime } from './blogDetailUtils';

export function BlogSidebar({ blog }: { blog: Blog }) {
  return (
    <aside className="space-y-stack-md lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border border-outline-variant bg-surface p-stack-md">
        <p className="mb-3 text-label-md font-black uppercase tracking-wide text-secondary">Article info</p>
        <dl className="space-y-3 text-body-md">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-on-surface-variant">Category</dt>
            <dd className="font-semibold text-on-surface">{blog.category || 'Article'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-on-surface-variant">Author</dt>
            <dd className="font-semibold text-on-surface">{blog.author_username || 'JPMaster'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-on-surface-variant">Read time</dt>
            <dd className="font-semibold text-on-surface">{estimateReadTime(blog.content)}</dd>
          </div>
        </dl>
      </div>

      {blog.tags.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-stack-md">
          <p className="mb-3 text-label-md font-black uppercase tracking-wide text-secondary">Tags</p>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span key={tag.tag_id} className="rounded-full bg-surface-container px-3 py-1 text-label-md text-on-surface-variant">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link to="/blog" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-3 text-label-md font-semibold text-on-surface hover:bg-surface-container">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Blog
      </Link>
    </aside>
  );
}
