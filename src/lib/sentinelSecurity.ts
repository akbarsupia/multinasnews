/**
 * Sentinel Security Suite
 * Advanced Device Fingerprinting & Blacklist Management
 */

/**
 * Menghasilkan sidik jari perangkat unik (Digital DNA)
 * Berdasarkan karakteristik browser dan hardware
 */
export const getDeviceFingerprint = (): string => {
  if (typeof window === 'undefined') return 'server-side';

  const { userAgent, language, platform } = navigator;
  const { width, height, colorDepth, pixelDepth } = window.screen;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Kombinasi data untuk membuat ID unik
  const rawData = `${userAgent}|${language}|${platform}|${width}x${height}|${colorDepth}|${pixelDepth}|${timezone}`;
  
  // Hashing sederhana (djb2) untuk mengubah string menjadi ID yang ringkas
  let hash = 0;
  for (let i = 0; i < rawData.length; i++) {
    const char = rawData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  return `sentinel-${Math.abs(hash).toString(16)}`;
};

/**
 * Mencatat upaya pembobolan dan memblokir perangkat
 */
export const logSentinelBreach = async (email: string) => {
  const fingerprint = getDeviceFingerprint();
  
  try {
    await fetch('/api/sentinel/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fingerprint, 
        email,
        timestamp: new Date().toISOString()
      }),
    });
    
    // Set Local Ban Flag (First Layer)
    localStorage.setItem('sentinel_shutdown', 'true');
    
    // Silently redirect to nothingness
    window.location.href = 'about:blank';
  } catch (error) {
    console.error('Sentinel Error (Breach Log Failed)', error);
    window.location.href = 'about:blank';
  }
};

/**
 * Check if the device is already marked for shutdown locally
 */
export const checkLocalSentinelBan = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sentinel_shutdown') === 'true';
};
