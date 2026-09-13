import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://multinasnews.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ['/', '/redaksi', '/panduan', '/kontak', '/legalitas'].map((path) => ({
    url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '/' ? 1 : 0.6,
  }));
  
  try {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/multi-nasional/databases/(default)/documents/articles', {
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        const articlePages: MetadataRoute.Sitemap = data.documents.map((doc: any) => {
          const id = doc.name.split('/').pop();
          const createdAt = doc.createTime ? new Date(doc.createTime) : new Date();
          return {
            url: `${siteUrl}/berita/${id}`,
            lastModified: createdAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          };
        });
        return [...staticPages, ...articlePages];
      }
    }
    return staticPages;
  } catch (error) {
    console.error('Sitemap Firestore error:', error);
    return staticPages;
  }
}
