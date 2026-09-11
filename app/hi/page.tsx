import Link from 'next/link';
import { getAllPostsHi } from '@/lib/posts';

export const metadata = {
  title: 'ब्लॉग',
  description: 'वेब डेवलपमेंट पर विचार, गाइड और नोट्स।',
  alternates: {
    canonical: '/hi',
    languages: {
      en: '/',
      hi: '/hi',
    },
  },
};

export default function HomeHi() {
  const posts = getAllPostsHi();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16" lang="hi">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            ब्लॉग
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            वेब डेवलपमेंट पर विचार, गाइड और नोट्स।
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          English
        </Link>
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
                href={`/hi/${post.slug}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground line-clamp-3">
              {post.content}
            </p>
            <Link
              href={`/hi/${post.slug}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              पूरा पढ़ें &rarr;
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('hi-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
