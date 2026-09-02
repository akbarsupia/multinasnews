import axios from 'axios';
import * as cheerio from 'cheerio';
import { adminDb } from './firebaseAdmin';
import * as admin from 'firebase-admin';
import { rewriteNews } from './sentinelAI';

export interface ScrapedNews {
  title: string;
  category: string;
  image: string;
  content: string;
  author: string;
  sourceUrl: string;
}

/**
 * Sentinel Content Extractor
 * Fetches the full text content from the source URL for better AI rewriting.
 */
async function fetchFullContent(url: string): Promise<{ title: string; content: string; image: string }> {
  let data = '';
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  
  try {
    // Stage 1: Mobile Stealth Request
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': mobileUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });
    data = response.data;
  } catch (error: any) {
    // Stage 2: Fallback to AllOrigins Proxy (The Nuclear Bypass)
    console.log(`Sentinel: Direct access blocked or failed. Trying Nuclear Proxy...`);
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, { timeout: 15000 });
      data = response.data;
    } catch (proxyError: any) {
      // Stage 3: Last Stand - Googlebot
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
          timeout: 10000
        });
        data = response.data;
      } catch (err) {
        console.log(`Sentinel: [BLOKIR TOTAL] Akses ditolak penuh oleh situs sumber (Cloudflare/Bot Guard). Kembali mode ringkasan.`);
        return { title: 'BLOKIR', content: '', image: '' };
      }
    }
  }

  try {
    if (!data) return { title: 'KOSONG', content: '', image: '' };
    const $ = cheerio.load(data);
    
    // Clean all scripts and styles before parsing
    $('script, style, noscript, iframe').remove();

    // Extract Title (Cleaned)
    const rawTitle = $('title').text() || $('h1').first().text();
    const extractedTitle = rawTitle.replace(/google search|cached|halaman/gi, '').split('|')[0].split('-')[0].trim() || 'Berita Terkini';

    // Extract High-Res Image from Meta Tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    const highResImage = ogImage || twitterImage || '';

    // Extract Text (Universal fallback approach)
    let fullText = '';
    const noiseWords = ['baca juga', 'klik di sini', 'iklan', 'advertisement', 'copyright', 'all rights reserved', 'follow kami', 'berlangganan', 'shared from', 'download aplikasi'];
    
    // First try: Specific known selectors
    const selectors = 'article p, .article__content p, .story-body__inner p, .post-content p, .post-description p, .text-detail p, .detail__body-text p, .read__content p';
    $(selectors).each((_, el) => {
      const pText = $(el).text().trim();
      const isNoise = noiseWords.some(word => pText.toLowerCase().includes(word));
      if (pText.length > 40 && !isNoise) {
        fullText += pText + '\n\n';
      }
    });

    // Second try: If still empty, grab any <p> with substantial text length
    if (fullText.length < 200) {
      $('p').each((_, el) => {
        const pText = $(el).text().trim();
        const isNoise = noiseWords.some(word => pText.toLowerCase().includes(word));
        if (pText.length > 50 && !isNoise && !fullText.includes(pText)) {
          fullText += pText + '\n\n';
        }
      });
    }

    // Third try: SUPER UNIVERSAL (Grab any DIV or SECTION with high text density)
    if (fullText.length < 300) {
      $('div, section').each((_, el) => {
        const divText = $(el).children().length === 0 ? $(el).text().trim() : ''; 
        if (divText.length > 150 && !noiseWords.some(w => divText.toLowerCase().includes(w))) {
           fullText += divText + '\n\n';
        }
      });
    }

    // Fourth try: Meta Description (Emergency Fallback)
    if (fullText.length < 100) {
      const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
      if (metaDesc) fullText = metaDesc;
    }

    // Fifth try: SUPER AGGRESSIVE (Grab EVERY single text node in the body that is long)
    if (fullText.length < 50) {
      $('body *').each((_, el) => {
        if ($(el).children().length === 0) {
          const text = $(el).text().trim();
          // Filter out code-like strings
          const looksLikeCode = /\{|\[|\(|var |function|sei=|sei:|sei |window\.|document\./i.test(text);
          if (text.length > 30 && !looksLikeCode) fullText += text + '. ';
        }
      });
    }

    // Final Sanitization: Remove any remaining code-like fragments
    fullText = fullText.replace(/\(function\(\)\{[\s\S]*?\}\)\(\);/g, ''); 
    fullText = fullText.replace(/\{[\s\S]*?\}/g, ''); // Remove curly brace blocks

    return { 
      title: extractedTitle,
      content: fullText.trim() || 'No content found but proceeding with metadata...', 
      image: highResImage 
    };
  } catch (error: any) {
    console.error('Content Extraction Failed:', error.message);
    const status = error.response?.status;
    const errorMsg = status === 403 ? 'Website memblokir bot (403 Forbidden)' : error.message;
    throw new Error(errorMsg);
  }
}

/**
 * Sentinel Scraper Protocol (Multi-RSS Fail-Safe Base)
 * High-reliability news crawler menggunakan acak dari multi-jaringan.
 */
export async function scrapeNews(category: string = 'Umum'): Promise<ScrapedNews[]> {
  const RssFeeds = [
    'https://www.cnnindonesia.com/nasional/rss',
    'https://nasional.tempo.co/rss',
    'https://www.cnbcindonesia.com/news/rss',
    'https://www.republika.co.id/rss/nasional'
  ];
  
  // Mengacak urutan server untuk mencegah pola bot yang bisa diblokir Cloudflare
  const shuffledFeeds = RssFeeds.sort(() => 0.5 - Math.random());
  const articles: ScrapedNews[] = [];

  for (const url of shuffledFeeds) {
    console.log(`\n=========================================\n[Sentinel Global Cycle] Uji Coba Ekstraksi Dari: ${url}\n=========================================`);
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        timeout: 15000 // Antisipasi server lemot
      });
      const $ = cheerio.load(data, { xmlMode: true });

      const items = $('item').toArray();
      if (items.length === 0) {
         console.log(`Sentinel: Format RSS ${url} kosong atau dienkripsi. Mencari cadangan...`);
         continue; 
      }

      for (let i = 0; i < Math.min(items.length, 5); i++) {
        const el = items[i];
        const title = $(el).find('title').text().replace('<![CDATA[', '').replace(']]>', '').trim();
        const link = $(el).find('link').text().trim();
        let description = $(el).find('description').text().replace('<![CDATA[', '').replace(']]>', '').replace(/<[^>]*>?/gm, '').trim(); 
        
        if (title && link) {
          try {
             console.log(`Sentinel: Menganalisa Berita -> "${title.substring(0, 50)}..."`);
             const fullData = await fetchFullContent(link);

             // Fallback ajaib: Jika diblokir (kosong), paksa AI mengembangkan 'description' dari RSS
             const finalContent = fullData.content.length > 100 ? fullData.content : description;

             if (finalContent.length > 20) {
                articles.push({
                  title,
                  category,
                  image: fullData.image || 'https://images.unsplash.com/photo-1585829365234-781fbc37c22d?q=80&w=2070&auto=format&fit=crop',
                  content: finalContent,
                  author: 'Tim Redaksi',
                  sourceUrl: link
                });
             } else {
                console.log(`Sentinel: Gagal, ringkasan dan berita asli sama-sama kosong.`);
             }
          } catch (innerErr: any) {
             console.error(`Sentinel (Fail-Safe): Gagal memproses berita tunggal "${title}". Melewati rintangan ini...`);
             continue; // TERUS JALANKAN jika ada 1 error!
          }
        }
      }

      // Begitu SUKSES mengamankan berita dari 1 sumber situs, langsung keluar dari rantai pencarian agar tidak berlebihan
      if (articles.length > 0) {
         console.log(`Sentinel: Sukses Berburu! Menangkap ${articles.length} berita utuh dari ${url}`);
         return articles;
      }
    } catch (error) {
      console.error(`Sentinel RSS Fetch Error [${url}]: Server tidak merespon/memblokir bot. MELOMPAT KE SERVER CADANGAN...`);
      continue; // Coba satukan link RSS situs sebelahnya
    }
  }

  // Jika semua 4 stasiun RSS diblokir mutlak
  return articles;
}

