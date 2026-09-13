import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const article = await adminDb.collection('articles').doc(decodeURIComponent(slug)).get();
    const image = article.data()?.image as string | undefined;

    if (image?.startsWith('data:image/')) {
      const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        return new Response(Buffer.from(match[2], 'base64'), {
          headers: {
            'Content-Type': match[1],
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    }

    if (image?.startsWith('http://') || image?.startsWith('https://')) {
      return Response.redirect(image, 302);
    }
  } catch {
    // Use the site image below when an article image cannot be read.
  }

  return Response.redirect(new URL('/logomultinasnews.png', request.url), 302);
}
