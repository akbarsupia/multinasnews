import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.multinasnews.id';

function absoluteUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

export default async function Head({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const article = await adminDb.collection('articles').doc(decodeURIComponent(slug)).get();
    if (!article.exists) return null;

    const data = article.data() as { title?: string; content?: string; image?: string };
    const title = data.title || 'Berita | multinasnews';
    const description = (data.content || 'Berita terkini dari multinasnews.')
      .replace(/\s+/g, ' ')
      .slice(0, 160);
    const url = `${SITE_URL}/berita/${encodeURIComponent(slug)}`;
    const image = absoluteUrl(data.image);

    return (
      <>
        <title>{`${title} | multinasnews`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="multinasnews" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image && <meta property="og:image" content={image} />}
        {image && <meta property="og:image:secure_url" content={image} />}
        {image && <meta property="og:image:width" content="1200" />}
        {image && <meta property="og:image:height" content="675" />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
      </>
    );
  } catch {
    return null;
  }
}
