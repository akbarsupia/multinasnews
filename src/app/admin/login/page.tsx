'use client'
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logSentinelBreach, checkLocalSentinelBan } from '@/lib/sentinelSecurity';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sentinel Check: Pantau apakah perangkat ini sudah diblokir sebelumnya
  useEffect(() => {
    if (checkLocalSentinelBan()) {
      window.location.href = 'about:blank';
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const tokenResult = await user.getIdTokenResult(true);
      // Admin, editor, dan reporter adalah anggota portal yang sah.
      if (user.email?.toLowerCase() === 'multinasnews@gmail.com' || ['editor', 'reporter'].includes(tokenResult.claims.role as string)) {
        router.push('/admin');
      } else {
        // BUKAN ADMIN: Jalankan Protokol Digital Black Hole (Ban Permanen)
        await signOut(auth);
        await logSentinelBreach(email);
        // Baris di bawah tidak akan tercapai karena redirect di logSentinelBreach
        setLoading(false);
      }
    } catch (err: any) {
      setError('Email atau kata sandi admin salah. Harap periksa kembali kredensial Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative group">
               <img src="/logomultinasnews.PNG" alt="Logo" className="h-16 w-auto drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-headline tracking-tighter">
            Gerbang <span className="text-cyan-500">Redaksi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 font-body opacity-80">
            Masuk untuk mengelola portal berita multinasional Anda secara real-time.
          </p>

          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Email Redaksi</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all dark:text-white text-sm"
                placeholder="multinasnews@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Access Token / Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all dark:text-white text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 fade-in">
                 <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">warning</span>
                 <p className="text-red-600 dark:text-red-400 text-[11px] font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-cyan-500 hover:bg-black dark:hover:bg-cyan-600 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
               {loading ? (
                 <><span className="material-symbols-outlined animate-spin">sync</span> Memverifikasi...</>
               ) : (
                 <><span className="material-symbols-outlined text-[18px]">lock_open</span> Masuk Dasbor</>
               )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
             <Link href="/" className="text-[11px] font-bold text-slate-400 hover:text-cyan-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali ke Beranda Publik
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
