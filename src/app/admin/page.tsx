'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, addDoc, serverTimestamp, getDocs, deleteDoc, 
  doc, query, orderBy, limit, where, DocumentData, getDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Article, Journalist } from '@/types';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<'admin' | 'editor' | 'reporter'>('reporter');
  const router = useRouter();

  // State Berita
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Nasional');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedJournalist, setSelectedJournalist] = useState('');

  // State Jurnalis
  const [jName, setJName] = useState('');
  const [jRole, setJRole] = useState('Jurnalis / Wartawan');
  const [jSpec, setJSpec] = useState('');
  const [jBio, setJBio] = useState('');
  const [jImg, setJImg] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Stats & Lists
  const [totalNews, setTotalNews] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [dailyViews, setDailyViews] = useState(0);
  const [totalJournalists, setTotalJournalists] = useState(0);
  const [journalistsList, setJournalistsList] = useState<Journalist[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [breakingNewsText, setBreakingNewsText] = useState('');
  const [breakingNewsActive, setBreakingNewsActive] = useState(false);
  const [savingBreakingNews, setSavingBreakingNews] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ siteName: 'multinasnews', domain: '', email: '', phone: '', address: '', instagram: '', facebook: '', x: '', youtube: '', seoTitle: '', seoDescription: '' });
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<'editor' | 'reporter'>('reporter');
  const [creatingMember, setCreatingMember] = useState(false);

  // State Otomatisasi
  const [isAutomating, setIsAutomating] = useState(false);
  const [automationLog, setAutomationLog] = useState<any[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [manualContent, setManualContent] = useState(''); // State untuk konten manual

  // State Modal/Alert Modern
  const [alertModal, setAlertModal] = useState<{ show: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showModernAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({ show: true, title, message, type });
  };

  const showModernConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        const detectedRole = currentUser.email?.toLowerCase() === 'multinasnews@gmail.com' ? 'admin' : tokenResult.claims.role;
        if (detectedRole === 'admin' || detectedRole === 'editor' || detectedRole === 'reporter') {
          setUser(currentUser);
          setRole(detectedRole as 'admin' | 'editor' | 'reporter');
          setLoading(false);
          fetchStats(detectedRole as 'admin' | 'editor' | 'reporter', currentUser.uid);
          loadBreakingNews();
          loadSiteSettings();
        } else {
          // Bukan Admin: Keluarkan secara paksa
          await signOut(auth);
          router.push('/admin/login?error=unauthorized');
        }
      } else {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const createMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingMember(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: memberName, email: memberEmail, password: memberPassword, role: memberRole }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMemberName(''); setMemberEmail(''); setMemberPassword(''); setMemberRole('reporter');
      showModernAlert('Akun dibuat', `Akun ${memberRole} siap digunakan untuk masuk ke portal redaksi.`, 'success');
    } catch (error) {
      showModernAlert('Gagal membuat akun', error instanceof Error ? error.message : 'Terjadi kesalahan.', 'error');
    } finally { setCreatingMember(false); }
  };

  const loadBreakingNews = async () => {
    try {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'breakingNews'));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBreakingNewsText(data.text || '');
        setBreakingNewsActive(Boolean(data.active));
      }
    } catch (error) {
      console.error('Gagal memuat breaking news:', error);
    }
  };

  const saveBreakingNews = async (event: React.FormEvent) => {
    event.preventDefault();
    if (breakingNewsActive && !breakingNewsText.trim()) {
      showModernAlert('Judul diperlukan', 'Isi teks breaking news sebelum mengaktifkannya.', 'error');
      return;
    }
    setSavingBreakingNews(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'breakingNews'), {
        text: breakingNewsText.trim(), active: breakingNewsActive, updatedAt: serverTimestamp(),
      });
      showModernAlert('Breaking news tersimpan', breakingNewsActive ? 'Ticker sekarang tampil untuk pembaca.' : 'Ticker telah dinonaktifkan.', 'success');
    } catch (error) {
      showModernAlert('Gagal menyimpan', error instanceof Error ? error.message : 'Terjadi kesalahan.', 'error');
    } finally {
      setSavingBreakingNews(false);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'siteInfo'));
      if (snapshot.exists()) setSiteSettings((current) => ({ ...current, ...snapshot.data() }));
    } catch (error) {
      console.error('Gagal memuat pengaturan situs:', error);
    }
  };

  const saveSiteSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSiteSettings(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'siteInfo'), { ...siteSettings, updatedAt: serverTimestamp() });
      showModernAlert('Pengaturan tersimpan', 'Informasi situs dan footer telah diperbarui.', 'success');
    } catch (error) {
      showModernAlert('Gagal menyimpan', error instanceof Error ? error.message : 'Terjadi kesalahan.', 'error');
    } finally {
      setSavingSiteSettings(false);
    }
  };

  const fetchStats = async (activeRole = role, activeUid = user?.uid) => {
    // Ambil data Artikel dengan optimasi kueri (Sentinel standard)
    setErrorStatus(null);
    try {
      // Menggunakan query dan orderBy untuk performa maksimal. 
      // CATATAN: Firebase mungkin membutuhkan pembuatan Index Manual melalui link di console jika belum ada.
      const q = activeRole === 'reporter' && activeUid
        ? query(collection(db, 'articles'), where('authorUid', '==', activeUid), orderBy('createdAt', 'desc'), limit(100))
        : query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(100));
      const newsSnap = await getDocs(q);
      
      const newsData = newsSnap.docs.map(d => {
        const data = d.data();
        const viewsCount = data.views || 0;
        return { 
          id: d.id, 
          views: viewsCount,
          ...data 
        } as Article;
      });
      if (auth.currentUser?.email?.toLowerCase() === 'multinasnews@gmail.com') {
        const legacyArticles = newsSnap.docs.filter((article) => !article.data().status);
        if (legacyArticles.length) {
          const batch = writeBatch(db);
          legacyArticles.forEach((article) => batch.update(article.ref, { status: 'published' }));
          await batch.commit();
        }
      }
      
      const viewsAcc = newsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
      setTotalViews(viewsAcc);
      
      // Calculate daily view estimation realistically (Total views / days active)
      let calculatedDaily = 0;
      if (newsData.length > 0) {
         const oldestUnix = newsData[newsData.length - 1].createdAt?.seconds || Date.now() / 1000;
         const daysActive = Math.max(1, Math.ceil((Date.now() / 1000 - oldestUnix) / 86400));
         calculatedDaily = Math.floor(viewsAcc / daysActive);
      }
      setDailyViews(calculatedDaily);
      
      const popular = [...newsData].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      setPopularArticles(popular);

      setTotalNews(newsSnap.size);
      setArticlesList(newsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data berita.";
      console.error("Critical Arch Error:", errorMessage);
      
      // Fallback ke kueri mentah jika index belum dibuat
      try {
          const rawSnap = await getDocs(collection(db, 'articles'));
          const rawData = rawSnap.docs.map(d => {
            const data = d.data();
            const viewsCount = data.views || 0;
            return { id: d.id, views: viewsCount, ...data } as Article;
          });
          rawData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          
          const viewsAcc = rawData.reduce((acc, curr) => acc + (curr.views || 0), 0);
          setTotalViews(viewsAcc);
          
          let calculatedDaily = 0;
          if (rawData.length > 0) {
             const oldestUnix = rawData[rawData.length - 1].createdAt?.seconds || Date.now() / 1000;
             const daysActive = Math.max(1, Math.ceil((Date.now() / 1000 - oldestUnix) / 86400));
             calculatedDaily = Math.floor(viewsAcc / daysActive);
          }
          setDailyViews(calculatedDaily);
          
          const popular = [...rawData].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
          setPopularArticles(popular);

          setArticlesList(rawData);
      } catch (innerErr: unknown) {
          setErrorStatus("Komunikasi dengan benteng database terputus. Harap periksa koneksi.");
      }
    }

    // Ambil data Jurnalis
    try {
      const jSnap = await getDocs(collection(db, 'journalists'));
      setTotalJournalists(jSnap.size);
      setJournalistsList(jSnap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data() 
      } as Journalist)));
    } catch (err: unknown) {
      console.error("Journalist Fetch Error:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return showModernAlert('Gagal Diterbitkan', 'Judul dan Isi berita wajib diisi!', 'error');
    setIsPublishing(true);
    try {
      await addDoc(collection(db, 'articles'), {
        title, category, image, content,
        author: selectedJournalist || 'Tim Redaksi',
        authorUid: user?.uid,
        status: role === 'reporter' ? 'draft' : 'published',
        createdAt: serverTimestamp(),
        views: 0
      });
      showModernAlert('Berhasil Disimpan', role === 'reporter' ? 'Draft dikirim untuk ditinjau editor.' : 'Berita Anda telah resmi diterbitkan.', 'success');
      setTitle(''); setContent(''); setImage(''); setSelectedJournalist('');
      fetchStats();
      setActiveTab('kelola-berita');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error tidak dikenal";
      showModernAlert('Gagal Menerbitkan', msg, 'error');
    }
    setIsPublishing(false);
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    showModernConfirm(
      'Konfirmasi Hapus Berita',
      `Apakah Anda sungguh yakin ingin menghapus berita "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'articles', id));
          fetchStats();
          showModernAlert('Berhasil Dihapus', 'Berkas berita telah dimusnahkan.', 'success');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error tidak dikenal";
          showModernAlert('Gagal Menghapus', msg, 'error');
        }
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      console.log("Memulai kompresi berkas:", file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Batas maksimal dimensi agar tidak memberatkan database Firestore (di bawah 1MB)
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Kompresi hasil ke JPEG dengan kualitas 70%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(compressedDataUrl);
          setIsUploading(false);
          showModernAlert('Sukses', 'Gambar selesai dikompresi dan siap diterbitkan!', 'success');
        };
        
        img.onerror = () => {
          setIsUploading(false);
          showModernAlert('Error', 'Terjadi kesalahan saat membaca dimensi gambar.', 'error');
        };
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        showModernAlert('Error', 'Gagal membaca berkas dari perangkat Anda.', 'error');
      };
    } catch (err: any) {
      console.error("Gagal kompres gambar:", err);
      showModernAlert('Error', 'Gagal memproses gambar: ' + (err.message), 'error');
      setIsUploading(false);
    }
  };

  const handleAddJournalist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jName || !jRole) return showModernAlert('Validasi Gagal', 'Nama dan Posisi wajib diisi!', 'error');
    setIsAddingUser(true);
    
    const uid = 'MN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const slug = jName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      await addDoc(collection(db, 'journalists'), {
        slug,
        name: jName,
        title: jRole,
        specialty: jSpec,
        bio: jBio,
        img: jImg || '',
        uid,
        joinDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        createdAt: serverTimestamp()
      });
      showModernAlert('Jurnalis Berhasil Ditambahkan', `Selamat, ${jName} telah bergabung!\n\nNomor ID Press: ${uid}`, 'success');
      setJName(''); setJRole('Jurnalis / Wartawan'); setJSpec(''); setJBio(''); setJImg('');
      setShowAddForm(false);
      fetchStats(); // Update UI langsung
    } catch (err: any) {
      showModernAlert('Gagal Mendaftar Jurnalis', err.message, 'error');
    }
    setIsAddingUser(false);
  };

  const handleDeleteJournalist = async (id: string, name: string) => {
    showModernConfirm(
      'Cabut ID Press',
      `Apakah Anda sungguh yakin ingin mencabut dan memusnahkan ID Press milik jurnalis "${name}" secara permanen? Data publik miliknya akan langsung hangus seketika itu juga.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'journalists', id));
          fetchStats();
          showModernAlert('Berhasil Dicabut', 'Kartu pers telah dinonaktifkan permanen.', 'success');
        } catch (err: any) {
          showModernAlert('Gagal Mencabut ID', "Error Firebase: " + err.message, 'error');
        }
      }
    );
  };

  const runAutomation = async (targetUrl?: string, targetContent?: string) => {
    setIsAutomating(true);
    const start = new Date().toLocaleTimeString();
    try {
      const res = await fetch('/api/sentinel/automation/run', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sentinel-key': process.env.NEXT_PUBLIC_SENTINEL_KEY || ''
        },
        body: JSON.stringify({ 
          url: targetUrl, 
          manualContent: targetContent 
        })
      });
      const data = await res.json();
      
      const logEntry = {
        time: start,
        status: data.success ? 'Success' : 'Failed',
        message: data.message,
        details: data.data || null
      };
      
      setAutomationLog(prev => [logEntry, ...prev]);
      if (data.success) fetchStats(); // Refresh news list
    } catch (err) {
      setAutomationLog(prev => [{ time: start, status: 'Error', message: 'Koneksi ke Sentinel Scraper terputus.' }, ...prev]);
    }
    setIsAutomating(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-public-sans w-full">
       <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)] flex flex-col z-20 flex-shrink-0">
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between md:block">
             <div className="flex items-center gap-2">
                <img src="/logomultinasnews.png" alt="Logo Multinasnews" width="205" height="205" className="h-8 w-auto object-contain" />
                <span className="text-xl font-black tracking-tighter text-slate-800 font-headline">
                  multinas<span className="text-cyan-500">news</span>
                </span>
             </div>
             <button onClick={handleLogout} className="md:hidden flex items-center justify-center p-2 text-slate-500 hover:text-cyan-500 bg-slate-50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-[20px]">logout</span>
             </button>
          </div>
          <nav className="flex md:flex-col md:flex-1 p-3 md:p-4 gap-2 md:space-y-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
             <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">dashboard</span> Ringkasan
             </button>
             <button onClick={() => setActiveTab('berita')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'berita' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit_document</span> Tulis Liputan
             </button>
             <button onClick={() => setActiveTab('kelola-berita')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'kelola-berita' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">article</span> Manajemen Berita
             </button>
             {role === 'admin' && <button onClick={() => setActiveTab('redaksi')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'redaksi' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">badge</span> Kelola Jurnalis
             </button>}
             {role === 'admin' && <button onClick={() => setActiveTab('otomatisasi')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'otomatisasi' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">smart_toy</span> Otomatisasi
             </button>}
             {role === 'admin' && <button onClick={() => setActiveTab('breaking-news')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'breaking-news' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">campaign</span> Breaking News
             </button>}
             {role === 'admin' && <button onClick={() => setActiveTab('pengaturan')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'pengaturan' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">settings</span> Pengaturan Situs
             </button>}
             {role === 'admin' && <button onClick={() => setActiveTab('akun-tim')} className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'akun-tim' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}><span className="material-symbols-outlined text-[18px] md:text-[20px]">manage_accounts</span> Akun Tim</button>}
          </nav>
          <div className="p-4 border-t border-slate-100 hidden md:block">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-cyan-500 hover:bg-cyan-50 rounded-xl transition-colors border border-slate-200 hover:border-cyan-200">
                <span className="material-symbols-outlined text-[20px]">logout</span> Keluar Dasbor
             </button>
          </div>
       </aside>

       <main className="flex-1 flex flex-col h-[calc(100vh-130px)] md:h-screen overflow-y-auto relative">
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 py-4 sticky top-0 z-10 w-full shadow-sm">
             <h2 className="font-headline font-bold text-xl capitalize flex items-center gap-2">
               {activeTab === 'dashboard' && <span className="material-symbols-outlined text-cyan-500">monitor_heart</span>}
               {activeTab === 'berita' && <span className="material-symbols-outlined text-cyan-500">demography</span>}
               {activeTab === 'redaksi' && <span className="material-symbols-outlined text-cyan-500">assignment_ind</span>}
               {activeTab.replace('-', ' ')}
             </h2>
             <div className="flex items-center gap-4 bg-slate-50 py-1.5 px-2 rounded-full border border-slate-200">
                <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold uppercase text-sm">{user?.email?.[0] || 'A'}</div>
                <span className="text-sm font-semibold text-slate-700 pr-3">{user?.email}</span>
             </div>
          </header>

          <div className="p-8 max-w-5xl mx-auto w-full">
             {/* KONTEN TAB: DASHBOARD */}
             {activeTab === 'dashboard' && (
                <div className="fade-in space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0"><span className="material-symbols-outlined text-[24px] md:text-[28px]">article</span></div>
                         <div><p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">Total Berita</p><h3 className="text-2xl md:text-3xl font-black font-headline text-slate-800">{totalNews}</h3></div>
                      </div>
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0"><span className="material-symbols-outlined text-[24px] md:text-[28px]">visibility</span></div>
                         <div><p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">Total Klik / Views</p><h3 className="text-2xl md:text-3xl font-black font-headline text-slate-800">{totalViews.toLocaleString('id-ID')}</h3></div>
                      </div>
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0"><span className="material-symbols-outlined text-[24px] md:text-[28px]">trending_up</span></div>
                         <div><p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">Views Harian</p><h3 className="text-2xl md:text-3xl font-black font-headline text-slate-800">{dailyViews.toLocaleString('id-ID')}</h3></div>
                      </div>
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0"><span className="material-symbols-outlined text-[24px] md:text-[28px]">group</span></div>
                         <div><p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1">Jurnalis Aktif</p><h3 className="text-2xl md:text-3xl font-black font-headline text-slate-800">{totalJournalists}</h3></div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
                      {/* KOLOM KIRI: BERITA TERPOPULER */}
                      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl md:text-2xl font-black font-headline text-slate-800 flex items-center gap-2">
                               <span className="material-symbols-outlined text-amber-500">local_fire_department</span> Berita Terpopuler
                            </h3>
                            <button onClick={() => setActiveTab('kelola-berita')} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline">Lihat Semua</button>
                         </div>
                         <div className="space-y-4">
                            {popularArticles.length > 0 ? popularArticles.map((article, idx) => (
                               <div key={article.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                  <div className="w-8 flex justify-center text-lg font-black text-slate-300 group-hover:text-cyan-500">#{idx + 1}</div>
                                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                                     <img src={article.image || 'https://via.placeholder.com/150'} alt={article.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <h4 className="font-bold text-slate-800 text-sm line-clamp-2 md:line-clamp-1 group-hover:text-cyan-600 transition-colors">{article.title}</h4>
                                     <div className="flex items-center gap-3 mt-1.5 opacity-70">
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-slate-200">{article.category}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">• {article.author}</span>
                                     </div>
                                  </div>
                                  <div className="text-right hidden sm:block shrink-0 px-4">
                                     <div className="text-lg font-black text-emerald-600">{(article.views || 0).toLocaleString('id-ID')}</div>
                                     <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Klik</div>
                                  </div>
                               </div>
                            )) : (
                               <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-slate-400 font-semibold text-sm">Belum ada data berita yang dipublikasikan.</p>
                               </div>
                            )}
                         </div>
                      </div>

                      {/* KOLOM KANAN: GRAFIK & PUSAT KOMANDO */}
                      <div className="flex flex-col gap-6 md:gap-8">
                         {/* MOCK GRAFIK */}
                         <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-6 md:p-8 text-white">
                            <h3 className="text-lg font-black font-headline flex items-center gap-2 mb-6">
                               <span className="material-symbols-outlined text-cyan-400">monitoring</span> Tren 7 Hari Terakhir
                            </h3>
                            <div className="flex items-end justify-between h-32 gap-2 border-b border-slate-700/50 pb-2">
                               {/* Mock Bar Chart */}
                               {[30, 60, 45, 80, 50, 90, 100].map((h, i) => (
                                  <div key={i} className="w-full relative group flex justify-center h-full items-end mt-auto">
                                     <div className="absolute -top-8 bg-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{Math.floor(dailyViews * (h/100)).toLocaleString('id-ID')}</div>
                                     <div className={`w-full rounded-t-md transition-all duration-500 hover:bg-cyan-400 shadow-md ${i === 6 ? 'bg-cyan-500 shadow-cyan-500/50' : 'bg-slate-700'}`} style={{ height: `${h}%` }}></div>
                                  </div>
                               ))}
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span className="text-cyan-400">Min</span>
                            </div>
                         </div>

                         {/* PUSAT KOMANDO ACTION */}
                         <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl shadow-xl shadow-cyan-500/20 p-6 md:p-8 relative overflow-hidden group h-full flex flex-col justify-center">
                            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700"><span className="material-symbols-outlined text-[200px] text-white">rocket_launch</span></div>
                            <h3 className="text-2xl font-black font-headline text-white mb-2 relative z-10 leading-tight">Mulai Rilis Tulisan Hari Ini.</h3>
                            <p className="text-cyan-50 text-sm font-body relative z-10 mb-6">Kontrol penuh atas redaksi dan publikasi berita ke masyarakat luas.</p>
                            <button onClick={() => setActiveTab('berita')} className="w-full bg-white text-cyan-600 py-3.5 rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-cyan-500/50 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 relative z-10 text-sm mt-auto">
                              <span className="material-symbols-outlined text-[18px]">edit_document</span> Buat Naskah Baru
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}
 
             {/* KONTEN TAB: MANAJEMEN BERITA */}
             {activeTab === 'kelola-berita' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in min-h-[500px]">
                   <h3 className="text-2xl font-black font-headline text-slate-800 mb-1">Arsip & Manajemen Berita</h3>
                   <p className="text-slate-500 text-sm mb-8">Daftar seluruh liputan yang telah mengudara. Anda dapat menarik paksa naskah jika diperlukan.</p>
                   
                   <div className="space-y-4">
                      {articlesList.length > 0 ? (
                         articlesList.map(a => (
                            <div key={a.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group">
                               <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                                  <img src={a.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                               </div>
                               <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-cyan-500 transition-colors uppercase text-sm tracking-tight">{a.title}</h4>
                                  <div className="flex items-center gap-3 mt-1.5">
                                     <span className="bg-cyan-50 text-cyan-500 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-cyan-100">{a.category}</span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {a.author}</span>
                                  </div>
                               </div>
                               <button onClick={() => handleDeleteArticle(a.id, a.title)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-500 transition-all opacity-0 group-hover:opacity-100 shadow-md">
                                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                               </button>
                            </div>
                         ))
                      ) : (
                         <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">inventory_2</span>
                            <p className="text-slate-400 font-headline font-bold">Belum ada arsip naskah berita yang ditemukan.</p>
                         </div>
                      )}
                   </div>
                </div>
             )}

             {activeTab === 'akun-tim' && role === 'admin' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in max-w-2xl">
                 <h3 className="text-2xl font-black font-headline text-slate-800 mb-1">Akun Tim Redaksi</h3>
                 <p className="text-slate-500 text-sm mb-8">Buat akun untuk editor atau reporter. Bagikan kata sandi awal secara pribadi, lalu minta pemilik akun menggantinya.</p>
                 <form onSubmit={createMember} className="space-y-5">
                   <div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Nama</label><input required value={memberName} onChange={(event) => setMemberName(event.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div>
                   <div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Email</label><input required type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div>
                   <div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Kata sandi awal</label><input required minLength={6} type="password" value={memberPassword} onChange={(event) => setMemberPassword(event.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div>
                   <div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Peran akses</label><select value={memberRole} onChange={(event) => setMemberRole(event.target.value as 'editor' | 'reporter')} className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:border-cyan-500"><option value="reporter">Reporter — membuat draft sendiri</option><option value="editor">Editor — menerbitkan dan mengelola artikel</option></select></div>
                   <button disabled={creatingMember} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60">{creatingMember ? 'Membuat akun...' : 'Buat Akun Tim'}</button>
                 </form>
               </div>
             )}

             {activeTab === 'breaking-news' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in max-w-2xl">
                 <h3 className="text-2xl font-black font-headline text-slate-800 mb-1">Breaking News</h3>
                 <p className="text-slate-500 text-sm mb-8">Teks ini tampil pada ticker di bagian paling atas website.</p>
                 <form onSubmit={saveBreakingNews} className="space-y-6">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Teks berita kilat</label>
                     <textarea value={breakingNewsText} onChange={(event) => setBreakingNewsText(event.target.value)} maxLength={180} rows={3} className="w-full border border-slate-300 rounded-xl px-5 py-4 focus:border-cyan-500 outline-none text-slate-900" placeholder="Contoh: Pemerintah mengumumkan kebijakan penting hari ini." />
                     <p className="mt-2 text-xs text-slate-400">{breakingNewsText.length}/180 karakter</p>
                   </div>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={breakingNewsActive} onChange={(event) => setBreakingNewsActive(event.target.checked)} className="h-5 w-5 accent-cyan-500" />
                     <span className="font-bold text-slate-700">Tampilkan ticker breaking news</span>
                   </label>
                   <button disabled={savingBreakingNews} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60">{savingBreakingNews ? 'Menyimpan...' : 'Simpan Breaking News'}</button>
                 </form>
               </div>
             )}

             {activeTab === 'pengaturan' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in">
                 <h3 className="text-2xl font-black font-headline text-slate-800 mb-1">Pengaturan Situs</h3>
                 <p className="text-slate-500 text-sm mb-8">Simpan informasi resmi sebelum website memakai domain produksi.</p>
                 <form onSubmit={saveSiteSettings} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     {[['siteName', 'Nama situs', 'multinasnews'], ['domain', 'Domain produksi', 'https://contoh.id'], ['email', 'Email redaksi', 'redaksi@contoh.id'], ['phone', 'Nomor WhatsApp/telepon', '+62...'], ['address', 'Alamat redaksi', 'Kota, Provinsi']].map(([field, label, placeholder]) => <div key={field} className={field === 'address' ? 'md:col-span-2' : ''}><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">{label}</label><input value={siteSettings[field as keyof typeof siteSettings]} onChange={(event) => setSiteSettings((current) => ({ ...current, [field]: event.target.value }))} placeholder={placeholder} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div>)}
                   </div>
                   <div><h4 className="font-bold text-slate-800 mb-4">Media sosial</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['x', 'X / Twitter'], ['youtube', 'YouTube']].map(([field, label]) => <div key={field}><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">{label}</label><input type="url" value={siteSettings[field as keyof typeof siteSettings]} onChange={(event) => setSiteSettings((current) => ({ ...current, [field]: event.target.value }))} placeholder="https://..." className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div>)}</div></div>
                   <div><h4 className="font-bold text-slate-800 mb-4">SEO dasar</h4><div className="space-y-5"><div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Judul default</label><input value={siteSettings.seoTitle} onChange={(event) => setSiteSettings((current) => ({ ...current, seoTitle: event.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div><div><label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Deskripsi default</label><textarea value={siteSettings.seoDescription} onChange={(event) => setSiteSettings((current) => ({ ...current, seoDescription: event.target.value }))} maxLength={160} rows={3} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-cyan-500" /></div></div></div>
                   <button disabled={savingSiteSettings} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60">{savingSiteSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}</button>
                 </form>
               </div>
             )}

             {/* KONTEN TAB: TULIS BERITA */}
             {activeTab === 'berita' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in">
                  <h3 className="text-2xl font-black font-headline text-slate-800 mb-1">Ruang Redaktur</h3>
                  <p className="text-slate-500 text-sm mb-8">Formulir rilis artikel kilat ke beranda pembaca.</p>
                  
                  <form onSubmit={handlePublishNews} className="space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Judul Memikat Tulisan Utama</label>
                        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} required className="w-full border border-slate-300 rounded-xl px-5 py-4 focus:border-red-500 outline-none text-lg font-headline font-bold text-slate-900 transition-all placeholder:font-normal placeholder:font-public-sans" placeholder="Ketik penarik perhatian audiens di sini..." />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Penulis / Jurnalis Lapangan</label>
                           <select value={selectedJournalist} onChange={e=>setSelectedJournalist(e.target.value)} className="w-full border border-slate-300 rounded-xl px-5 py-3.5 outline-none focus:border-red-500 transition-all text-slate-700 bg-white">
                              <option value="">Tim Redaksi (Default)</option>
                              {journalistsList.map(j => (
                                <option key={j.id} value={`${j.name} (${j.title})`}>{j.name} - {j.title}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Desk / Jenis Rubrik</label>
                           <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-5 py-3.5 outline-none focus:border-red-500 transition-all text-slate-700 bg-white">
                              <option>Nasional</option><option>Internasional</option><option>Ekonomi & Bisnis</option><option>Teknologi</option><option>Investigasi</option><option>Umum</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Unggah Foto Utama (Dokumentasi)</label>
                        <div className="flex items-center gap-4">
                           <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:border-cyan-500 hover:bg-cyan-50 transition-all cursor-pointer group relative overflow-hidden">
                              {image ? (
                                 <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Preview" />
                              ) : null}
                              <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-cyan-500 mb-2">{isUploading ? 'sync' : 'cloud_upload'}</span>
                              <span className="text-sm font-bold text-slate-500 group-hover:text-cyan-500">{isUploading ? 'Sedang Mengukir ke Awan...' : 'Pilih Berkas Digital atau Seret ke Sini'}</span>
                              <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                           </label>
                           {image && (
                              <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                 <img src={image} className="w-full h-full object-cover" alt="Selected" />
                              </div>
                           )}
                        </div>
                        <input type="text" value={image} onChange={e=>setImage(e.target.value)} className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2 text-[10px] text-slate-400 bg-slate-50 outline-none focus:border-red-400 transition-all" placeholder="Atau tempel URL gambar manual di sini jika perlu..." />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">Kerangka Paragraf Jurnalistik Lengkap</label>
                        <textarea value={content} onChange={e=>setContent(e.target.value)} required rows={10} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all resize-y text-slate-700 font-body leading-relaxed" placeholder="Awali pelaporan investigasi dari Tempat Kejadian Perkara..."></textarea>
                     </div>
                     <div className="pt-4 flex justify-end gap-4 border-t border-slate-100">
                        <button type="submit" disabled={isPublishing} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition flex items-center gap-2 disabled:opacity-50">
                           <span className="material-symbols-outlined text-[20px]">{isPublishing ? 'sync' : 'send'}</span> {isPublishing ? 'Mendorong Berita ke Beranda...' : 'Terbitkan ke Portal Pembaca'}
                        </button>
                     </div>
                  </form>
               </div>
             )}

             {/* KONTEN TAB: KELOLA REDAKSI (FOKUS UTAMA) */}
             {activeTab === 'redaksi' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in min-h-[500px]">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                     <div>
                        <h3 className="text-2xl font-black font-headline text-slate-800">Manajemen Personalia Redaksi</h3>
                        <p className="text-slate-500 text-sm mt-1">Sistem kontrol dan daftar kartu ID Press digital yang mencerminkan publik.</p>
                     </div>
                     <button onClick={() => setShowAddForm(!showAddForm)} className="bg-cyan-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 transition group shrink-0">
                        <span className={`material-symbols-outlined text-sm transition-transform ${showAddForm ? 'rotate-45' : 'group-hover:rotate-90'}`}>{showAddForm ? 'close' : 'add'}</span> <span className="hidden sm:inline">{showAddForm ? 'Batal Tambah' : 'Anggota Baru'}</span>
                     </button>
                  </div>

                  {showAddForm ? (
                    <form onSubmit={handleAddJournalist} className="space-y-6 fade-in p-6 md:p-8 border-2 border-red-50 rounded-2xl bg-cyan-50/20 relative overflow-hidden">
                       <h4 className="font-bold text-red-800 mb-4 border-b border-cyan-100 pb-2 flex items-center gap-2"><span className="material-symbols-outlined font-light text-red-500">badge</span> Pencetakan ID Card Instan</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide">Nama Lengkap</label><input type="text" value={jName} onChange={e=>setJName(e.target.value)} required className="w-full border border-slate-300 focus:border-red-500 outline-none rounded-lg px-4 py-2" placeholder="Cth: Najwa Shihab" /></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide">Jabatan</label><select value={jRole} onChange={e=>setJRole(e.target.value)} required className="w-full border border-slate-300 focus:border-red-500 outline-none rounded-lg px-4 py-2 bg-white"><option>Dewan Pendiri</option><option>Dewan Penasihat</option><option>Dewan Redaksi</option><option>Pemimpin Perusahaan</option><option>Pemimpin Redaksi</option><option>Staf Redaksi</option><option>Bendahara</option><option>Editor / Layout Design</option><option>Kaperwil Jawa Barat</option><option>Koordinator Liputan</option><option>Kabiro Kab. Bogor</option><option>Jurnalis / Wartawan</option></select></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide">Bidang / Fokus</label><input type="text" value={jSpec} onChange={e=>setJSpec(e.target.value)} className="w-full border border-slate-300 focus:border-red-500 outline-none rounded-lg px-4 py-2" placeholder="Cth: Investigasi Politik" /></div>
                          <div><label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide">URL Link Fotografi</label><input type="text" value={jImg} onChange={e=>setJImg(e.target.value)} className="w-full border border-slate-300 focus:border-red-500 outline-none rounded-lg px-4 py-2" placeholder="https://..." /></div>
                       </div>
                       <div><label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide">Jejak Karya (Bio)</label><textarea value={jBio} onChange={e=>setJBio(e.target.value)} rows={3} className="w-full border border-slate-300 focus:border-red-500 outline-none rounded-lg px-4 py-3" placeholder="Semenjak memenangkan piala..." /></div>
                       <button type="submit" disabled={isAddingUser} className="bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-cyan-600 w-full disabled:opacity-50 flex items-center justify-center gap-2">
                         {isAddingUser ? <><span className="material-symbols-outlined animate-spin">sync</span> Mengukir Database...</> : 'Daftarkan secara Magis ke Beranda Publik!'}
                       </button>
                    </form>
                  ) : (
                    journalistsList.length > 0 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 fade-in">
                         {journalistsList.map(j => (
                           <div key={j.id} className="border border-slate-200 rounded-xl p-5 flex flex-col gap-4 bg-slate-50/50 hover:bg-white relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center relative bg-slate-100">
                                     {j.img ? <img src={j.img} alt={j.name} className="w-full h-full object-cover"/> : <span className="material-symbols-outlined text-4xl text-slate-400">person</span>}
                                  </div>
                                  <div className="flex-1 pr-6">
                                     <h4 className="font-headline font-bold text-slate-900 group-hover:text-cyan-500 transition-colors line-clamp-1">{j.name}</h4>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider line-clamp-1 border-b border-transparent group-hover:border-cyan-200 pb-0.5">{j.title}</p>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                  <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded font-mono tracking-widest font-bold">{j.uid}</span>
                              </div>
                              <div className="absolute top-0 right-0 h-full w-12 flex items-center justify-center bg-gradient-to-l from-red-50/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                              <button onClick={() => handleDeleteJournalist(j.id, j.name)} title="Cabut ID Press Secara Permanen" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-red-300 hover:text-white hover:bg-cyan-500 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-md">
                                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                              </button>
                           </div>
                         ))}
                       </div>
                    ) : (
                       <div className="text-center py-20 px-6 border border-slate-200 rounded-2xl bg-slate-50 fade-in">
                         <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">account_box</span>
                         <h4 className="font-bold text-slate-700 text-lg mb-2">Tabel Karyawan Kosong</h4>
                         <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Database Admin mengenali bahwa Anda belum mendaftarkan nyawa jurnalis manapun ke portal redaksi.</p>
                         <button onClick={() => setShowAddForm(true)} className="bg-white border border-slate-300 text-slate-700 hover:border-cyan-500 hover:text-cyan-500 hover:bg-cyan-50 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-sm flex items-center justify-center mx-auto gap-2">
                           <span className="material-symbols-outlined text-[18px]">add</span> Mulai Daftarkan Wajah Pertama
                         </button>
                      </div>
                    )
                  )}
                </div>
             )}

             {/* KONTEN TAB: OTOMATISASI (SENTINEL BOT) */}
             {activeTab === 'otomatisasi' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 fade-in min-h-[500px]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black font-headline text-slate-800 flex items-center gap-3">
                        <span className="material-symbols-outlined text-cyan-500 text-3xl">precision_manufacturing</span> Sentinel Scraper Engine
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">Bot otomatisasi untuk pembaruan berita real-time dari sumber global.</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          value={manualUrl} 
                          onChange={(e) => setManualUrl(e.target.value)}
                          placeholder="Tempel URL (Kompas/Detik/Lainnya)..."
                          className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none w-full sm:w-80"
                        />
                        <button 
                          onClick={() => {
                            if (!manualUrl) return showModernAlert('Peringatan', 'Masukkan URL sumber terlebih dahulu!', 'error');
                            runAutomation(manualUrl);
                            setManualUrl('');
                          }} 
                          disabled={isAutomating}
                          className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 transition disabled:opacity-50 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">bolt</span> Proses
                        </button>
                        <button 
                          onClick={() => runAutomation()} 
                          disabled={isAutomating}
                          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition shadow-xl shadow-slate-900/10 disabled:opacity-50 group"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isAutomating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                            {isAutomating ? 'sync' : 'rss_feed'}
                          </span> 
                          Siklus Global
                        </button>
                      </div>

                      <div className="relative">
                        <textarea 
                          value={manualContent}
                          onChange={(e) => setManualContent(e.target.value)}
                          placeholder="ATAU: Tempel Isi Berita Mentah Di Sini (Jika Bot Diblokir)..."
                          className="w-full h-24 border border-slate-200 rounded-2xl p-4 text-[11px] focus:border-cyan-500 outline-none resize-none bg-slate-50/50 hover:bg-white transition-all font-mono"
                        />
                        <button 
                          onClick={() => {
                            if (!manualContent) return showModernAlert('Peringatan', 'Tempel teks berita dulu!', 'error');
                            runAutomation(undefined, manualContent);
                            setManualContent('');
                          }}
                          disabled={isAutomating}
                          className="absolute right-3 bottom-3 bg-emerald-600 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-tighter hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                        >
                          Paksa Rombak (AI)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs border-l-4 border-cyan-500 pl-3">Log Eksekusi Terkini</h4>
                      <div className="space-y-3">
                        {automationLog.length > 0 ? (
                          automationLog.map((log, i) => (
                            <div key={i} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                  {log.status}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">{log.time}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-700">{log.message}</p>
                              {log.details && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[9px] text-slate-400 uppercase font-bold">Ditambah</p>
                                    <p className="text-sm font-black text-emerald-600">{log.details.added}</p>
                                  </div>
                                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[9px] text-slate-400 uppercase font-bold">Error</p>
                                    <p className="text-sm font-black text-red-600">{log.details.errors}</p>
                                  </div>
                                </div>
                              )}
                              {log.details?.lastError && (
                                <p className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 mt-2 font-mono">
                                  {log.details.lastError}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                             <span className="material-symbols-outlined text-5xl text-slate-200 mb-2">history</span>
                             <p className="text-slate-400 font-bold text-sm">Belum ada aktivitas bot hari ini.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white h-fit">
                      <h4 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400">shield</span> Status Sentinel
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs py-2 border-b border-white/10">
                          <span className="text-white/60">Mesin Scraper</span>
                          <span className="font-bold text-emerald-400">AKTIF</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 border-b border-white/10">
                          <span className="text-white/60">Auto-Posting</span>
                          <span className="font-bold text-emerald-400">ON</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 mb-6">
                          <span className="text-white/60">Target Sumber</span>
                          <span className="font-bold text-cyan-400">Antara News</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-white/40 uppercase font-black mb-1">Tips Sentinel</p>
                          <p className="text-[11px] leading-relaxed text-white/80 italic">"Bot akan secara otomatis mengabaikan berita yang sudah pernah diunggah sebelumnya untuk mencegah spam database."</p>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
             )}
          </div>
               {/* MODERN ALERT MODAL */}
        {alertModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl transition-all duration-300 fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center transform scale-in-center duration-200">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md ${
                alertModal.type === 'success' ? 'bg-emerald-100 text-emerald-500 shadow-emerald-500/20' : 
                alertModal.type === 'error' ? 'bg-red-100 text-red-500 shadow-red-500/20' : 
                'bg-blue-100 text-blue-500 shadow-blue-500/20'
              }`}>
                <span className="material-symbols-outlined text-[40px]">
                  {alertModal.type === 'success' ? 'check_circle' : alertModal.type === 'error' ? 'cancel' : 'info'}
                </span>
              </div>
              <h3 className="text-2xl font-black font-headline text-slate-800 mb-3">{alertModal.title}</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed whitespace-pre-line">{alertModal.message}</p>
              <button 
                onClick={() => setAlertModal(prev => ({...prev, show: false}))}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                  alertModal.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : 
                  alertModal.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 
                  'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30'
                }`}
              >
                Mengerti, Tutup
              </button>
            </div>
          </div>
        )}

        {/* MODERN CONFIRM MODAL */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl transition-all duration-300 fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center transform scale-in-center duration-200">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md bg-amber-100 text-amber-500 shadow-amber-500/20">
                <span className="material-symbols-outlined text-[40px]">warning</span>
              </div>
              <h3 className="text-2xl font-black font-headline text-slate-800 mb-3">{confirmModal.title}</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setConfirmModal(prev => ({...prev, show: false}))}
                  className="flex-1 py-4 rounded-xl font-bold transition-all text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({...prev, show: false}));
                  }}
                  className="flex-1 py-4 rounded-xl font-bold transition-all text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
