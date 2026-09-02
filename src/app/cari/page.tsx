'use client'

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, endAt, getDocs, limit, orderBy, query, startAt } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PAGE_SIZE = 10;

function SearchResults() {
  const searchParams = useSearchParams();
  const keyword = (searchParams.get('q') || '').trim();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) {
      setArticles([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Firestore only supports prefix search natively; the limit keeps each search inexpensive.
        const normalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        const result = await getDocs(query(
          collection(db, 'articles'), orderBy('title'), startAt(normalized), endAt(`${normalized}\uf8ff`), limit(PAGE_SIZE)
        ));
        setArticles(result.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Gagal mencari berita:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [keyword]);

  return <main className="max-w-screen-xl mx-auto py-12 md:py-20 px-6 min-h-[70vh]">
    <p className="font-label font-bold text-xs tracking-widest uppercase text-cyan-500 mb-2">Pencarian arsip</p>
    <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tight dark:text-white mb-10">Hasil: “{keyword || '...'}”</h1>
    {loading ? <p className="text-slate-500">Mencari berita...</p> : articles.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {articles.map((article) => <Link key={article.id} href={`/berita/${article.id}`} className="group rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-cyan-400 transition-colors">
        <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">{article.category || 'Berita'}</p>
        <h2 className="font-headline font-bold text-2xl dark:text-white group-hover:text-cyan-500 transition-colors">{article.title}</h2>
      </Link>)}
    </div> : <p className="text-slate-500">{keyword ? 'Tidak ada judul yang cocok.' : 'Masukkan kata kunci pada kolom pencarian.'}</p>}
  </main>;
}

export default function SearchPage() {
  return <Suspense fallback={<main className="max-w-screen-xl mx-auto py-12 md:py-20 px-6 min-h-[70vh] text-slate-500">Memuat pencarian...</main>}><SearchResults /></Suspense>;
}
