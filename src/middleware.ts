import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Sentinel Middleware
 * Gerbang pertahanan sisi server untuk memutus koneksi penyusup
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteksi khusus untuk area Admin
  if (pathname.startsWith('/mns-ctrl-7x9k2')) {
    const isBanned = request.cookies.get('sentinel_ban');

    if (isBanned && isBanned.value === 'true') {
      // Protokol Digital Black Hole: Putuskan akses secara diam-diam
      // Kita mengembalikan response kosong (404 stealth) sehingga penyerang mengira halaman tidak ada
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

// Hanya jalankan middleware pada rute admin untuk performa maksimal
export const config = {
  matcher: '/mns-ctrl-7x9k2/:path*',
};
