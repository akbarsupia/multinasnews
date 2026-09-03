import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(slug);

  let title = 'Berita multinasnews.id';
  let description = 'Portal berita multinasional dengan komitmen jurnalistik independen, menyajikan kabar terkini.';
  let image = 'https://www.multinasnews.id/icon.png';

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/multi-nasional/databases/(default)/documents/articles/${decodedSlug}`, { 
      next: { revalidate: 60 } 
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.fields) {
        title = data.fields.title?.stringValue || title;
        
        const content = data.fields.content?.stringValue || '';
        if (content) {
          // Truncate to ~160 characters and remove HTML tags if any
          description = content.substring(0, 160).replace(/<[^>]*>?/gm, '') + '...';
        }
        
        const imgField = data.fields.image?.stringValue;
        if (imgField) {
          image = imgField.startsWith('/') ? `https://www.multinasnews.id${imgField}` : imgField;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching metadata for OG tags:", error);
  }

  return {
    title: `${title} - multinasnews.id`,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'article',
      url: `https://www.multinasnews.id/berita/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