/**
 * Auto-Pilot Posting Logic (Admin Authority + AI Rewriter)
 */
export async function autoPostScrapedNews(articles: ScrapedNews[]) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0,
    lastError: null as string | null
  };

  const articlesRef = adminDb.collection('articles');
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const article of articles) {
    try {
      // 1. Duplicate Check
      const snapshot = await articlesRef.where('sourceUrl', '==', article.sourceUrl).get();
      if (!snapshot.empty) {
        results.skipped++;
        continue;
      }

      // JEDA 3 DETIK (Mencegah Google Gemini API 429 Too Many Requests Quota Limit)
      await sleep(3000);

      // 2. AI Rewriting Protocol
      console.log(`Sentinel AI: Rewriting "${article.title}"...`);
      const rewritten = await rewriteNews(article.title, article.content);

      // 3. Admin Authority Sync
      await articlesRef.add({
        ...article,
        title: rewritten.title,
        content: rewritten.content,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAutoGenerated: true,
        isAIRewritten: true
      });
      
      results.added++;
    } catch (err: any) {
      console.error('AutoPost Admin Error:', err.message);
      results.lastError = err.message;
      results.errors++;
    }
  }

  return results;
}

/**
 * Single URL Scraper & AI Processor
 * Processes a single manual URL from the dashboard.
 */
export async function processSingleUrl(url: string, customText?: string) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0,
    lastError: null as string | null
  };

  try {
    const articlesRef = adminDb.collection('articles');

    // 1. Fetch Data (Direct or Scraped)
    let fullData: { title: string; content: string; image: string };
    
    if (customText) {
      console.log(`Sentinel: Processing Manual Content Bypass...`);
      fullData = {
        title: 'Berita Penting Terkini',
        content: customText,
        image: 'https://images.unsplash.com/photo-1585829365234-781fbc37c22d?q=80&w=2070&auto=format&fit=crop'
      };
    } else {
      // Duplicate Check (Only for URL-based scrapes)
      const snapshot = await articlesRef.where('sourceUrl', '==', url).get();
      if (!snapshot.empty) {
        results.skipped++;
        return results;
      }

      console.log(`Sentinel: Fetching "${url}"...`);
      fullData = await fetchFullContent(url);
    }

    if (!fullData.content || fullData.content.length < 50) {
      throw new Error('Konten berita tidak terdeteksi atau terlalu pendek (Security Block).');
    }

    // 2. AI Rewriting
    console.log(`Sentinel AI: Rewriting "${fullData.title}"...`);
    const rewritten = await rewriteNews(fullData.title, fullData.content);

    // 3. Save to Firestore
    await articlesRef.add({
      title: rewritten.title,
      content: rewritten.content,
      category: 'Umum',
      image: fullData.image,
      author: 'Akbar',
      sourceUrl: url || 'manual://' + Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAutoGenerated: true,
      isAIRewritten: true
    });

    results.added++;
  } catch (err: any) {
    console.error('Process Single URL Error:', err.message);
    results.lastError = err.message;
    results.errors++;
  }

  return results;
}
