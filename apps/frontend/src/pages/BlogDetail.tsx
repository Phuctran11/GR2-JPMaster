import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header, Footer, Breadcrumbs } from '../components';
import { BlogCard } from '../components/cards';
import { blogAPI, type Blog } from '../services/api';

const fallbackImage = 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1600&q=80';

const formatBlogDate = (value?: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'long', day: '2-digit', year: 'numeric' }).format(new Date(value));
};

const estimateReadTime = (content?: string | null) => {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
};

const getContentBlocks = (content?: string | null) =>
  (content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

const getOpeningInitial = (title: string) => title.trim().charAt(0).toUpperCase() || 'J';

function renderTextLines(block: string) {
  return block.split('\n').map((line, index) => (
    <span key={`${line}-${index}`}>
      {index > 0 && <br />}
      {line}
    </span>
  ));
}

function renderContentBlock(block: string, index: number, title: string) {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));
  const isNumberedList = lines.length > 1 && lines.every((line) => /^\d+[.)]\s+/.test(line));
  const headingText = lines.length === 1 ? lines[0].match(/^#{1,3}\s+(.+)$/)?.[1] : null;

  if (headingText) {
    return (
      <h2 className="text-headline-md font-bold text-primary">
        {headingText}
      </h2>
    );
  }

  if (isBulletList || isNumberedList) {
    const ListTag = isNumberedList ? 'ol' : 'ul';
    return (
      <ListTag className={`space-y-2 text-body-lg leading-8 text-on-surface ${isNumberedList ? 'list-decimal' : 'list-disc'} pl-6`}>
        {lines.map((line, lineIndex) => (
          <li key={`${line}-${lineIndex}`}>
            {line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '')}
          </li>
        ))}
      </ListTag>
    );
  }

  return (
    <p className="text-body-lg leading-8 text-on-surface">
      {index === 0 && (
        <span className="float-left mr-3 mt-1 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-headline-lg font-bold text-on-primary">
          {getOpeningInitial(title)}
        </span>
      )}
      {renderTextLines(block)}
    </p>
  );
}

const toCardProps = (blog: Blog) => ({
  title: blog.title,
  category: blog.category || 'Article',
  date: formatBlogDate(blog.published_at || blog.created_at),
  image: blog.image_url,
  excerpt: blog.excerpt || 'Read more from JPMaster.',
  link: `/blog/${blog.slug || blog.blog_id}`,
});

export default function BlogDetail() {
  const { id } = useParams();
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-margin-desktop py-section-gap">
          {loading && (
            <div className="mx-auto max-w-5xl animate-pulse space-y-6">
              <div className="mx-auto h-5 w-32 rounded bg-surface-container" />
              <div className="mx-auto h-12 w-3/4 rounded bg-surface-container" />
              <div className="h-[420px] rounded-xl bg-surface-container" />
              <div className="mx-auto h-5 w-5/6 rounded bg-surface-container" />
              <div className="mx-auto h-5 w-2/3 rounded bg-surface-container" />
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-error/25 bg-error/5 p-stack-lg text-center">
              <p className="mb-4 text-error">{error}</p>
              <Link to="/blog" className="text-primary font-semibold hover:underline">Back to Blog</Link>
            </div>
          )}

          {!loading && !error && blog && (
            <article>
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
                <img alt={blog.title} className="w-full h-full object-cover" src={blog.image_url || fallbackImage} />
              </div>

              <div className="mt-section-gap grid grid-cols-1 gap-section-gap lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">
                  {blog.video_url && (
                    <div className="mb-section-gap overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface">
                      <video src={blog.video_url} controls className="w-full" />
                    </div>
                  )}

                  <div className="max-w-none text-on-surface">
                    {contentBlocks.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
                        <div className="border-b border-outline-variant bg-surface-container-low p-stack-lg">
                          <p className="text-label-md font-black uppercase tracking-wide text-secondary">Article content</p>
                          <p className="mt-2 text-body-lg leading-relaxed text-on-surface-variant">
                            {blog.excerpt || 'A focused reading note from JPMaster for Japanese learners.'}
                          </p>
                        </div>
                        <div className="space-y-stack-lg bg-surface p-stack-lg md:p-section-gap">
                        {contentBlocks.map((block, index) => (
                          <div
                            key={index}
                            className={index === 0 ? 'rounded-xl bg-primary/5 p-stack-lg ring-1 ring-primary/15' : 'rounded-lg bg-surface-container-low/60 p-stack-md'}
                          >
                            {renderContentBlock(block, index, blog.title)}
                          </div>
                        ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-outline-variant bg-surface p-stack-lg shadow-sm">
                        <p className="text-body-lg leading-8 text-on-surface">{blog.excerpt || 'No content available.'}</p>
                      </div>
                    )}
                  </div>
                </div>

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
              </div>

              {relatedPosts.length > 0 && (
                <section className="mt-section-gap border-t border-outline-variant pt-section-gap">
                  <div className="mb-stack-lg">
                    <p className="text-label-md font-black uppercase tracking-wide text-secondary">Further reading</p>
                    <h3 className="mt-2 font-headline-md text-headline-md text-on-surface">Related articles</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {relatedPosts.map((post) => (
                      <BlogCard key={post.blog_id} {...toCardProps(post)} />
                    ))}
                  </div>
                </section>
              )}
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
