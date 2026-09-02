import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'multinasnews@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    const caller = await adminAuth.verifyIdToken(token);
    if (caller.email?.toLowerCase() !== ADMIN_EMAIL) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });

    const { email, password, name, role } = await request.json();
    if (!email || !password || !name || !['editor', 'reporter'].includes(role) || password.length < 6) {
      return NextResponse.json({ error: 'Data tidak valid. Password minimal 6 karakter.' }, { status: 400 });
    }
    const user = await adminAuth.createUser({ email, password, displayName: name });
    await adminAuth.setCustomUserClaims(user.uid, { role });
    await adminDb.collection('users').doc(user.uid).set({ name, email, role, createdAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.code === 'auth/email-already-exists' ? 'Email sudah terdaftar.' : 'Gagal membuat akun.' }, { status: 400 });
  }
}
