'use client'
import { useState, useEffect, Suspense } from 'react';
import { auth } from '@/lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  User, 
  signOut,
  updateProfile
} from 'firebase/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AkunContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) setDisplayName(currentUser.displayName);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(user, { displayName });
      setSuccess('Profil berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.reload();
    } catch (err: any) {
      setError("Gagal login dengan Google.");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message.includes('auth/invalid-credential') ? 'Email atau kata sandi salah.' : err.message);
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
          
          <div className="md:w-72 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800 flex flex-col justify-between">
             <div className="space-y-2">
                <Link href="/akun" className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all text-sm ${activeTab === 'profile' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 translate-x-1' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-500'}`}>
                   <span className="material-symbols-outlined text-[22px]">account_circle</span> Profil Saya
                </Link>
                <Link href="/akun?tab=settings" className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all text-sm ${activeTab === 'settings' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 translate-x-1' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-500'}`}>
                   <span className="material-symbols-outlined text-[22px]">settings</span> Pengaturan
                </Link>
             </div>
             
             <button onClick={() => signOut(auth)} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm mt-8 border border-transparent hover:border-red-100">
                <span className="material-symbols-outlined text-[22px]">logout</span> Keluar
             </button>
          </div>

          <div className="flex-1 p-8 md:p-12 relative">
             {activeTab === 'profile' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-28 h-28 bg-cyan-100 dark:bg-cyan-900/30 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl rotate-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover -rotate-3" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-cyan-500 -rotate-3">person</span>
                      )}
                    </div>
                    <div className="text-center md:text-left pt-2">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-headline">{user.displayName || 'Pengguna Multinas'}</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-body font-medium flex items-center justify-center md:justify-start gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        {user.email}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-2 justify-center md:justify-start">
                         <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Member Aktif</span>
                         <span className="px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-full text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest leading-none">Terverifikasi</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined text-cyan-500 mb-2">article</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Berita Disimpan</p>
                     </div>
                     <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined text-cyan-500 mb-2">forum</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">5</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Komentar Publik</p>
                     </div>
                  </div>
                </div>
             ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="mb-10">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-headline leading-tight">Pengaturan Profil</h2>
                      <p className="text-slate-500 text-sm">Sesuaikan identitas digital Anda di portal multinasnews.</p>
                   </div>
                   
                   <form onSubmit={handleUpdateProfile} className="max-w-md space-y-6">
                      <div className="space-y-2">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Tampilan Publik</label>
                         <input 
                            type="text" 
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all dark:text-white text-sm"
                            placeholder="Contoh: Rian Akbar"
                         />
                      </div>
                      
                      {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-xl border border-red-100">{error}</p>}
                      {success && <p className="text-emerald-500 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 py-3 px-4 rounded-xl border border-emerald-100">{success}</p>}

                      <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                   </form>

                   <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-[10px]">Preferensi Keamanan</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-cyan-200 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-cyan-500 text-xl">notifications_active</span>
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Notifikasi Pintar</p>
                                <p className="text-[10px] text-slate-400">Terima berita sela lewat browser</p>
                              </div>
                           </div>
                           <div className="w-12 h-6 bg-cyan-500 rounded-full relative p-1 cursor-pointer">
                              <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-center mb-10">
            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white font-headline">
              multinas<span className="text-cyan-500">news</span>
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 font-headline leading-tight">
            {isLogin ? 'Selamat Datang Kembali' : 'Bergabunglah Bersama Kami'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-12 font-body px-4 opacity-80">
            {isLogin ? 'Masuk ke akun Anda untuk pengalaman yang lebih personil.' : 'Daftar sekarang untuk mendapatkan akses berita eksklusif.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Digital Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-7 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all dark:text-white text-sm"
                placeholder="rian@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Secret Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-7 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all dark:text-white text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-[11px] text-center font-bold px-4 bg-red-50 dark:bg-red-900/20 py-3 rounded-xl border border-red-100">{error}</p>}

            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs">
               {isLogin ? 'Akses Sekarang' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="relative my-12 text-center">
            <hr className="border-slate-100 dark:border-slate-800" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Login</span>
          </div>

          <button onClick={handleGoogleLogin} type="button" className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-cyan-500 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google Akun
          </button>

          <div className="mt-12 text-center text-[13px]">
            <p className="text-slate-400 dark:text-slate-500 font-body">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <span onClick={() => setIsLogin(!isLogin)} className="text-cyan-500 dark:text-cyan-400 font-black ml-2 cursor-pointer hover:underline underline-offset-4">
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AkunPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-label">Memuat Sistem Akun...</div>}>
      <AkunContent />
    </Suspense>
  );
}
