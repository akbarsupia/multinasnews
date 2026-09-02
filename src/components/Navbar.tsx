'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [breakingNews, setBreakingNews] = useState<{ text: string; active: boolean } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Initialize theme from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    getDoc(doc(db, 'siteSettings', 'breakingNews'))
      .then((snapshot) => snapshot.exists() && setBreakingNews(snapshot.data() as { text: string; active: boolean }))
      .catch((error) => console.error('Gagal memuat breaking news:', error));

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const showToast = (msg: string) => {
    let container = document.getElementById('toast-container');
    if(!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-8 py-2 px-6 right-0 left-0 md:left-auto md:right-8 z-[100] flex flex-col items-center md:items-end gap-3 pointer-events-none';
        document.body.appendChild(container);
    }
    
    // Prevent duplicate active toasts with same message
    const existing = Array.from(container.children).find(c => (c as HTMLElement).innerText.includes(msg));
    if (existing) {
        (existing as HTMLElement).style.transform = 'scale(1.05)';
        setTimeout(() => (existing as HTMLElement).style.transform = 'scale(1)', 100);
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 border border-slate-800 text-white min-w-[280px] px-6 py-4 rounded-2xl shadow-2xl font-body text-xs flex items-center gap-4 transform translate-y-10 opacity-0 transition-all duration-500 pointer-events-auto';
    toast.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <span class="material-symbols-outlined text-cyan-500 text-lg">notifications</span>
        </div>
        <div class="flex-1">
            <p class="font-black text-white/90 uppercase tracking-tighter text-[9px] mb-0.5 opacity-50">Sistem Multinas</p>
            <p class="font-medium text-white/80">${msg}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    console.log("Switching theme to:", newDark ? "dark" : "light");
    
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      showToast('Mode Gelap diaktifkan.');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      showToast('Mode Terang diaktifkan.');
    }
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = searchTerm.trim();
    if (keyword) {
      router.push(`/cari?q=${encodeURIComponent(keyword)}`);
      setMobileMenuOpen(false);
    }
  };

  // Ekspor fungsi agar bisa dipanggil dari komponen lain (Page, Redaksi)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showToast = showToast;
    }
  }, []);

  const menuItems = ['Nasional', 'Internasional', 'Ekonomi', 'Teknologi', 'Pendidikan', 'Hiburan', 'Umum'];

  return (
    <>
      {isMounted && breakingNews?.active && breakingNews.text && <div id="urgency-ticker" className={`bg-tertiary-container text-on-tertiary-container py-2 px-6 overflow-hidden whitespace-nowrap fixed top-0 w-full z-[60] transition-transform duration-300 ${isScrolled ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4 text-xs font-label font-bold tracking-widest uppercase [&>span:nth-child(3)]:hidden [&>span:nth-child(4)]:hidden [&>span:nth-child(5)]:hidden">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">emergency</span> BREAKING NEWS</span>
          <span className="opacity-80">| {breakingNews.text}</span>
          <span className="opacity-80">| KTT Ekonomi Global di Jakarta Resmi Dibuka Hari Ini</span><span className="mx-4 opacity-30">•</span>
          <span className="opacity-80">Rupiah Menguat Terhadap Dollar AS di Sesi Pembukaan</span>
        </div>
      </div>}
      
      <nav id="top-nav" className={`fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/15 dark:border-slate-800/30 transition-all duration-300 ${isScrolled || !isMounted || !breakingNews?.active ? 'top-0 shadow-md' : 'top-[40px]'}`}>
        <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <img src="/logomultinasnews.png" alt="Logo Multinasnews" width="205" height="205" className="h-8 md:h-9 w-auto object-contain" />
              <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-headline">
                multinas<span className="text-cyan-500">news</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 font-headline tracking-tight font-bold text-lg">
              <Link href="/" className={`cursor-pointer transition-colors ${pathname === '/' ? 'text-slate-900 dark:text-white border-b-2 border-cyan-500 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Beranda</Link>
              <Link href="/redaksi" className={`cursor-pointer transition-colors ${pathname === '/redaksi' ? 'text-slate-900 dark:text-white border-b-2 border-cyan-500 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Redaksi</Link>
              {menuItems.map(item => (
                <Link key={item} href={`/kategori/${item.toLowerCase()}`} className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{item}</Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <form onSubmit={submitSearch} className="relative flex items-center bg-surface-container dark:bg-slate-800 rounded-full border border-outline-variant/15 dark:border-slate-700 px-2 py-1 transition-all duration-300">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-300 cursor-pointer p-1" onClick={() => setSearchOpen(!searchOpen)} style={{fontSize: 18}}>search</span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} id="searchInput" className={`bg-transparent border-none outline-none focus:ring-0 text-sm font-label transition-all duration-300 ${searchOpen ? 'w-32 sm:w-40 opacity-100' : 'w-0 opacity-0 pointer-events-none md:w-40 md:opacity-100 md:pointer-events-auto'} dark:text-white`} placeholder="Cari judul..." type="search" aria-label="Cari judul berita"/>
            </form>
            
            
            <button 
              onClick={() => showToast('Anda belum memiliki notifikasi baru.')}
              className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block dark:text-white"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">notifications</span>
            </button>
            <button 
              className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block dark:text-white" 
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-800 dark:text-white focus:outline-none">
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 absolute w-full left-0 shadow-md">
            <div className="px-6 py-4 space-y-4 font-headline font-bold text-lg flex flex-col items-start pb-6">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`w-full pl-3 ${pathname === '/' ? 'text-slate-900 dark:text-white border-l-4 border-cyan-500' : 'text-slate-500 dark:text-slate-400 border-l-4 border-transparent hover:text-slate-900'}`}>Beranda</Link>
              <Link href="/redaksi" onClick={() => setMobileMenuOpen(false)} className={`w-full pl-3 ${pathname === '/redaksi' ? 'text-slate-900 dark:text-white border-l-4 border-cyan-500' : 'text-slate-500 dark:text-slate-400 border-l-4 border-transparent hover:text-slate-900'}`}>Redaksi</Link>
              {menuItems.map(item => (
                <Link key={item} href={`/kategori/${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className={`w-full pl-3 ${pathname === `/kategori/${item.toLowerCase()}` ? 'text-slate-900 dark:text-white border-l-4 border-cyan-500' : 'text-slate-500 dark:text-slate-400 border-l-4 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors'}`}>{item}</Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

