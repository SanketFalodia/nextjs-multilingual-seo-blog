import { MetadataRoute } from 'next';

const SITE_URL = 'https://nextjs-multilingual-seo-blog.s-falodia2006.workers.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}