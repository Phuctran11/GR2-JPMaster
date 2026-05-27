import { useEffect, useMemo, useState } from 'react';
import { blogAPI, type Blog } from '../../services/api';
import { getContentBlocks } from '../../components/blog/blogDetailUtils';

export function useBlogDetail(id?: string) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchBlog = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const result = await blogAPI.getBlog(id);
        const related = await blogAPI.getBlogs({
          category: result.data.category || undefined,
          limit: 4,
        });
        if (!active) return;
        setBlog(result.data);
        setRelatedPosts(related.data.filter((item) => item.blog_id !== result.data.blog_id).slice(0, 3));
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load blog');
        setBlog(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchBlog();
    return () => {
      active = false;
    };
  }, [id]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Home', path: '/' },
      { label: 'Blog', path: '/blog' },
      { label: blog?.title || 'Article' },
    ],
    [blog?.title]
  );
  const contentBlocks = useMemo(() => getContentBlocks(blog?.content), [blog?.content]);

  return {
    blog,
    relatedPosts,
    loading,
    error,
    breadcrumbs,
    contentBlocks,
  };
}
