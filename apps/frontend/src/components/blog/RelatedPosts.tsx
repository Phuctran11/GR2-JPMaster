import type { Blog } from '../../services/api';
import { BlogCard } from '../cards';
import { toBlogCardProps } from './blogDetailUtils';

export function RelatedPosts({ posts }: { posts: Blog[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-section-gap border-t border-outline-variant pt-section-gap">
      <div className="mb-stack-lg">
        <p className="text-label-md font-black uppercase tracking-wide text-secondary">Further reading</p>
        <h3 className="mt-2 font-headline-md text-headline-md text-on-surface">Related articles</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {posts.map((post) => (
          <BlogCard key={post.blog_id} {...toBlogCardProps(post)} />
        ))}
      </div>
    </section>
  );
}
