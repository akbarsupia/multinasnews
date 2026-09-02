'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const defaultImg = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80";
const PAGE_SIZE = 10;

const fallbackCarousel = [
  { id: 'baca', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAp1C1ITKCVYy6PqutN5KwUk6ugSeFYuzLuLioMk-hzoPKjZnrewPTcuxr9lMXCx7RQq0f72mXRTDxSeUs3BSxlAnpLxymvjjAQnqpvn52bZsaIpnC8NeJtCFtbpjsihOegpd0DD7w03MMpAjpW2ravLbKFAOF4_kMLclKOqcwYGDJiCeKMbD2Uq1GnLTjlaJbn7TQZHVosVdndvaTn6FBARJerLaW3k1asJbAnpHdF3-NT503SUhp0ZpIb7W485BX6zE6rMHdU5_A", title: "Transformasi Digital: Menuju Era Ekonomi Pasca-Globalisasi", tag: "EKONOMI", time: "15 MENIT LALU", desc: "Analisis mendalam mengenai pergeseran kekuatan ekonomi global dan pengaruh sistem digital baru." },
  { id: 'baca', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFkvwx9G5DJ0bus1IPTgD3rSJmcyYDn38ju7Jj7C1iOT_5krFJi7WiKIDmg3EQpINsO4OmqrD2pOwLKJfgQTAPseJEjLf1PBiABJogSDLqNuxj0OLPSE8GVa7p3_wmc2_0xKgCOBei95SZau-CdPw9WAD3gwqrQmsUneXhgGwrASO-9g_qbOWooMIRz-xmXFueP6fCGAu2GlyASG9o7euW6MTYYkKeKZMtz6E1WGFz_LTj3yxEXaLq4fOxWMtECdxpYo2L4amS0LE", title: "Progres Pembangunan Ibukota: Fokus Infrastruktur Inti", tag: "NASIONAL", time: "1 JAM LALU", desc: "Pemerintah memastikan penyelesaian tahap pertama dikebut." },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [editorPicks, setEditorPicks] = useState<any[]>([]);
  const [lastArticle, setLastArticle] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbArticles(fetched);
        setLastArticle(snap.docs.at(-1) || null);
        setHasMore(snap.docs.length === PAGE_SIZE);

        const picksSnap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('views', 'desc'), limit(3)));
        setEditorPicks(picksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Gagal load berita:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const loadMore = async () => {
    if (!lastArticle || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), startAfter(lastArticle), limit(PAGE_SIZE)));
      setDbArticles((current) => [...current, ...next.docs.map((doc) => ({ id: doc.id, ...doc.data() }))]);
      setLastArticle(next.docs.at(-1) || null);
      setHasMore(next.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Gagal memuat berita berikutnya:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Carousel auto-play
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (dbArticles.length > 0 ? Math.min(dbArticles.length, 3) : fallbackCarousel.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, dbArticles]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-12 max-w-screen-xl mx-auto py-8 px-4">
        <div className="h-[28rem] bg-surface-container-highest dark:bg-slate-800 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="h-48 bg-surface-container-highest dark:bg-slate-800 rounded-xl"></div>
           <div className="h-48 bg-surface-container-highest dark:bg-slate-800 rounded-xl"></div>
           <div className="h-48 bg-surface-container-highest dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Data Mapping Real-Time
  const hasData = dbArticles.length > 0;
  
  // 1. Carousel Slider (Maks 3 Artikel Terbaru)
  const carouselItems = hasData 
    ? dbArticles.slice(0, 3).map(a => ({
        id: a.id,
        img: a.image || defaultImg,
        title: a.title,
        tag: a.category || 'BERITA',
        time: "TERUPDATE",
        desc: a.content ? a.content.substring(0, 150) + "..." : ""
      }))
    : fallbackCarousel;

  // 2. Artikel Sorotan Bawah (Indeks ke-3)
  const mainNews = hasData && dbArticles.length > 3 ? dbArticles[3] : null;
  
  // 3. Artikel Grid Kecil (Indeks ke-4 & 5)
  const subNews = hasData && dbArticles.length > 4 ? dbArticles.slice(4, 6) : [];

  // 4. Sisa Artikel (Indeks 6 ke atas)
  const restNews = hasData && dbArticles.length > 6 ? dbArticles.slice(6) : [];
  const displayedPicks = editorPicks.length > 0 ? editorPicks : dbArticles.slice(0, 3);

  return (
    <div className="fade-in block max-w-screen-xl mx-auto px-4 md:px-6">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          
          {/* HERO CAROUSEL */}
          <div className="lg:col-span-8 group relative overflow-hidden rounded-xl bg-slate-900 shadow-xl min-h-[28rem] md:min-h-[32rem] flex items-end border border-slate-200 dark:border-slate-800">
            {carouselItems.map((data, idx) => (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <img alt={data.title} className="w-full h-full object-cover transition-transform duration-[10000ms] ease-linear scale-110 group-hover:scale-125 opacity-70" src={data.img} loading={idx === 0 ? 'eager' : 'lazy'} fetchPriority={idx === 0 ? 'high' : 'auto'} decoding="async"/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-3xl">
                  <div className="flex gap-3 mb-4 animate-slide-up bg-black/40 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <span className="text-red-500 text-[10px] font-label font-black uppercase tracking-widest flex items-center gap-1.5 origin-left"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> {data.tag}</span>
                    <span className="text-white/60 text-[10px] font-label font-bold uppercase tracking-widest border-l border-white/20 pl-3">{data.time}</span>
                  </div>
                  <h1 className="font-headline text-3xl md:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight drop-shadow-lg group-hover:underline decoration-cyan-500 underline-offset-8 transition-all animate-slide-up-delayed line-clamp-3">
                   {data.title}
                  </h1>
                  <p className="text-white/80 text-lg md:text-xl font-light mb-8 font-body leading-relaxed hidden sm:-webkit-box sm:[-webkit-line-clamp:2] sm:[-webkit-box-orient:vertical] sm:overflow-hidden drop-shadow">{data.desc}</p>
                  <Link href={`/berita/${encodeURIComponent(data.id || 'baca')}`} className="bg-white inline-flex text-slate-900 px-6 py-3 rounded-xl font-label font-bold text-xs hover:bg-slate-200 transition-colors items-center gap-2 relative z-20 cursor-pointer w-fit shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-1 transform">
                    BACA KRONOLOGI <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
            {/* Carousel Indicators */}
            <div className="absolute top-6 right-6 z-20 flex gap-1.5">
              {carouselItems.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}></button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="font-headline font-black text-2xl mb-8 flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
                 Editor's Picks <span className="material-symbols-outlined text-cyan-500">stars</span>
              </h3>
              <div className="space-y-5 relative z-10">
                {displayedPicks.map((article, index) => <div key={article.id}>
                  {index > 0 && <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-5"></div>}
                  <Link href={`/berita/${encodeURIComponent(article.id)}`} className="group block">
                    <span className="text-[10px] font-label font-bold text-cyan-500 mb-2 block tracking-widest uppercase">{article.category || 'PILIHAN EDITOR'}</span>
                    <h4 className="font-headline text-lg font-bold group-hover:text-cyan-500 transition-colors mb-2 dark:text-slate-100 leading-snug line-clamp-2">{article.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{article.content || 'Baca liputan pilihan redaksi selengkapnya.'}</p>
                  </Link>
                </div>)}
              </div>
            </div>
          </div>
        </section>
        
        {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="flex items-end justify-between mb-8 border-b-2 border-slate-800 pb-2">
                <h2 className="font-headline font-black text-3xl tracking-tight">Kabar <span className="text-cyan-500 italic">Terbaru</span></h2>
              </div>
              
              <div className="grid grid-cols-1 gap-10">
                {mainNews && (
                <Link href={`/berita/${encodeURIComponent(mainNews.id)}`} className="group block">
                  <div className="aspect-[21/9] bg-slate-200 dark:bg-slate-800 mb-5 overflow-hidden rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={mainNews.image || defaultImg} alt={mainNews.title} loading="lazy" decoding="async" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-red-700 px-3 py-1 text-[10px] font-bold tracking-widest rounded-md uppercase border border-red-100 shadow-sm">{mainNews.category}</div>
                  </div>
                  <h3 className="font-headline text-3xl lg:text-4xl font-black mb-3 group-hover:text-cyan-500 transition-colors dark:text-white leading-[1.2]">{mainNews.title}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-body">{mainNews.content}</p>
                </Link>
                )}

                {subNews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {subNews.map((sn, i) => (
                  <Link key={i} href={`/berita/${encodeURIComponent(sn.id)}`} className="flex flex-col sm:flex-row gap-4 sm:gap-5 group bg-slate-50 dark:bg-slate-900 p-4 rounded-xl hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800 hover:border-cyan-200">
                    <div className="w-full h-40 sm:w-28 sm:h-28 flex-shrink-0 bg-slate-200 dark:bg-slate-800 overflow-hidden rounded-lg relative">
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={sn.image || defaultImg} alt={sn.title} loading="lazy" decoding="async"/>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">{sn.category}</span>
                      <h4 className="font-headline font-bold text-lg group-hover:text-cyan-500 transition-colors leading-snug dark:text-white line-clamp-3 sm:line-clamp-2">{sn.title}</h4>
                    </div>
                  </Link>
                  ))}
                </div>
                )}

                {/* Sisa Artikel Bawah */}
                {restNews.length > 0 && (
                <div className="space-y-6 mt-8 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800">
                  {restNews.map((article, i) => (
                    <Link key={i} href={`/berita/${encodeURIComponent(article.id)}`} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-800 fade-in">
                      <div className="w-full sm:w-32 md:w-48 aspect-video flex-shrink-0 bg-slate-200 dark:bg-slate-800 overflow-hidden rounded-lg relative">
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={article.image || defaultImg} alt={article.title} loading="lazy" decoding="async"/>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 text-[8px] font-bold tracking-widest rounded uppercase">{article.category}</div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-headline font-bold text-xl md:text-2xl group-hover:text-cyan-500 transition-colors leading-snug dark:text-white line-clamp-3 sm:line-clamp-2">{article.title}</h4>
                        <p className="text-sm font-body mt-2 sm:mt-3 text-slate-500 line-clamp-3 sm:line-clamp-2">{article.content}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                )}
                {hasMore && (
                  <div className="pt-8 text-center">
                    <button onClick={loadMore} disabled={loadingMore} className="rounded-xl bg-slate-900 dark:bg-cyan-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60">
                      {loadingMore ? 'Memuat...' : 'Muat berita lainnya'}
                    </button>
                  </div>
                )}

              </div>
            </section>
          </div>
          
          <aside className="lg:col-span-4 space-y-12">
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <h2 className="font-headline font-black text-2xl uppercase tracking-tight mb-8 flex items-center gap-3 text-white">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full inline-block"></span>
                Trending Topik
              </h2>
              <div className="relative z-10 w-full">
                {dbArticles.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer relative pb-5 mb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                  <span className="font-headline text-5xl font-black text-white/10 group-hover:text-cyan-500/20 transition-colors leading-[0.8] select-none mt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col flex-1">
                    <span className="inline-block text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded w-fit mb-2">
                      {a.category}
                    </span>
                    <h4 className="font-headline font-bold text-[16px] md:text-lg group-hover:text-white transition-colors text-slate-300 leading-snug line-clamp-3">
                      {a.title}
                    </h4>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
        )}

        {!hasData && !loading && (
           <div className="py-20 text-center border-t border-slate-200 dark:border-slate-800 mt-10">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">article</span>
              <h3 className="font-headline text-3xl font-black text-slate-400 dark:text-slate-600">Belum Ada Naskah Berita Tambahan</h3>
              <p className="text-slate-500 mt-2">Gunakan Dashboard Admin untuk menerbitkan liputan terbaru ke halaman ini.</p>
           </div>
        )}
    </div>
  );
}

