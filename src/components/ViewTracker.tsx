'use client'
import { useEffect } from 'react';

/**
 * Komponen client untuk tracking views melalui API route.
 * Render-less component — tidak menampilkan UI apapun.
 */
export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    }).catch((e) => console.error('Gagal tracking view:', e));
  }, [articleId]);

  return null;
}
