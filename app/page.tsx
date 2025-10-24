// Lokasi File: app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Langsung arahkan pengguna ke halaman tabel
  redirect('/buku-ekspedisi');
  
  // Kamu tidak perlu me-return JSX apapun
  // karena pengguna akan langsung dipindahkan.
}