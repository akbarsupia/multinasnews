export interface Article {
  id: string;
  title: string;
  category: string;
  image: string;
  content: string;
  author: string;
  views?: number; // Optional views tracking
  createdAt: any; // Firebase Timestamp
}

export interface Journalist {
  id: string; // Document ID
  uid: string; // The specific UID used in UI
  name: string;
  title: string; // This was 'role' or 'specialization'
  bio: string;
  img: string; // This was 'profileImage'
  verified?: boolean;
  createdAt?: any;
}
