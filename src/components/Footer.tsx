 'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Footer() {
  const menuItems = ['Nasional', 'Internasional', 'Ekonomi', 'Teknologi', 'Pendidikan', 'Hiburan', 'Umum'];
  const [settings, setSettings] = useState({ siteName: 'multinasnews.id', email: '', phone: '', address: '', instagram: '', facebook: '', x: '', youtube: '' });

  useEffect(() => {
    getDoc(doc(db, 'siteSettings', 'siteInfo'))
      .then((snapshot) => snapshot.exists() && setSettings((current) => ({ ...current, ...snapshot.data() })))
      .catch((error) => console.error('Gagal memuat footer:', error));
  }, []);

  return (
    <footer className="bg-slate-950 text-white mt-auto py-16 px-6">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5 space-y-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-black tracking-tight text-white font-headline">
              {settings.siteName}
            </span>
          </Link>
          <p className="font-body text-slate-400 leading-relaxed max-w-sm">Membawa perspektif kritis dalam setiap peristiwa. Menjaga independensi untuk menyajikan fakta jurnalistik tanpa intervensi.</p>
          <div className="flex gap-3 pt-4">
            {/* Instagram */}
            <a href={settings.instagram || '#'} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-yellow-400 transition-all duration-300 group hover:scale-110 hover:shadow-lg hover:shadow-pink-500/30">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href={settings.facebook || '#'} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-blue-600 transition-all duration-300 group hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            {/* Twitter / X */}
            <a href={settings.x || '#'} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-black transition-all duration-300 group hover:scale-110 hover:shadow-lg hover:shadow-slate-500/30">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href={settings.youtube || '#'} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-red-600 transition-all duration-300 group hover:scale-110 hover:shadow-lg hover:shadow-red-500/30">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>

        </div>
        
        <div className="md:col-span-3">
            <h4 className="font-headline font-bold text-xl mb-6 border-b border-slate-800 pb-2 inline-block">Kategori</h4>
            <ul className="space-y-4">
              {menuItems.map((item) => (
                 <li key={item}>
                   <Link href={`/kategori/${item.toLowerCase()}`} className="font-body text-slate-400 hover:text-white transition-colors text-sm">{item}</Link>
                 </li>
              ))}
            </ul>
        </div>
        
        <div className="md:col-span-4">
            <h4 className="font-headline font-bold text-xl mb-6 border-b border-slate-800 pb-2 inline-block">Tentang Kami</h4>
            <ul className="space-y-4">
                <li><Link href="/redaksi" className="font-body text-slate-400 hover:text-white transition-colors text-sm">Struktur Redaksi</Link></li>
                <li><Link href="/legalitas" className="font-body text-slate-400 hover:text-white transition-colors text-sm">Legalitas & Kebijakan Redaksi</Link></li>
                <li><Link href="/panduan" className="font-body text-slate-400 hover:text-white transition-colors text-sm">Panduan Media Siber</Link></li>
                <li><Link href="/kontak" className="font-body text-slate-400 hover:text-white transition-colors text-sm">Hubungi Kami</Link></li>
                {settings.email && <li><a href={`mailto:${settings.email}`} className="font-body text-slate-400 hover:text-white transition-colors text-sm">{settings.email}</a></li>}
                {settings.phone && <li><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="font-body text-slate-400 hover:text-white transition-colors text-sm">{settings.phone}</a></li>}
                {settings.address && <li className="font-body text-slate-400 text-sm leading-relaxed">{settings.address}</li>}
            </ul>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center md:text-left text-slate-500 font-label text-xs tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Multinasional Media Nusantara. All rights reserved.
      </div>
    </footer>
  );
}
