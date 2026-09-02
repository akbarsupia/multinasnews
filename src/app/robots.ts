import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://multinasnews.com';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/mns-ctrl-7x9k2/', '/akun/', '/api/'] }, sitemap: `${siteUrl}/sitemap.xml` };
}
