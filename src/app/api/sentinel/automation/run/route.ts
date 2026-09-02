import { NextResponse } from 'next/server';
import { scrapeNews, autoPostScrapedNews, processSingleUrl } from '@/lib/sentinelScraper';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Security Guard: Check for authorized admin session
    const cookieStore = await cookies();
    const isBanned = cookieStore.get('sentinel_ban');
    
    if (isBanned) {
      return NextResponse.json({ error: 'Access Denied by Sentinel' }, { status: 403 });
    }

    // High-Level Security: Sentinel Auth Key Validation
    const authKey = request.headers.get('x-sentinel-key');
    if (authKey !== process.env.NEXT_PUBLIC_SENTINEL_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Sentinel Key' }, { status: 401 });
    }

    // Parse Body for Manual URL
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body may be empty for regular automation cycles
    }

    console.log('Sentinel Automation: Starting Scraping Cycle...');
    
    let results;
    if (body.manualContent) {
      console.log(`Sentinel: Processing Manual Content...`);
      results = await processSingleUrl(body.url || 'https://manual.input', body.manualContent);
    } else if (body.url) {
      console.log(`Sentinel: Processing Manual URL: ${body.url}`);
      results = await processSingleUrl(body.url);
    } else {
      // RSS Global Cycle
      const scrapedArticles = await scrapeNews('Umum');
      if (scrapedArticles.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No new articles found or scraping failed.' 
        });
      }
      results = await autoPostScrapedNews(scrapedArticles);
    }

    return NextResponse.json({
      success: true,
      message: 'Automation cycle completed.',
      data: results
    });

  } catch (error: any) {
    console.error('Sentinel Automation API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
