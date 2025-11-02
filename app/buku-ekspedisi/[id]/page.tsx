import BukuEkspedisiForm from "@/components/forms/BukuEkspedisiForm";

async function getSuratById(id: string) {
  const res = await fetch(`http://localhost:3000/api/surat/${id}`, {
    cache: "no-store",
  });
  const json = await res.json();
  return json.data;
}

// 🔧 Versi yang sesuai dengan Next.js 15
export default async function EditEkspedisiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Di Next.js 15, params adalah Promise, jadi perlu di-await
  const { id } = await params;

  const data = await getSuratById(id);

  if (!data) {
    return <p className="p-6">Data tidak ditemukan.</p>;
  }

  return <BukuEkspedisiForm dataAwal={data} isEditMode={true} />;
}
