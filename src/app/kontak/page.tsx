import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hubungi Kami — multinasnews',
  description: 'Hubungi redaksi multinasnews untuk pertanyaan, saran, kritik, kerja sama, atau hak jawab.',
};

export default function KontakPage() {
  const contacts = [
    {
      icon: 'mail',
      label: 'Email Redaksi',
      value: 'multinasnews@gmail.com',
      href: 'mailto:multinasnews@gmail.com',
      desc: 'Untuk pertanyaan umum, hak jawab, dan koreksi berita.',
    },
    {
      icon: 'campaign',
      label: 'Kerjasama & Iklan',
      value: 'bisnis.multinasnews@gmail.com',
      href: 'mailto:bisnis.multinasnews@gmail.com',
      desc: 'Untuk kerja sama bisnis, pemasangan iklan, dan sponsorship.',
    },
    {
      icon: 'location_on',
      label: 'Alamat Redaksi',
      value: 'Jakarta, Indonesia',
      href: null,
      desc: 'Kantor Redaksi Multinasional Media Nusantara.',
    },
  ];

  return (
    <div className="fade-in max-w-screen-xl mx-auto px-6">
      {/* Header */}
      <div className="text-center py-16 md:py-24 max-w-4xl mx-auto space-y-6">
        <span className="font-label font-bold text-xs uppercase tracking-widest text-cyan-500 block">GET IN TOUCH</span>
        <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter text-slate-900 dark:text-white">
          Hubungi Kami
        </h1>
        <p className="font-headline text-xl md:text-2xl italic font-light text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Kami terbuka untuk saran, kritik, dan kerja sama yang membangun.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 max-w-5xl mx-auto">
        {/* Contact Cards */}
        <div className="space-y-6">
          {contacts.map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 hover:shadow-lg hover:border-cyan-200 dark:hover:border-cyan-900 transition-all group">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20 transition-colors">
                  <span className="material-symbols-outlined text-cyan-500 text-2xl">{c.icon}</span>
                </div>
                <div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">{c.label}</span>
                  {c.href ? (
                    <a href={c.href} className="font-headline font-bold text-xl text-slate-900 dark:text-white hover:text-cyan-500 transition-colors break-all">{c.value}</a>
                  ) : (
                    <span className="font-headline font-bold text-xl text-slate-900 dark:text-white">{c.value}</span>
                  )}
                  <p className="font-body text-sm text-slate-500 mt-2">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Social Media */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <h3 className="font-headline font-bold text-lg mb-4 dark:text-white">Ikuti Kami</h3>
            <div className="flex gap-3">
              {[
                { name: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-yellow-400' },
                { name: 'Facebook', color: 'hover:bg-blue-600' },
                { name: 'Twitter/X', color: 'hover:bg-black' },
                { name: 'YouTube', color: 'hover:bg-red-600' },
              ].map((s, i) => (
                <a key={i} href="#" className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 ${s.color} transition-all duration-300 group/social hover:scale-110`} title={s.name}>
                  <span className="material-symbols-outlined text-slate-500 group-hover/social:text-white text-lg transition-colors">share</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="font-headline font-bold text-2xl mb-2 dark:text-white">Kirim Pesan</h2>
          <p className="font-body text-sm text-slate-500 mb-8">Pesan Anda akan diterima oleh tim redaksi dan dijawab dalam 1x24 jam kerja.</p>
          
          <form action={`mailto:multinasnews@gmail.com`} method="POST" encType="text/plain" className="space-y-5">
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">Nama Lengkap</label>
              <input type="text" name="nama" required placeholder="Masukkan nama Anda"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-body text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition placeholder:text-slate-400" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">Email</label>
              <input type="email" name="email" required placeholder="email@contoh.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-body text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition placeholder:text-slate-400" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">Subjek</label>
              <select name="subjek"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-body text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition">
                <option>Pertanyaan Umum</option>
                <option>Hak Jawab / Koreksi Berita</option>
                <option>Kerja Sama & Iklan</option>
                <option>Laporan Konten</option>
                <option>Saran & Kritik</option>
              </select>
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">Pesan</label>
              <textarea name="pesan" rows={5} required placeholder="Tulis pesan Anda di sini..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-body text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition resize-none placeholder:text-slate-400" />
            </div>
            <button type="submit"
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:bg-cyan-500 dark:hover:bg-cyan-500 dark:hover:text-white transition-colors shadow-lg flex items-center justify-center gap-2">
              Kirim Pesan <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
