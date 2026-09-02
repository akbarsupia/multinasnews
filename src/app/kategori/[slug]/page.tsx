'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const PAGE_SIZE = 10;

export default function KategoriPage() {
  const params = useParams();
  const slug = params?.slug as string || '';
  const categoryName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '';
  
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastArticle, setLastArticle] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!categoryName) return;
      try {
        // Fetch only articles matching the category. 
        // No orderBy to avoid missing Index errors in Firestore.
        let q;
        if (categoryName.toLowerCase() === 'semua' || !categoryName) {
           q = query(collection(db, 'articles'), where('status', '==', 'published'), limit(PAGE_SIZE));
        } else {
           q = query(collection(db, 'articles'), where('category', '==', categoryName), where('status', '==', 'published'), limit(PAGE_SIZE));
        }
        
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setArticles(data);
        setLastArticle(snap.docs.at(-1) || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [categoryName]);

  const loadMore = async () => {
    if (!lastArticle || loadingMore) return;
    setLoadingMore(true);
    try {
      const constraints = categoryName.toLowerCase() === 'semua'
        ? [where('status', '==', 'published'), startAfter(lastArticle), limit(PAGE_SIZE)]
        : [where('category', '==', categoryName), startAfter(lastArticle), limit(PAGE_SIZE)];
      const snap = await getDocs(query(collection(db, 'articles'), ...constraints));
      setArticles((current) => [...current, ...snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))]);
      setLastArticle(snap.docs.at(-1) || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Gagal memuat kategori berikutnya:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderDate = (seconds: number) => {
      if (!seconds) return 'Baru Saja';
      return new Date(seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="max-w-screen-xl mx-auto py-12 md:py-20 px-6 fade-in min-h-[70vh]">
      <div className="border-b-4 border-slate-900 dark:border-white pb-6 mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
         <div>
            <span className="font-label font-bold text-xs tracking-widest uppercase text-cyan-500 mb-2 block">Indeks Berita Spesifik</span>
            <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter text-slate-900 dark:text-white uppercase">{categoryName}</h1>
         </div>
         <span className="font-public-sans font-medium text-slate-500 capitalize">{loading ? 'Memuat...' : `${articles.length} Berita Teratas`}</span>
      </div>
      
      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
            {[1, 2, 3, 4].map(i => (
               <div key={i} className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-xl mb-6"></div>
            ))}
         </div>
      ) : articles.length > 0 ? (
         <>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {articles.map((article, i) => (
              <Link href={`/berita/${article.id}`} key={i} className="group cursor-pointer">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-xl mb-6 overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                    <img src={article.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={article.title} loading="lazy" decoding="async"/>
                </div>
                <p className="font-label text-xs font-bold text-cyan-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[14px]">schedule</span> {categoryName} • {renderDate(article.createdAt?.seconds)}
                </p>
                <h2 className="font-headline font-bold text-2xl group-hover:text-cyan-500 transition-colors line-clamp-3 dark:text-slate-100 leading-snug">{article.title}</h2>
              </Link>
            ))}
         </div>
         {hasMore && <div className="mt-12 text-center"><button onClick={loadMore} disabled={loadingMore} className="rounded-xl bg-slate-900 dark:bg-cyan-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60">{loadingMore ? 'Memuat...' : 'Muat berita lainnya'}</button></div>}
         </>
      ) : (
         <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl mt-10">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">article</span>
            <h3 className="font-headline text-3xl font-black text-slate-400 dark:text-slate-600">Kategori Ini Masih Kosong</h3>
            <p className="text-slate-500 mt-2">Belum ada liputan berita yang diterbitkan untuk kategori {categoryName}.</p>
         </div>
      )}
    </div>
  );
}
