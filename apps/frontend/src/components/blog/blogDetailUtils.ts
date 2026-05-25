import type { Blog } from '../../services/api';

export const fallbackBlogImage = 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1600&q=80';

export const formatBlogDate = (value?: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'long', day: '2-digit', year: 'numeric' }).format(new Date(value));
};

export const estimateReadTime = (content?: string | null) => {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
};

export const getContentBlocks = (content?: string | null) =>
  (content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

export const getOpeningInitial = (title: string) => title.trim().charAt(0).toUpperCase() || 'J';

export const toBlogCardProps = (blog: Blog) => ({
  title: blog.title,
  category: blog.category || 'Article',
  date: formatBlogDate(blog.published_at || blog.created_at),
  image: blog.image_url,
  excerpt: blog.excerpt || 'Read more from JPMaster.',
  link: `/blog/${blog.slug || blog.blog_id}`,
});
