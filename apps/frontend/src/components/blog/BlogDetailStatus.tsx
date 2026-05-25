import { Link } from 'react-router-dom';

export function BlogDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="mx-auto h-5 w-32 rounded bg-surface-container" />
      <div className="mx-auto h-12 w-3/4 rounded bg-surface-container" />
      <div className="h-[420px] rounded-xl bg-surface-container" />
      <div className="mx-auto h-5 w-5/6 rounded bg-surface-container" />
      <div className="mx-auto h-5 w-2/3 rounded bg-surface-container" />
    </div>
  );
}

export function BlogDetailError({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-error/25 bg-error/5 p-stack-lg text-center">
      <p className="mb-4 text-error">{error}</p>
      <Link to="/blog" className="text-primary font-semibold hover:underline">Back to Blog</Link>
    </div>
  );
}
