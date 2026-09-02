'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilJurnalis() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const displayRole = data?.name === 'Supia Dirja'
    ? 'Pemimpin Perusahaan & Pemimpin Redaksi'
    : data?.title;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, 'journalists'), where('slug', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setData(snap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pb-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-32">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
        <h1 className="font-headline font-black text-3xl mb-2">Jurnalis Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-6">ID Press yang Anda tuju mungkin salah atau telah dinonaktifkan.</p>
        <Link href="/redaksi" className="bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold">Kembali ke Struktur Redaksi</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto py-12 md:py-24 fade-in px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden max-w-4xl mx-auto group">
        
        {/* Lanyard Hole Mockup */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
           <div className="w-16 h-4 bg-slate-900/10 dark:bg-white/10 rounded-full mb-1"></div>
           <div className="w-12 h-20 bg-gradient-to-b from-cyan-500 to-cyan-700 -mt-2 rounded-b-xl shadow-lg relative">
              <div className="absolute inset-0 bg-black/10"></div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row relative mt-16 md:mt-0">
            {/* Sisi Kiri / Bagian Kartu Fisik Vertikal */}
            <div className="md:w-5/12 bg-slate-50 dark:bg-slate-950 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 flex">
                   <span className="material-symbols-outlined text-[100px] -rotate-12">breaking_news_alt_1</span>
                </div>
                
                <div className="text-center md:text-left relative z-10 pt-8 md:pt-0">
                   {data.verified !== false ? (
                      <div className="inline-block flex items-center gap-1 font-label mx-auto md:mx-0 w-fit px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-bold rounded-full mb-8">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> TERVERIFIKASI
                      </div>
                   ) : (
                      <div className="inline-block flex items-center gap-1 font-label mx-auto md:mx-0 w-fit px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-400 text-[10px] uppercase tracking-widest font-bold rounded-full mb-8">
                        <span className="material-symbols-outlined text-[14px]">warning</span> NON-AKTIF
                      </div>
                   )}
                </div>

                {/* Foto Profil Melayang */}
                <div className="relative -mt-4 flex justify-center z-10">
                   <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-xl transform rotate-3 transition-transform group-hover:rotate-0 duration-500 border border-slate-100">
                     {data.img ? (
                        <img src={data.img} className="w-full h-full object-cover rounded-xl grayscale-0 md:grayscale group-hover:grayscale-0 transition-all duration-500" alt={data.name}/>
                     ) : (
                        <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                           <span className="material-symbols-outlined text-slate-300" style={{fontSize: '80px'}}>person</span>
                        </div>
                     )}
                   </div>
                </div>

                <div className="text-center mt-8 relative z-10">
                   <h1 className="font-headline font-black text-3xl text-slate-900 dark:text-white mb-2">{data.name}</h1>
                   <div className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-widest py-2 px-4 rounded-xl inline-block mb-4 shadow-md w-full">
                     {displayRole}
                   </div>
                   
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-6 text-left shadow-sm">
                      <p className="font-label text-xs text-slate-400 uppercase tracking-wider mb-1">ID PRESS NUMBER</p>
                      <p className="font-mono text-lg font-bold tracking-tight text-cyan-500 dark:text-cyan-400 mb-3">{data.uid}</p>
                      
                      <div className="w-full h-12 bg-slate-100 rounded flex items-center justify-center overflow-hidden opacity-30 mt-2">
                         <div className="w-full h-full flex flex-row">
                           {[...Array(20)].map((_, i) => (
                             <div key={i} className={`h-full bg-black ${Math.random() > 0.5 ? 'w-1' : 'w-2'} ml-1`}></div>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
            </div>

            {/* Sisi Kanan / Informasi Detail Vertikal */}
            <div className="md:w-7/12 p-8 md:p-14 bg-white dark:bg-slate-900 flex flex-col justify-center">
                <div className="mb-10">
                    <h2 className="font-headline font-bold text-3xl mb-6 relative inline-block text-slate-800 dark:text-white">
                      Ringkasan Kredensial
                      <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-cyan-500 rounded-full"></div>
                    </h2>
                    <p className="font-body text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{data.bio || 'Tidak ada biodata tambahan yang dicantumkan.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div>
                       <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">
                          <span className="material-symbols-outlined text-[16px]">grade</span> Spesialisasi Isu
                       </span>
                       <p className="font-headline font-bold text-xl text-slate-800 dark:text-white">{data.specialty || 'General News / Hard News'}</p>
                    </div>
                    <div>
                       <span className="flex items-center gap-2 font-label text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span> Masa Bergabung
                       </span>
                       <p className="font-headline font-bold text-xl text-slate-800 dark:text-white">{data.joinDate}</p>
                    </div>
                </div>

                <div className={`mt-12 p-6 rounded-2xl flex items-start gap-4 ${data.verified !== false ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-cyan-900/20 border border-red-100 dark:border-red-800'}`}>
                   <div className={`${data.verified !== false ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-500 dark:text-cyan-400'} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">{data.verified !== false ? 'verified_user' : 'gpp_bad'}</span>
                   </div>
                   <div>
                      <h4 className={`font-bold mb-1 ${data.verified !== false ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'}`}>
                         {data.verified !== false ? 'Status Keanggotaan Terverifikasi' : 'Status Keanggotaan Belum Terverifikasi'}
                      </h4>
                      <p className={`text-sm font-body ${data.verified !== false ? 'text-emerald-700/80 dark:text-emerald-200/70' : 'text-red-700/80 dark:text-red-200/70'}`}>
                         {data.verified !== false 
                           ? 'Identitas jurnalis ini telah tercatat secara sah di pusat pangkalan data multinasnews. Segala tindakannya di lapangan dilindungi oleh undang-undang pers berlaku.' 
                           : 'Peringatan: Identitas jurnalis ini belum dikonfirmasi atau telah ditarik oleh dewan redaksi. Harap waspada terhadap penyalahgunaan nama.'}
                      </p>
                   </div>
                </div>
                
                <div className="mt-12">
                   <Link href="/redaksi" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-white rounded-xl font-bold transition-all text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white w-full sm:w-auto">
                      <span className="material-symbols-outlined">arrow_back</span> Kembali ke Struktur Redaksi
                   </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
