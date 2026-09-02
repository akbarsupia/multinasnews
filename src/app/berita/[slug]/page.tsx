import type { Metadata } from 'next';
import Link from 'next/link';
import { adminDb } from '@/lib/firebaseAdmin';
import ViewTracker from '@/components/ViewTracker';
import ArticleActions from '@/components/ArticleActions';

// --- SEO: Dynamic Metadata untuk setiap berita ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const docSnap = await adminDb.collection('articles').doc(slug).get();
    if (docSnap.exists) {
      const data = docSnap.data()!;
      const description = data.content ? data.content.substring(0, 160).replace(/\n/g, ' ') + '...' : 'Baca berita selengkapnya di multinasnews.id.';
      return {
        title: `${data.title} — multinasnews.id`,
        description,
        openGraph: {
          title: data.title,
          description,
          images: data.image ? [{ url: data.image, width: 1200, height: 630 }] : [],
          type: 'article',
          siteName: 'multinasnews.id',
        },
        twitter: {
          card: 'summary_large_image',
          title: data.title,
          description,
          images: data.image ? [data.image] : [],
        },
      };
    }
  } catch (err) {
    console.error('generateMetadata error:', err);
  }
  return {
    title: 'Berita — multinasnews.id',
    description: 'Baca berita terbaru di multinasnews.id.',
  };
}

// --- Server Component: Fetch data di server, render HTML untuk crawler & SEO ---
export default async function BeritaDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let data: any = null;
  let relatedArticle: { id: string; title: string } | null = null;
  try {
    const docSnap = await adminDb.collection('articles').doc(slug).get();
    if (docSnap.exists) {
      const raw = docSnap.data()!;
      data = {
        id: docSnap.id,
        ...raw,
        // Konversi Firestore Timestamp ke plain object agar bisa di-render
        createdAt: raw.createdAt ? { seconds: raw.createdAt.seconds } : null,
      };
    }
  } catch (err) {
    console.error('Fetch article error:', err);
  }

  // Jika Data Berita Dihapus Paksa dari Admin Dashboard
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-32">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">search_off</span>
        <h1 className="font-headline font-black text-3xl mb-2 text-slate-800 dark:text-white">Berita Teredaksi / Nihil</h1>
        <p className="text-slate-500 mb-6">Berkas artikel yang Anda cari kemungkinan telah dihapus atau ditarik paksa oleh Pemimpin Redaktur.</p>
        <Link href="/" className="bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan-600 transition shadow-lg shadow-cyan-500/20">Kembali ke Beranda</Link>
      </div>
    );
  }

  try {
    const relatedSnap = await adminDb.collection('articles')
      .where('category', '==', data.category)
      .where('status', '==', 'published')
      .limit(3)
      .get();
    const related = relatedSnap.docs.find((article) => article.id !== slug);
    if (related) relatedArticle = { id: related.id, title: related.data().title };
  } catch (err) {
    console.error('Fetch related article error:', err);
  }
  
  // Format Tanggal Ke Bahasa Indonesia
  const renderDate = () => {
      if (data.createdAt && data.createdAt.seconds) {
         return new Date(data.createdAt.seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) + ' WIB';
      }
      return 'Baru Saja';
  }

  return (
    <div className="max-w-screen-md mx-auto py-12 md:py-20 px-5 sm:px-6 fade-in selection:bg-red-200 selection:text-red-900">
      
      {/* Client component: track view */}
      <ViewTracker articleId={slug} />

      {/* Header Artikel */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-500 font-label text-xs uppercase tracking-widest font-bold hover:text-cyan-700 transition-colors mb-6 border border-cyan-100 hover:border-cyan-200 bg-cyan-50/50 px-4 py-1.5 rounded-full">
           <span className="material-symbols-outlined text-[16px]">arrow_back</span> Beranda
        </Link>
        <div className="flex items-center gap-3 mb-4">
           <span className="bg-slate-900 dark:bg-cyan-500 text-white px-3 py-1 text-[10px] font-label font-black uppercase tracking-widest rounded shadow-sm">{data.category || 'BERITA TERBARU'}</span>
        </div>
        <h1 className="font-headline font-black text-4xl md:text-5xl lg:text-[56px] text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6 relative">
          {data.title}
        </h1>
        
        {/* Atribusi Jurnalis */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-label uppercase tracking-widest text-slate-500 font-bold border-t border-b border-slate-200 dark:border-slate-800 py-4 mb-8">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">account_circle</span> 
              <span>Jurnalis: <span className="text-slate-800 dark:text-slate-200 border-b border-red-200">{data.author && data.author.includes('@') ? 'Tim Redaksi' : (data.author || 'Tim Redaksi')}</span></span>
           </div>
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">history</span> 
              <span>{renderDate()}</span>
           </div>
        </div>
      </div>

      {/* Gambar Cover Utama */}
      <div className="w-full aspect-video md:aspect-[21/9] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden mb-10 shadow-lg border border-slate-200 dark:border-slate-800 relative group">
         {data.image ? (
            <img src={data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" fetchPriority="high" decoding="async"/>
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50">
               <span className="material-symbols-outlined mb-2" style={{fontSize: '60px'}}>mms</span>
               <span className="font-label text-xs uppercase tracking-widest font-bold">Tidak Ada Gambar Dokumentasi</span>
            </div>
         )}
      </div>

      {/* Konten Tulisan Dinamis */}
      <div className="prose prose-lg dark:prose-invert max-w-none font-body text-slate-800 dark:text-slate-200 leading-relaxed md:leading-[2.2] text-[17px] md:text-xl">
         {data.content.split('\n').filter((paragraph: string) => paragraph.trim()).map((paragraph: string, idx: number) => {
            // Deteksi Karakter Huruf Besar Paragraf Pertama (Drop Cap) jika panjangnya memenuhi syarat
            if (idx === 0 && paragraph.length > 50) {
               return (
                 <p key={idx} className="mb-6 first-letter:float-left first-letter:text-6xl first-letter:font-black first-letter:pr-3 first-letter:font-headline first-letter:text-cyan-500 first-line:uppercase first-line:tracking-widest relative z-10 block">
                    {paragraph}
                 </p>
               );
            }
            return <div key={idx}>
              <p className="mb-8">{paragraph}</p>
              {idx === 1 && relatedArticle && <Link href={`/berita/${relatedArticle.id}`} className="block my-8 border-l-4 border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/30 px-5 py-4 no-underline hover:bg-cyan-100 dark:hover:bg-cyan-950/50 transition-colors rounded-r-xl">
                <span className="font-label text-sm font-black text-slate-800 dark:text-white">Baca Juga: </span><span className="font-headline font-bold text-cyan-600 dark:text-cyan-400">{relatedArticle.title}</span>
              </Link>}
            </div>
         })}
      </div>
      
      {/* Tombol Interaksi Bawah */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
         <p className="font-label text-xs md:text-[10px] uppercase tracking-widest text-slate-400 font-bold">© {new Date().getFullYear()} Hak Cipta multinasnews.</p>
         <ArticleActions title={data.title} slug={slug} />
      </div>
      
      <div className="mt-12 text-center pb-20">
         <Link href="/" className="text-cyan-500 font-bold font-label uppercase tracking-widest text-xs hover:underline decoration-cyan-500 underline-offset-4">
            — Halaman Muka Beranda —
         </Link>
      </div>

    </div>
  );
}
