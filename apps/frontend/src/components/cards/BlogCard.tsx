import { Link } from 'react-router-dom';
import { Card, ImageCard, CategoryBadge } from '../ui';
import { Heading, Text } from '../ui/Typography';

interface BlogCardProps {
  title: string;
  category: string;
  date: string;
  image?: string | null;
  excerpt: string;
  link?: string;
}

export function BlogCard({ title, category, date, image, excerpt, link }: BlogCardProps) {
  const imageUrl = image || 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80';

  return (
    <Card className="group bg-surface border border-outline-variant rounded-xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
      <div className="relative overflow-hidden">
        <ImageCard src={imageUrl} alt={title} hoverScale={105} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-stack-md flex flex-col flex-grow">
        <div className="mb-2 w-fit transition-transform duration-300 group-hover:-translate-y-0.5">
          <CategoryBadge category={category} variant="primary" />
        </div>
        <Heading level="h3" size="headline-md" className="text-on-surface mb-stack-sm transition-colors duration-300 group-hover:text-primary">
          {title}
        </Heading>
        <Text variant="body-md" color="on-surface-variant" className="mb-stack-md line-clamp-2 flex-grow">
          {excerpt}
        </Text>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-outline text-label-md">{date}</span>
          <Link to={link || '/blog'} className="inline-flex items-center gap-1 text-primary font-label-md text-label-md">
            Read More
            <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

interface FeaturedBlogCardProps extends BlogCardProps {
  featured?: boolean;
}

export function FeaturedBlogCard({
  title,
  category,
  date,
  image,
  excerpt,
  link,
}: FeaturedBlogCardProps) {
  const imageUrl = image || 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80';

  return (
    <article className="group bg-surface border border-primary/25 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden">
        <ImageCard src={imageUrl} alt={title} hoverScale={105} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute top-4 left-4 z-10">
          <CategoryBadge category="FEATURED" variant="featured" />
        </div>
      </div>
      <div className="p-stack-lg flex flex-col flex-grow">
        <div className="mb-stack-sm w-fit transition-transform duration-300 group-hover:-translate-y-0.5">
          <CategoryBadge category={category} variant="primary" />
        </div>
        <h2 className="font-headline-lg text-headline-md text-on-surface mb-stack-md group-hover:text-primary transition-colors">
          {title}
        </h2>
        <Text variant="body-md" color="on-surface-variant" className="mb-stack-lg line-clamp-3">
          {excerpt}
        </Text>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-outline text-label-md">{date}</span>
          <Link to={link || '/blog'} className="text-primary font-label-md text-label-md flex items-center gap-1 group/btn">
            Read More <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
