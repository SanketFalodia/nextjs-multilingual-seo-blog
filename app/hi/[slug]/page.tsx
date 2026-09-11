import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPostsHi, getPostBySlugHi } from '@/lib/posts';

export function generateStaticParams() {
  const posts = getAllPostsHi();
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlugHi(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.content.slice(0, 160),
    alternates: {
      canonical: `/hi/${post.slug}`,
      languages: {
        en: `/${post.slug}`,
        hi: `/hi/${post.slug}`,
      },
    },
  };
}

export default function PostPageHi({ params }: { params: { slug: string } }) {
  const post = getPostBySlugHi(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16" lang="hi">
      <Link
        href="/hi"
        className="inline-block text-sm font-medium text-primary hover:underline mb-8"
      >
        &larr; सभी पोस्ट पर वापस जाएं
      </Link>

      <article>
        <time className="text-sm font-medium text-muted-foreground">
          {formatDate(post.date)}
        </time>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>
        <div className="mt-6 leading-relaxed text-foreground">
          <p>{post.content}</p>
        </div>

        <Link
          href={`/${post.slug}`}
          className="mt-10 inline-block text-sm font-medium text-primary hover:underline"
        >
          Read in English &rarr;
        </Link>
      </article>
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
