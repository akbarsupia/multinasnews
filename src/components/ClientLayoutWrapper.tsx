'use client'
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Menyembunyikan Navbar dan Footer publik jika pengguna berada di area /admin
  const isAdminArea = pathname?.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-surface dark:bg-slate-950 dark:text-slate-200 transition-colors duration-500 w-full overflow-x-hidden">
      {!isAdminArea && <Navbar />}
      
      <main className={`flex-1 flex flex-col w-full ${!isAdminArea ? 'pt-[116px]' : ''}`}>
        {children}
      </main>
      
      {!isAdminArea && <Footer />}
    </div>
  );
}
