import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://multinasnews.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ['/', '/redaksi', '/panduan', '/kontak', '/legalitas'].map((path) => ({
    url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.6,
  }));
  try {
    const articles = await adminDb.collection('articles').select('createdAt').get();
    return [...staticPages, ...articles.docs.map((article) => ({
      url: `${siteUrl}/berita/${article.id}`,
      lastModified: article.data().createdAt?.toDate?.() || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))];
  } catch (error) {
    console.error('Sitemap Firestore error:', error);
    return staticPages;
  }
}
