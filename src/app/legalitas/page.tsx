import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legalitas & Kebijakan Redaksi | multinasnews',
  description: 'Informasi legalitas, kebijakan redaksi, hak jawab, dan koreksi Multinasnews.',
};

export default function LegalitasPage() {
  return (
    <main className="max-w-screen-lg mx-auto py-12 md:py-20 px-6 text-slate-800 dark:text-slate-200">
      <header className="border-b-4 border-slate-900 dark:border-white pb-7 mb-12">
        <p className="font-label font-bold text-xs tracking-widest uppercase text-cyan-500 mb-3">Transparansi Multinasnews</p>
        <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tight">Legalitas & Kebijakan Redaksi</h1>
      </header>

      <div className="space-y-10 leading-relaxed">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 bg-slate-50 dark:bg-slate-900/40">
          <h2 className="font-headline font-black text-2xl mb-5">Informasi Legalitas</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 text-sm md:text-base">
            <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Badan hukum</dt><dd className="font-semibold">PT. Multi Nasional Indonesia</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Akta pendirian</dt><dd className="font-semibold">Nomor 26, 29 Juli 2021</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Nomor Induk Berusaha (NIB)</dt><dd className="font-semibold">1001220029304</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Penanggung jawab</dt><dd className="font-semibold">Supia Dirja</dd></div>
            <div className="md:col-span-2"><dt className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Alamat redaksi</dt><dd className="font-semibold">Jl. Raya Cigudeg Kidul, RT 003/RW 007, Desa Cigudeg, Kecamatan Cigudeg, Kabupaten Bogor</dd></div>
          </dl>
        </section>

        <section>
          <h2 className="font-headline font-black text-3xl mb-4">Kebijakan Redaksi</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p>Multinasnews berkomitmen menyajikan informasi yang akurat, berimbang, independen, dan dapat dipertanggungjawabkan. Setiap berita diupayakan melalui proses verifikasi dari sumber yang kredibel serta mematuhi Kode Etik Jurnalistik dan Pedoman Pemberitaan Media Siber.</p>
            <p>Multinasnews tidak menerima intervensi pihak mana pun yang dapat memengaruhi independensi pemberitaan. Konten iklan, kerja sama, atau advertorial akan dibedakan secara jelas dari konten redaksi.</p>
            <p className="text-sm italic">Kebijakan ini berpedoman pada Undang-Undang Nomor 40 Tahun 1999 tentang Pers, Kode Etik Jurnalistik, dan Pedoman Pemberitaan Media Siber.</p>
          </div>
        </section>

        <section>
          <h2 className="font-headline font-black text-3xl mb-4">Hak Jawab, Koreksi & Pengaduan</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p>Pembaca atau pihak terkait dapat mengajukan koreksi maupun hak jawab atas pemberitaan Multinasnews. Setiap permohonan akan ditinjau secara proporsional berdasarkan data dan bukti yang dapat dipertanggungjawabkan.</p>
            <p>Apabila terdapat kekeliruan, redaksi akan melakukan perbaikan seperlunya dan mencantumkan catatan pembaruan pada artikel bila diperlukan. Untuk hak jawab, koreksi, atau pengaduan, silakan hubungi redaksi melalui halaman Kontak.</p>
            <p className="text-sm italic">Multinasnews melayani Hak Jawab dan Hak Koreksi sebagaimana diatur dalam Pasal 5 ayat (2) dan ayat (3) Undang-Undang Nomor 40 Tahun 1999 tentang Pers.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-100 dark:border-cyan-900/60 bg-cyan-50/60 dark:bg-cyan-950/20 p-6 md:p-9 text-center">
          <p className="font-label font-bold text-xs tracking-widest uppercase text-cyan-600 mb-3">Pemberitahuan Redaksi</p>
          <h2 className="font-headline font-black text-2xl mb-4">Verifikasi Identitas Wartawan</h2>
          <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-300">Wartawan Multinasnews menjalankan tugas jurnalistik dengan identitas resmi dan surat penugasan apabila diperlukan. Untuk memastikan keabsahan pihak yang mengatasnamakan Multinasnews, masyarakat dapat memeriksa nama jurnalis pada halaman Struktur Redaksi atau menghubungi redaksi melalui kanal kontak resmi.</p>
        </section>
      </div>
    </main>
  );
}
