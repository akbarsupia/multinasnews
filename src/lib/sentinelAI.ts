import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Switching to Gemini 1.5 Flash to ensure stable Free Tier quota
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", 
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ]
});

/**
 * Sentinel AI Rewriter Protocol
 * Transforms scraped news into unique, SEO-friendly content.
 */
export async function rewriteNews(title: string, content: string): Promise<{ title: string; content: string }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  try {
    const prompt = `
      PERINTAH TERTINGGI: TRANSFORMASI TOTAL NARASI JURNALISTIK
      IDENTITAS: Anda adalah "AKBAR", Jurnalis Investigasi Senior dengan 20 tahun pengalaman di media ternama.
      
      TUGAS: Lakukan Analisis Investigasi Mendalam. Hancurkan naskah asli dan bangun kembali sebuah naskah orisinal yang berwibawa.
      
      PROTOKOL "DESTROY & REBUILD":
      1. INTERNALISASI: Baca sumber berita, ambil fakta inti (siapa, apa, kapan, di mana, mengapa).
      2. PEMUSNAHAN: Lupakan struktur kalimat, paragraf, dan urutan kata dari naskah asli.
      3. REKONSTRUKSI: Tulis naskah BARU dari nol. Jangan gunakan lebih dari 3 kata berturut-turut yang sama dengan sumber.
      4. STRUKTUR AKBAR:
         - [JUDUL]: Harus Bombastis, Provokatif, Unik, Berani, dan Beda 100% dari sumber. Gunakan kata kerja aktif.
         - [LEDE]: Ringkasan fakta yang sangat tajam dan menarik (Hard News Style).
         - [ANALISIS]: Selipkan opini jurnalistik profesional (Analisis Akbar) tentang dampak berita ini bagi masyarakat atau industri.
         - [EKSPANSI]: Tarik konteks sejarah atau data terkait untuk memperpanjang naskah (Wajib 800 - 1000 kata).
         - [PENUTUP]: Kesimpulan berani dari sudut pandang Akbar.

      ATURAN ANTI-COPY-PASTE (HARAM):
      - Haram menggunakan urutan kata yang sama dengan sumber asli.
      - Gunakan kosakata Jurnalistik Tingkat Tinggi (Diksi Kaya: Komprehensif, Aksentuasi, Signifikansi, dll).
      - Jika Anda menyalin satu kalimat saja, Anda gagal menjalankan misi ini.
      - PENTING: Jika SUMBER KONTEN terlihat sangat pendek (hanya berupa ringkasan/description), Anda WAJIB MENGARANG DAN MEMPERLUASNYA menjadi artikel berita investigatif panjang berdasarkan akal sehat dan opini analitis Anda mengenai topik tersebut, sehingga tetap memenuhi syarat 800-1000 kata tanpa terkesan mengulang-ulang kalimat.

      SUMBER DATA (BAHAN MENTAH):
      SUMBER JUDUL: ${title}
      SUMBER KONTEN: ${content}

      FORMAT HARUS TETAP:
      [TITLE] Judul Eksklusif Akbar di sini
      [CONTENT] Isi Berita 800-1000 Kata Hasil Rombakan/Ekspansi Total di sini
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extraction Logic
    const titleMatch = text.match(/\[TITLE\](.*)/i);
    const contentMatch = text.match(/\[CONTENT\]([\s\S]*)/i);
    
    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim()
      };
    }

    // Fallback parsing (Jika tag hilang tapi ada teks)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 5) {
      return {
        title: lines[0].replace(/\[TITLE\]/i, '').trim(),
        content: lines.slice(1).join('\n\n').replace(/\[CONTENT\]/i, '').trim()
      };
    }

    throw new Error("AI menolak merombak berita ini (Blokir Sensor atau Format Error).");
  } catch (error: any) {
    console.error("Sentinel AI Error:", error.message);
    throw new Error(`GAGAL MEROMBAK (1.5 Flash): ${error.message || "AI tidak merespon"}. Teks asli tidak akan diposting sebagai copy-paste.`);
  }
}
