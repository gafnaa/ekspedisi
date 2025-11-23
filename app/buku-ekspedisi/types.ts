export interface SuratEkspedisi {
  id: string;
  tglPengiriman: string | null; // ISO string
  noSurat: string;
  tglSurat: string; // ISO string
  isiSingkat: string;
  ditujukan: string;
  keterangan: string;
  signDirectory?: string | null;
}
