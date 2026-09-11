import fs from 'fs';
import path from 'path';

export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  date: string;
}

const postsDirectory = path.join(process.cwd(), 'data');

export function getAllPosts(): Post[] {
  const filePath = path.join(postsDirectory, 'posts.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const posts: Post[] = JSON.parse(jsonData);
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug);
}
