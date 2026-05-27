import { useParams } from 'react-router-dom';
import { Header, Footer, Breadcrumbs } from '../components';
import {
  BlogContentRenderer,
  BlogDetailError,
  BlogDetailLoading,
  BlogHero,
  BlogSidebar,
  RelatedPosts,
} from '../components/blog';
import { useBlogDetail } from '../hooks/blog/useBlogDetail';

export default function BlogDetail() {
  const { id } = useParams();
  const {
    blog,
    relatedPosts,
    loading,
    error,
    breadcrumbs,
    contentBlocks,
  } = useBlogDetail(id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-margin-desktop py-section-gap">
          {loading && <BlogDetailLoading />}
          {error && <BlogDetailError error={error} />}

          {!loading && !error && blog && (
            <article>
              <BlogHero blog={blog} />

              <div className="mt-section-gap grid grid-cols-1 gap-section-gap lg:grid-cols-[minmax(0,1fr)_320px]">
                <BlogContentRenderer blog={blog} contentBlocks={contentBlocks} />
                <BlogSidebar blog={blog} />
              </div>

              <RelatedPosts posts={relatedPosts} />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
