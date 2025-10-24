import BukuEkspedisiForm from '@/components/forms/BukuEkspedisiForm';

// Fungsi tiruan untuk mengambil data berdasarkan ID
// Ganti ini dengan logika fetch API kamu
async function getDataById(id: string) {
  console.log('Mengambil data untuk ID:', id);
  // Simulasikan pengambilan data
  // Di dunia nyata: const res = await fetch(`https/api/ekspedisi/${id}`)
  // const data = await res.json()
  
  // Data tiruan untuk ID '1' dan '2'
  if (id === '1') {
    return {
      nomorUrut: '1',
      kodeSurat: '', // Tidak ada di gambar 1
      nomorSurat: '34',
      tanggalSurat: '2025-09-10', // Format YYYY-MM-DD
      tujuan: 'dzikran',
      isiSingkat: 'tegar',
      tanggalPengiriman: '', // Tidak ada di gambar 1
      keterangan: '-',
    };
  }
  if (id === '2') {
     return {
      nomorUrut: '2',
      kodeSurat: '', // Tidak ada di gambar 1
      nomorSurat: '23',
      tanggalSurat: '2025-08-13', // Format YYYY-MM-DD
      tujuan: 'ds',
      isiSingkat: 'dsa',
      tanggalPengiriman: '2025-09-07', // Format YYYY-MM-DD
      keterangan: 'tes',
    };
  }
  
  // Jika ID tidak ditemukan
  return null;
}


// Ini adalah Server Component yang mengambil data di server
export default async function UbahEkspedisiPage({ params }: { params: { id: string } }) {
  
  // 1. Ambil ID dari URL
  const { id } = params;
  
  // 2. Ambil data dari database/API menggunakan ID
  const data = await getDataById(id);
  
  if (!data) {
    // Bisa return halaman 404 jika data tidak ditemukan
    return <div>Data tidak ditemukan</div>;
  }

  // 3. Render komponen Form, berikan dataAwal dan set isEditMode={true}
  return (
    <BukuEkspedisiForm isEditMode={true} dataAwal={data} />
  );
}