import BukuEkspedisiForm from '@/components/forms/BukuEkspedisiForm';

// Ini adalah Server Component, tugasnya hanya me-render
// komponen Form dalam mode "Tambah" (isEditMode={false})
export default function TambahEkspedisiPage() {
  return (
    <BukuEkspedisiForm isEditMode={false} />
  );
}