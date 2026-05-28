import { useEffect, useMemo, useState } from 'react';
import { Header, Footer, Breadcrumbs, Pagination } from '../components';
import { Heading } from '../components/ui/Typography';
import { MotionSectionFrame } from '../components/ui';
import { BlogFilterBar } from '../components/sections/BlogFilterBar';
import { BlogCard, FeaturedBlogCard } from '../components/cards';
import { blogAPI, type Blog, type BlogCategory } from '../services/api';

const formatBlogDate = (value?: string | null) => {
  if (!value) return 'Draft';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value));
};

const toCardProps = (blog: Blog) => ({
  title: blog.title,
  category: blog.category || 'Article',
  date: formatBlogDate(blog.published_at || blog.created_at),
  image: blog.image_url,
  excerpt: blog.excerpt || 'Read the latest article from JPMaster.',
  link: `/blog/${blog.slug || blog.blog_id}`,
});

const timeFilters = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'year', label: 'This year' },
] as const;

type TimeFilter = (typeof timeFilters)[number]['value'];

const getPublishedAfter = (filter: TimeFilter) => {
  const now = new Date();
  if (filter === '7d') now.setDate(now.getDate() - 7);
  else if (filter === '30d') now.setDate(now.getDate() - 30);
  else if (filter === 'year') {
    now.setMonth(0, 1);
    now.setHours(0, 0, 0, 0);
  } else {
    return undefined;
  }
  return now.toISOString();
};

function BlogListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[360px] animate-pulse rounded-xl border border-outline-variant bg-surface">
          <div className="h-44 rounded-t-xl bg-surface-container" />
          <div className="space-y-3 p-stack-md">
            <div className="h-4 w-24 rounded bg-surface-container" />
            <div className="h-6 w-4/5 rounded bg-surface-container" />
            <div className="h-4 w-full rounded bg-surface-container" />
            <div className="h-4 w-2/3 rounded bg-surface-container" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Topics');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 9;

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Blog' },
  ];

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const selectedCategory = category === 'All Topics' ? undefined : category;
        const [blogResult, categoryResult] = await Promise.all([
          blogAPI.getBlogs({ search, category: selectedCategory, published_after: getPublishedAfter(timeFilter), limit: pageSize, offset: (page - 1) * pageSize }),
          blogAPI.getCategories(),
        ]);
        if (!active) return;
        setBlogs(blogResult.data);
        setTotalCount(blogResult.total_count ?? blogResult.count);
        setCategories(categoryResult.data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
        setBlogs([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, category, timeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, category, timeFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [page, totalCount]);

  const categoryOptions = useMemo(() => ['All Topics', ...categories.map((item) => item.name)], [categories]);
  const [featuredPost, ...posts] = blogs;
  const latestPosts = posts.slice(2);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <MotionSectionFrame index={0} preset="hero">
          <section className="relative min-h-[430px] w-full overflow-hidden">
            <img
              alt="Japanese study desk"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1800&q=80"
            />
            <div className="absolute inset-0 bg-black/45"></div>
            <div className="relative mx-auto flex min-h-[430px] w-full max-w-[1280px] items-end px-margin-desktop pb-section-gap pt-24">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-label-md font-semibold text-white backdrop-blur">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  Japanese learning journal
                </div>
                <h1 className="font-display-lg text-display-lg text-on-primary mb-stack-md">Blog</h1>
                <p className="max-w-2xl font-body-lg text-body-lg text-inverse-on-surface/90">
                  Practical Japanese learning guides, culture notes, and JLPT study resources from JPMaster.
                </p>
                <div className="mt-stack-lg grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/20 bg-white/12 p-3 text-white backdrop-blur">
                    <p className="text-headline-md font-bold">{totalCount}</p>
                    <p className="text-label-md text-white/80">Articles</p>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/12 p-3 text-white backdrop-blur">
                    <p className="text-headline-md font-bold">{categories.length}</p>
                    <p className="text-label-md text-white/80">Topics</p>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/12 p-3 text-white backdrop-blur">
                    <p className="text-headline-md font-bold">JLPT</p>
                    <p className="text-label-md text-white/80">Study focus</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </MotionSectionFrame>

        <MotionSectionFrame index={1} preset="sweep">
          <BlogFilterBar categories={categoryOptions} onCategoryChange={setCategory} onSearch={setSearch} />
        </MotionSectionFrame>

        <MotionSectionFrame index={2}>
          <section className="max-w-[1280px] mx-auto px-margin-desktop py-section-gap">
          <div className="mb-stack-lg flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-label-md font-black uppercase tracking-wide text-secondary">Latest from JPMaster</p>
              <Heading level="h2" size="headline-lg" className="mt-2 text-on-surface">Study articles and culture notes</Heading>
            </div>
            {!loading && !error && (
              <p className="text-body-md text-on-surface-variant">
                Showing {blogs.length} of {totalCount} {totalCount === 1 ? 'article' : 'articles'}
                {category !== 'All Topics' ? ` in ${category}` : ''}
              </p>
            )}
          </div>

          <div className="mb-stack-lg flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-2">
            <span className="ml-2 mr-1 inline-flex items-center gap-2 text-label-md font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              Time
            </span>
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setTimeFilter(filter.value)}
                className={`min-h-9 rounded-lg px-3 text-label-md transition-colors ${
                  timeFilter === filter.value
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading && <BlogListSkeleton />}
          {error && (
            <div className="rounded-xl border border-error/25 bg-error/5 p-stack-lg text-error">
              {error}
            </div>
          )}
          {!loading && !error && blogs.length === 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface p-section-gap text-center">
              <span className="material-symbols-outlined text-display-md text-outline">search_off</span>
              <Heading level="h2" size="headline-md" className="text-on-surface mb-2">No articles found</Heading>
              <p className="text-on-surface-variant">Try a different category or search keyword.</p>
            </div>
          )}

          {!loading && !error && featuredPost && (
            <>
              <div className="mb-section-gap">
                <div className="mb-stack-md flex items-center justify-between">
                  <h3 className="text-headline-md font-semibold text-on-surface">Featured article</h3>
                  <p className="text-body-md text-on-surface-variant">Latest published post</p>
                </div>
                <div className="grid grid-cols-1 gap-gutter lg:grid-cols-[1.15fr_1fr_1fr]">
                  <FeaturedBlogCard {...toCardProps(featuredPost)} />
                  {posts.slice(0, 2).map((post) => (
                    <BlogCard key={post.blog_id} {...toCardProps(post)} />
                  ))}
                </div>
              </div>

              {latestPosts.length > 0 && (
                <div className="mb-stack-lg flex items-center justify-between border-t border-outline-variant pt-stack-lg">
                  <h3 className="text-headline-md font-semibold text-on-surface">More articles</h3>
                </div>
              )}

              {latestPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-section-gap">
                  {latestPosts.map((post) => (
                    <BlogCard key={post.blog_id} {...toCardProps(post)} />
                  ))}
                </div>
              )}
              <Pagination page={page} pageSize={pageSize} itemCount={blogs.length} totalCount={totalCount} onPageChange={setPage} className="mt-section-gap" />
            </>
          )}
          </section>
        </MotionSectionFrame>
      </main>
      <Footer />
    </div>
  );
}
