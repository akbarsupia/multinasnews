'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import ViewTracker from '@/components/ViewTracker';
import ArticleActions from '@/components/ArticleActions';

export default function BeritaDetail() {
  const params = useParams();
  const slug = decodeURIComponent(params?.slug as string || '');

  const [data, setData] = useState<any>(null);
  const [relatedArticle, setRelatedArticle] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'articles', slug));
        if (docSnap.exists()) {
          const raw = docSnap.data();
          setData({ id: docSnap.id, ...raw });

          // Fetch related
          try {
            const relSnap = await getDocs(
              query(collection(db, 'articles'),
                where('category', '==', raw.category),
                where('status', '==', 'published'),
                limit(3)
              )
            );
            const rel = relSnap.docs.find(d => d.id !== slug);
            if (rel) setRelatedArticle({ id: rel.id, title: rel.data().title });
          } catch (_) {}
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Fetch article error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-screen-md mx-auto py-20 px-5 animate-pulse space-y-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-32">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">search_off</span>
        <h1 className="font-headline font-black text-3xl mb-2 text-slate-800 dark:text-white">Berita Teredaksi / Nihil</h1>
        <p className="text-slate-500 mb-6">Berkas artikel yang Anda cari kemungkinan telah dihapus atau ditarik paksa oleh Pemimpin Redaktur.</p>
        <Link href="/" className="bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan-600 transition shadow-lg shadow-cyan-500/20">Kembali ke Beranda</Link>
      </div>
    );
  }

  const renderDate = () => {
    const ts = data.createdAt;
    if (!ts) return 'Baru Saja';
    const seconds = ts.seconds ?? ts._seconds;
    if (seconds) return new Date(seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    return 'Baru Saja';
  };

  return (
    <div className="max-w-screen-md mx-auto py-12 md:py-20 px-5 sm:px-6 fade-in selection:bg-red-200 selection:text-red-900">
      <ViewTracker articleId={slug} />

      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-500 font-label text-xs uppercase tracking-widest font-bold hover:text-cyan-700 transition-colors mb-6 border border-cyan-100 hover:border-cyan-200 bg-cyan-50/50 px-4 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Beranda
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-slate-900 dark:bg-cyan-500 text-white px-3 py-1 text-[10px] font-label font-black uppercase tracking-widest rounded shadow-sm">{data.category || 'BERITA TERBARU'}</span>
        </div>
        <h1 className="font-headline font-black text-4xl md:text-5xl lg:text-[56px] text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
          {data.title}
        </h1>
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

      {/* Gambar Cover */}
      <div className="w-full aspect-video md:aspect-[21/9] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden mb-10 shadow-lg border border-slate-200 dark:border-slate-800 relative group">
        {data.image ? (
          <img src={data.image.startsWith('/') ? data.image : data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50">
            <span className="material-symbols-outlined mb-2" style={{ fontSize: '60px' }}>mms</span>
            <span className="font-label text-xs uppercase tracking-widest font-bold">Tidak Ada Gambar Dokumentasi</span>
          </div>
        )}
      </div>

      {/* Konten */}
      <div className="prose prose-lg dark:prose-invert max-w-none font-body text-slate-800 dark:text-slate-200 leading-relaxed md:leading-[2.2] text-[17px] md:text-xl">
        {(data.content || '').split('\n').filter((p: string) => p.trim()).map((paragraph: string, idx: number) => {
          if (idx === 0 && paragraph.length > 50) {
            return (
              <p key={idx} className="mb-6 first-letter:float-left first-letter:text-6xl first-letter:font-black first-letter:pr-3 first-letter:font-headline first-letter:text-cyan-500 first-line:uppercase first-line:tracking-widest relative z-10 block">
                {paragraph}
              </p>
            );
          }
          return (
            <div key={idx}>
              <p className="mb-8">{paragraph}</p>
              {idx === 1 && relatedArticle && (
                <Link href={`/berita/${encodeURIComponent(relatedArticle.id)}`} className="block my-8 border-l-4 border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/30 px-5 py-4 no-underline hover:bg-cyan-100 dark:hover:bg-cyan-950/50 transition-colors rounded-r-xl">
                  <span className="font-label text-sm font-black text-slate-800 dark:text-white">Baca Juga: </span>
                  <span className="font-headline font-bold text-cyan-600 dark:text-cyan-400">{relatedArticle.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Artikel */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
        <p className="font-label text-xs md:text-[10px] uppercase tracking-widest text-slate-400 font-bold">© {new Date().getFullYear()} Hak Cipta multinasnews.id</p>
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
