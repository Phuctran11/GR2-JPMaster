import type { Blog } from '../../services/api';
import { getOpeningInitial } from './blogDetailUtils';

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

export function BlogContentRenderer({
  blog,
  contentBlocks,
}: {
  blog: Blog;
  contentBlocks: string[];
}) {
  return (
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
  );
}
