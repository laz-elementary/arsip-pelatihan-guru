Project Arsip Pelatihan Guru SD

# Arsip Pelatihan Guru SD Lazuardi

Aplikasi arsip pelatihan guru dengan:

- Google Drive API untuk sertifikat dan bahan materi
- Supabase untuk data arsip dan metadata file
- Vercel untuk hosting frontend serta API backend

## Perbaikan penting pada versi ini

1. **Status upload palsu diperbaiki.** Pada versi sebelumnya, file sudah masuk Google Drive tetapi browser tidak dapat membaca respons akhir upload sehingga ditampilkan sebagai gagal.
2. Aplikasi sekarang melakukan **rekonsiliasi server-side** menggunakan `uploadId`. Bila file sudah ada di Drive, status dikembalikan menjadi berhasil tanpa mengunggah ulang.
3. Retry memakai `uploadId` yang sama, sehingga tidak membuat file ganda.
4. Penyimpanan metadata Supabase kompatibel dengan tabel lama yang belum mempunyai kolom `upload_id`.
5. Data pelatihan tidak lagi dihapus saat halaman dimuat ulang.
6. Arsip pelatihan disimpan ke tabel `trainings` Supabase, dengan localStorage sebagai cadangan sementara.
7. Project sudah dilengkapi entrypoint dan konfigurasi Vercel.

## 1. Siapkan Supabase

Buka **Supabase > SQL Editor > New query**, lalu jalankan seluruh isi file:

```text
SUPABASE_SETUP.sql
```

Skrip tersebut membuat atau memperbarui:

- `public.trainings`
- `public.training_files`
- index anti-duplikasi untuk `upload_id` dan `drive_file_id`

## 2. Environment Variables

Masukkan variabel berikut di **Vercel > Project > Settings > Environment Variables**:

```text
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID
GOOGLE_DRIVE_MATERIAL_FOLDER_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY                 # opsional untuk fitur AI
```

Catatan `GOOGLE_PRIVATE_KEY`:

- Tempel seluruh private key dari `-----BEGIN PRIVATE KEY-----` sampai `-----END PRIVATE KEY-----`.
- Kode sudah menangani newline berbentuk `\\n`.
- Jangan memasukkan secret ke GitHub.

## 3. Google Drive

Pastikan:

1. Google Drive API sudah aktif pada Google Cloud Project.
2. Folder Sertifikat dan Folder Materi sudah dibagikan kepada email pada `GOOGLE_CLIENT_EMAIL`.
3. Service account memiliki akses **Editor/Content Manager**.
4. Environment variable folder hanya berisi **Folder ID**, bukan URL lengkap.

## 4. Deploy GitHub ke Vercel

1. Buat repository GitHub baru.
2. Upload seluruh isi folder project ini ke repository.
3. Hubungkan repository tersebut ke Vercel.
4. Framework Preset dapat dibiarkan otomatis/Vite.
5. Tambahkan seluruh Environment Variables.
6. Klik **Deploy**.

Project memakai `vercel.json` untuk meneruskan semua request `/api/*` ke Express API.

## 5. Pengujian

Gunakan file baru, misalnya:

```text
TEST_UPLOAD_SERTIFIKAT_01.pdf
TEST_UPLOAD_MATERI_01.pdf
```

Urutan tes:

1. Buka **Status Integrasi** dan pastikan Drive serta Supabase berhasil.
2. Klik **Tambah Pelatihan**.
3. Pilih file sertifikat dan klik upload satu kali.
4. Tunggu sampai muncul **Sudah Terunggah di Google Drive**.
5. Pilih bahan materi dan lakukan hal yang sama.
6. Klik **Arsipkan Pelatihan**.
7. Pastikan data tampil di dashboard, tetap ada setelah refresh, dan hanya ada satu salinan file di Drive.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Gunakan file `.env.local` berdasarkan `.env.example`.
