import { useState } from 'react';

interface BlogFilterBarProps {
  categories?: string[];
  onCategoryChange?: (category: string) => void;
  onSearch?: (query: string) => void;
}

export function BlogFilterBar({
  categories = ['All Topics', 'Study Tips', 'Japanese Culture', 'Grammar'],
  onCategoryChange,
  onSearch,
}: BlogFilterBarProps) {
  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <section className="sticky top-0 z-20 border-b border-outline-variant bg-surface/95 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md">
        <div className="flex flex-col gap-stack-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`min-h-10 rounded-lg px-4 py-2 font-label-md text-label-md transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {category}
            </button>
          ))}
          </div>
        <div className="relative w-full lg:w-96">
          <input
            className="min-h-12 w-full rounded-lg border border-outline-variant bg-surface pl-12 pr-4 font-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Search articles..."
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
        </div>
        </div>
      </div>
    </section>
  );
}
