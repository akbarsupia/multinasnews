'use client'
import { useState } from 'react';

/**
 * Komponen interaktif untuk tombol Share & Bookmark di halaman berita.
 * Dipisahkan agar halaman utama bisa tetap jadi Server Component (SEO).
 */
export default function ArticleActions({ title, slug }: { title: string; slug: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/berita/${slug}`;
    
    // Coba Web Share API (mobile & browser modern)
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or API failed, fallback to clipboard
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      // Toast notification
      if ((window as any).showToast) {
        (window as any).showToast('Link berita disalin ke clipboard!');
      }
    } catch {
      // Final fallback
      prompt('Salin link berita:', url);
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if ((window as any).showToast) {
      (window as any).showToast(bookmarked ? 'Kliping dihapus.' : 'Disimpan ke kliping!');
    }
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={handleShare}
        title="Bagikan ke Rekan" 
        className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-cyan-100 hover:text-cyan-500 transition-colors shadow-sm border border-slate-100 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">share</span>
      </button>
      <button 
        onClick={handleBookmark}
        title="Simpan sebagai Kliping" 
        className={`w-12 h-12 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors shadow-sm border cursor-pointer ${
          bookmarked 
            ? 'bg-blue-100 text-blue-600 border-blue-200' 
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 hover:bg-blue-100 hover:text-blue-600'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{bookmarked ? 'bookmark_added' : 'bookmark'}</span>
      </button>
    </div>
  );
}
