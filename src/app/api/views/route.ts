import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * API Route: POST /api/views
 * Increment view count server-side menggunakan Firebase Admin SDK.
 * Ini menghindari konflik Firestore Rules yang memblokir write dari user publik.
 */
export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json({ error: 'articleId wajib diisi' }, { status: 400 });
    }

    // Validasi: pastikan artikel ada
    const docRef = adminDb.collection('articles').doc(articleId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    // Increment views secara atomik via Admin SDK (bypass rules)
    await docRef.update({
      views: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing views:', error);
    return NextResponse.json({ error: 'Gagal mencatat view' }, { status: 500 });
  }
}
