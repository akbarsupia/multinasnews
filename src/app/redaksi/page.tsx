'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function Redaksi() {
  const [loading, setLoading] = useState(true);
  const [pemred, setPemred] = useState<any>(null);
  const [redpel, setRedpel] = useState<any[]>([]);
  const [reporters, setReporters] = useState<any[]>([]);
  const displayRole = (journalist: any) => journalist.name === 'Supia Dirja'
    ? 'Pemimpin Perusahaan & Pemimpin Redaksi'
    : journalist.title;

  useEffect(() => {
    const fetchJournalists = async () => {
      try {
        // Ambil tanpa orderBy agar aman dari error missing-index Firestore
        const q = query(collection(db, 'journalists'));
        const snap = await getDocs(q);
        const allJ = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Urutkan manual (asc) agar struktur tidak acak
        allJ.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

        // Filter hirarki jabatan
        const pemredData = allJ.find(j => j.title.toLowerCase().includes('pemimpin redaksi') || j.title.toLowerCase().includes('pemred'));
        const redpelData = allJ.filter(j => 
            j.id !== pemredData?.id && 
            (j.title.toLowerCase().includes('redaktur') || j.title.toLowerCase().includes('manajer') || j.title.toLowerCase().includes('koordinator'))
        );
        const reporterData = allJ.filter(j => 
            j.id !== pemredData?.id && 
            !redpelData.find(r => r.id === j.id)
        );

        setPemred(pemredData);
        setRedpel(redpelData);
        setReporters(reporterData);
      } catch (err) {
        console.error("Error fetching journalists: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJournalists();
  }, []);

  const renderAvatar = (imgUrl: string, isBig: boolean = false) => {
    if (imgUrl) {
       return <img src={imgUrl} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" alt="Avatar"/>;
    }
    return (
       <div className={`w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700" style={{ fontSize: isBig ? '120px' : '50px' }}>{isBig ? 'account_circle' : 'person'}</span>
       </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-12 max-w-screen-xl mx-auto py-12 px-6">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-screen-xl mx-auto px-6">
      <div className="text-center py-16 md:py-24 max-w-4xl mx-auto space-y-6">
        <span className="font-label font-bold text-xs uppercase tracking-widest text-cyan-500 block">THE CORE PILLARS</span>
        <h1 className="font-headline font-black text-6xl md:text-8xl tracking-tighter text-slate-900 dark:text-white">Struktur Redaksi</h1>
        <p className="font-headline text-xl md:text-2xl italic font-light text-slate-600 dark:text-slate-400">"Kemandirian editorial adalah denyut nadi jurnalisme kami."</p>
      </div>
      
      <div className="space-y-32 mb-32">
        {pemred && (
        <section>
          <div className="flex bg-white dark:bg-slate-900 overflow-hidden border border-outline-variant/30 dark:border-slate-800 shadow-sm rounded-lg group hover:shadow-2xl transition-all duration-500">
            <div className="w-1/3 bg-slate-100 dark:bg-slate-800 relative hidden md:block overflow-hidden flex items-center justify-center">
               {renderAvatar(pemred.img, true)}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/10 group-hover:opacity-0 transition-opacity duration-700"></div>
            </div>
            <div className="w-full md:w-2/3 p-10 md:p-16 flex flex-col justify-center">
              <span className="font-label font-bold text-xs tracking-widest text-cyan-500 uppercase mb-4 block">{displayRole(pemred)}</span>
              <h2 className="font-headline font-black text-4xl mb-4 group-hover:text-cyan-500 transition-colors dark:text-white">{pemred.name}</h2>
              <p className="font-body text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-lg">{pemred.bio || 'Memandu visi masa depan multinasnews.id dengan panduan etika jurnalistik yang mutlak.'}</p>
              <Link href={`/profil/${pemred.slug}`} className="self-start font-label text-sm font-bold border-b border-transparent group-hover:border-cyan-500 group-hover:text-cyan-500 transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer relative z-20">Baca Profil Lengkap <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
            </div>
          </div>
        </section>
        )}
        
        {redpel.length > 0 && (
        <section>
          <h3 className="font-headline font-bold text-2xl border-b-2 border-slate-200 dark:border-slate-800 pb-4 mb-8">Redaksi Pelaksana & Manajerial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {redpel.map((j) => (
            <Link key={j.id} href={`/profil/${j.slug}`} className="block bg-white dark:bg-slate-900 p-8 rounded-xl border border-outline-variant/15 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-900 transition-colors group cursor-pointer shadow-sm hover:shadow-lg">
              <div className="flex items-center gap-6 mb-6">
                 <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                     {renderAvatar(j.img, false)}
                 </div>
                 <div>
                    <h4 className="font-headline font-bold text-2xl mb-1 group-hover:text-cyan-500 transition-colors dark:text-white">{j.name}</h4>
                    <span className="font-label text-xs uppercase text-slate-500 tracking-widest font-bold">{j.title}</span>
                 </div>
              </div>
              <p className="text-base font-body leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">{j.bio || 'Anggota inti dewan redaksi multinasnews.'}</p>
            </Link>
            ))}
          </div>
        </section>
        )}

        {reporters.length > 0 && (
        <section>
          <h3 className="font-headline font-bold text-2xl border-b-2 border-slate-200 dark:border-slate-800 pb-4 mb-8">Tim Jurnalis Lapangan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {reporters.map((j) => (
            <Link key={j.id} href={`/profil/${j.slug}`} className="bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group">
               <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-slate-100 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {renderAvatar(j.img, false)}
               </div>
               <h4 className="font-headline font-bold text-lg group-hover:text-cyan-500 transition-colors dark:text-white">{j.name}</h4>
               <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold">{j.title}</p>
            </Link>
            ))}
          </div>
        </section>
        )}

        {!pemred && redpel.length === 0 && reporters.length === 0 && (
           <div className="text-center py-24 text-slate-500">
               <span className="material-symbols-outlined text-6xl opacity-20 mb-4 block">group_off</span>
               <p className="font-headline text-2xl">Masih Kosong</p>
               <p className="mt-2 text-sm">Silakan tambahkan anggota baru melalui Dashboard Admin.</p>
           </div>
        )}

      </div>
    </div>
  );
}

