import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Panduan Media Siber — multinasnews',
  description: 'Pedoman pemberitaan media siber multinasnews berdasarkan kaidah jurnalistik yang bertanggung jawab.',
};

export default function PanduanPage() {
  const guidelines = [
    {
      icon: 'verified',
      title: 'Verifikasi Fakta',
      desc: 'Setiap berita yang dipublikasikan wajib melalui proses verifikasi minimal dua sumber independen sebelum tayang. Redaksi berkomitmen menyajikan fakta, bukan opini yang disamarkan sebagai berita.',
    },
    {
      icon: 'edit_note',
      title: 'Hak Jawab & Koreksi',
      desc: 'Multinasnews menjamin hak jawab bagi pihak yang merasa dirugikan oleh pemberitaan. Koreksi atas kesalahan fakta akan dilakukan secara transparan dengan mencantumkan catatan revisi.',
    },
    {
      icon: 'shield',
      title: 'Perlindungan Privasi',
      desc: 'Identitas korban kejahatan seksual, anak di bawah umur, dan saksi yang membutuhkan perlindungan akan disamarkan sesuai ketentuan hukum dan etika jurnalistik.',
    },
    {
      icon: 'balance',
      title: 'Keberimbangan Berita',
      desc: 'Setiap pemberitaan yang melibatkan konflik kepentingan wajib memuat pandangan dari semua pihak yang terkait (cover both sides) secara proporsional.',
    },
    {
      icon: 'gavel',
      title: 'Independensi Redaksi',
      desc: 'Redaksi multinasnews bebas dari intervensi pemilik modal, pemerintah, maupun pihak ketiga. Keputusan editorial sepenuhnya berada di tangan dewan redaksi.',
    },
    {
      icon: 'link',
      title: 'Transparansi Sumber',
      desc: 'Konten yang bersumber dari media lain atau siaran pers wajib mencantumkan atribusi yang jelas. Multinasnews tidak mempublikasikan konten tanpa sumber yang dapat dipertanggungjawabkan.',
    },
    {
      icon: 'speed',
      title: 'Kecepatan & Akurasi',
      desc: 'Dalam pemberitaan terkini (breaking news), kecepatan tetap diutamakan namun tidak boleh mengorbankan akurasi. Berita yang belum terverifikasi penuh akan diberi label "Developing Story".',
    },
    {
      icon: 'comment',
      title: 'Moderasi Komentar',
      desc: 'Komentar pembaca yang mengandung ujaran kebencian, SARA, pornografi, atau informasi pribadi akan dihapus. Multinasnews berhak menonaktifkan kolom komentar pada berita sensitif.',
    },
  ];

  return (
    <div className="fade-in max-w-screen-xl mx-auto px-6">
      {/* Header */}
      <div className="text-center py-16 md:py-24 max-w-4xl mx-auto space-y-6">
        <span className="font-label font-bold text-xs uppercase tracking-widest text-cyan-500 block">EDITORIAL GUIDELINES</span>
        <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter text-slate-900 dark:text-white">
          Panduan Media Siber
        </h1>
        <p className="font-headline text-xl md:text-2xl italic font-light text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Pedoman etika dan standar jurnalistik yang menjadi landasan kerja redaksi multinasnews.
        </p>
      </div>

      {/* Intro Box */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 mb-16 max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-6">
          <span className="material-symbols-outlined text-cyan-500 text-3xl mt-1">menu_book</span>
          <div>
            <h2 className="font-headline font-bold text-2xl mb-3 dark:text-white">Dasar Hukum & Rujukan</h2>
            <p className="font-body text-slate-600 dark:text-slate-400 leading-relaxed">
              Panduan ini disusun berdasarkan <strong>Pedoman Pemberitaan Media Siber</strong> yang ditetapkan oleh Dewan Pers, 
              serta mengacu pada <strong>Undang-Undang No. 40 Tahun 1999 tentang Pers</strong> dan <strong>Kode Etik Jurnalistik</strong>. 
              Seluruh insan redaksi multinasnews wajib mematuhi pedoman ini dalam menjalankan tugas jurnalistik.
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-4xl mx-auto">
        {guidelines.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 hover:shadow-lg hover:border-cyan-200 dark:hover:border-cyan-900 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20 transition-colors">
              <span className="material-symbols-outlined text-cyan-500 text-2xl">{item.icon}</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-3 dark:text-white group-hover:text-cyan-500 transition-colors">{item.title}</h3>
            <p className="font-body text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center pb-20 space-y-4">
        <p className="font-body text-slate-500 text-sm">Punya pertanyaan atau keluhan terkait pemberitaan?</p>
        <Link href="/kontak" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:bg-cyan-500 dark:hover:bg-cyan-500 dark:hover:text-white transition-colors shadow-lg">
          Hubungi Redaksi <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
