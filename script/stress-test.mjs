// stress-test.mjs
import { performance } from "perf_hooks";

// --- KONFIGURASI TES ---

// 1. Ganti dengan ID user 'staf1'
const STAF_USER_ID = "ada60868-1d08-41f1-a060-18d8f8f03970";

// 2. Total request yang akan dikirim
const TOTAL_REQUESTS = 1000;

// 3. (BARU) Jumlah request per batch untuk laporan berkala
const BATCH_SIZE = 100; // Akan ada 10 batch (1000 / 100)

// 4. URL endpoint API Anda
const API_URL = "http://localhost:3000/api/surat";

// 5. (Opsional) Set ke false jika Anda ingin menguji TANPA upload file
const INCLUDE_FILE_UPLOAD = true;

// 6. (Opsional) Teks panjang untuk 'perihal'
const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// --- FUNGSI HELPER (Tidak berubah) ---

function generateMockData(index) {
  const uniqueSuffix = `${index}-${Date.now()}`;
  const today = new Date().toISOString().split("T")[0];

  const fd = new FormData();
  fd.append("nomorSurat", `SURAT/STRESS-TEST/${uniqueSuffix}`);
  fd.append("tanggalSurat", today);
  fd.append("tanggalPengiriman", today);
  fd.append("perihal", `Test Perihal Panjang #${index} - ${LOREM_IPSUM}`);
  fd.append("tujuan", `Tujuan Test #${index}`);
  fd.append("userId", STAF_USER_ID);
  fd.append("keterangan", `Keterangan untuk tes ke-${index}`);

  if (INCLUDE_FILE_UPLOAD && index % 2 === 0) {
    const dummyFileContent = `Ini adalah file dummy untuk tes #${index}`;
    const blob = new Blob([dummyFileContent], { type: "text/plain" });
    fd.append("berkas", blob, `testfile_${uniqueSuffix}.txt`);
  }
  return fd;
}

async function sendRequest(index) {
  const formData = generateMockData(index);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok || !responseData.ok) {
      return {
        status: "failed",
        index,
        statusCode: response.status,
        error: responseData.error || `HTTP error ${response.status}`,
      };
    }
    return { status: "success", index, data: responseData.data.id };
  } catch (error) {
    return { status: "error", index, error: error.message };
  }
}

// --- FUNGSI UTAMA (Diperbarui dengan Logika Batch) ---

async function runTest() {
  console.log(`--- Memulai Stress Test ---`);
  console.log(`Target: ${API_URL}`);
  console.log(`Total Request: ${TOTAL_REQUESTS}`);
  console.log(`Ukuran Batch: ${BATCH_SIZE}`);
  console.log(`Upload File Aktif: ${INCLUDE_FILE_UPLOAD}\n`);

  if (STAF_USER_ID.includes("MASUKKAN_ID")) {
    console.error(
      "❌ ERROR: Harap edit file stress-test.mjs dan masukkan STAF_USER_ID yang valid."
    );
    return;
  }

  const overallStartTime = performance.now();
  let totalSuccessCount = 0;
  let totalFailures = [];

  const numBatches = Math.ceil(TOTAL_REQUESTS / BATCH_SIZE);

  for (let batchNum = 0; batchNum < numBatches; batchNum++) {
    const batchStartTime = performance.now();
    const requests = [];
    const startIndex = batchNum * BATCH_SIZE;
    const endIndex = Math.min((batchNum + 1) * BATCH_SIZE, TOTAL_REQUESTS);

    console.log(
      `--- Menjalankan Batch ${batchNum + 1}/${numBatches} (Request ${
        startIndex + 1
      } s/d ${endIndex}) ---`
    );

    // 1. Buat semua promise untuk batch ini
    for (let i = startIndex; i < endIndex; i++) {
      requests.push(sendRequest(i + 1));
    }

    // 2. Jalankan batch ini secara bersamaan
    const batchResults = await Promise.allSettled(requests);

    // 3. Analisis hasil batch
    let batchSuccessCount = 0;
    let batchFailures = [];

    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value.status === "success") {
        batchSuccessCount++;
      } else if (result.status === "fulfilled") {
        batchFailures.push(result.value);
      } else {
        batchFailures.push({ status: "error", error: result.reason });
      }
    });

    // 4. Update total dan laporkan
    totalSuccessCount += batchSuccessCount;
    totalFailures.push(...batchFailures);

    const batchEndTime = performance.now();
    const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2);
    const failureStatus =
      batchFailures.length > 0
        ? `❌ GAGAL: ${batchFailures.length}`
        : `✅ BERHASIL`;

    console.log(
      `Batch ${
        batchNum + 1
      } selesai dalam ${batchDuration} detik. (${failureStatus})`
    );

    // --- Laporan Berkala (Ini yang Anda minta) ---
    console.log(`   Laporan Total Sejauh Ini:`);
    console.log(`   -> Entri Diproses: ${endIndex} / ${TOTAL_REQUESTS}`);
    console.log(`   -> Total Berhasil : ${totalSuccessCount}`);
    console.log(`   -> Total Gagal    : ${totalFailures.length}\n`);
    // ---------------------------------------------
  }

  // --- Laporan Akhir Keseluruhan ---
  const overallEndTime = performance.now();
  const durationInSeconds = (
    (overallEndTime - overallStartTime) /
    1000
  ).toFixed(2);

  const successPercentage = (
    (totalSuccessCount / TOTAL_REQUESTS) *
    100
  ).toFixed(1);
  const failurePercentage = (
    (totalFailures.length / TOTAL_REQUESTS) *
    100
  ).toFixed(1);

  console.log(`\n--- Hasil Stress Test Selesai ---`);
  console.log(`Total Waktu: ${durationInSeconds} detik`);
  console.log(
    `Rata-rata: ${(TOTAL_REQUESTS / parseFloat(durationInSeconds)).toFixed(
      2
    )} request/detik`
  );
  console.log(`✅ Berhasil: ${totalSuccessCount} (${successPercentage}%)`);
  console.log(`❌ Gagal: ${totalFailures.length} (${failurePercentage}%)`);

  if (totalFailures.length > 0) {
    console.log("\nDetail Kegagalan (Contoh 5 teratas):");
    console.table(totalFailures.slice(0, 5));
    const uniqueErrors = [
      ...new Set(totalFailures.map((f) => f.error?.toString())),
    ];
    console.log("\nJenis Error yang Ditemukan:");
    uniqueErrors.forEach((err) => console.log(`- ${err}`));
  }
}

runTest().catch(console.error);
