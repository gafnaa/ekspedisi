// Lokasi File: app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Langsung arahkan pengguna ke halaman login
  redirect('/login');
  
  // Kamu tidak perlu me-return JSX apapun
  // karena pengguna akan langsung dipindahkan.
}