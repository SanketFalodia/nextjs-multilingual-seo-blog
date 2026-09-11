import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export default function Home() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Blog
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Thoughts, guides, and notes on web development.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <time className="text-sm font-medium text-muted-foreground">
              {formatDate(post.date)}
            </time>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              <Link
                href={`/${post.slug}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground line-clamp-3">
              {post.content}
            </p>
            <Link
              href={`/${post.slug}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Read more &rarr;
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
