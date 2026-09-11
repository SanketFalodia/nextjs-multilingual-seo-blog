import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '@/lib/posts';

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.content.slice(0, 160),
    alternates: {
      canonical: `/${post.slug}`,
      languages: {
        en: `/${post.slug}`,
        hi: `/hi/${post.slug}`,
      },
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-block text-sm font-medium text-primary hover:underline mb-8"
      >
        &larr; Back to all posts
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
          href={`/hi/${post.slug}`}
          className="mt-10 inline-block text-sm font-medium text-primary hover:underline"
        >
          हिन्दी में पढ़ें &rarr;
        </Link>
      </article>
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
