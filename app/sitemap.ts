import { MetadataRoute } from 'next';
import { getAllPosts, getAllPostsHi } from '@/lib/posts';

const SITE_URL = 'https://nextjs-multilingual-seo-blog.s-falodia2006.workers.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const postsHi = getAllPostsHi();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/hi`, lastModified: new Date() },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  const postRoutesHi: MetadataRoute.Sitemap = postsHi.map((post) => ({
    url: `${SITE_URL}/hi/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticRoutes, ...postRoutes, ...postRoutesHi];
}