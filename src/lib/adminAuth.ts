import { auth } from './firebase';

// Daftar Email yang diberikan Otoritas Akses Dashboard (Sentinel Master List)
const ADMIN_EMAILS = [
  'multinasnews@gmail.com', // Email Utama Tuan Zoo
];

/**
 * Pengecekan apakah user yang login memiliki hak akses Admin.
 */
export const isUserAdmin = (email: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
