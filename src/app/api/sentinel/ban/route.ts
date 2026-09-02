import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { fingerprint, email } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Simpan ke koleksi Blacklist
    await addDoc(collection(db, 'sentinel_blacklist'), {
      fingerprint,
      ip,
      emailAttempt: email,
      timestamp: serverTimestamp(),
      reason: 'Unauthorized Admin Access Attempt',
      status: 'PERMANENT_BAN'
    });

    // Berikan response yang menanamkan Cookie "Ban" permanen (10 tahun)
    const response = NextResponse.json({ status: 'sentinel_active' });
    response.cookies.set('sentinel_ban', 'true', {
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 tahun
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    return response;
  } catch (error) {
    console.error('Sentinel API Error:', error);
    return NextResponse.json({ error: 'Sentinel offline' }, { status: 500 });
  }
}
