# Memasang CodEX AI Terminal 1.2.0 dari HP Android

## 1. Ganti isi repository GitHub

1. Unduh `CodEX-AI-Terminal-v1.2.0.zip`, lalu ekstrak dengan File Manager.
2. Buka repository `Terminal-Codex` di GitHub.
3. Pilih **Add file → Upload files**.
4. Buka folder `CodEX-AI-Terminal` hasil ekstrak dan pilih seluruh ISI di dalamnya.
5. Unggah ke root repository. Folder `.github` harus berada langsung di root repository; jangan membuat folder proyek kedua di dalam repository.
6. Jika GitHub meminta konfirmasi file yang sudah ada, ganti file proyek lama dengan file versi 1.2.0.
7. Commit ke branch `main`.

Struktur root yang benar: `.github/`, `public/`, `src/`, `package.json`, `capacitor.config.ts`, dan file konfigurasi lainnya. Hanya ada satu folder `.github`.

## 2. Deploy versi web

1. Buka **Settings → Pages** di repository.
2. Atur **Build and deployment → Source** menjadi **GitHub Actions**.
3. Buka tab **Actions**.
4. Jalankan **Deploy CodEX AI to GitHub Pages**, atau tunggu workflow berjalan setelah commit.
5. Setelah selesai, buka URL Pages dari ringkasan deployment.

## 3. Sambungkan Gemini

1. Buat API key melalui [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Buat akun atau login ke CodEX.
3. Buka **Settings**, masukkan API key pada akun tersebut.
4. Buka **Models**, lalu tekan **Refresh Model Catalogue**. Pilih salah satu ID model yang benar-benar dikembalikan oleh API.

Firebase tidak diperlukan. Akun lokal, API key, pengaturan, riwayat dan file tersimpan di browser/perangkat ini. API key tidak disinkronkan antar akun, tetapi tetap dapat diperiksa oleh orang yang mempunyai akses ke data browser.

## 4. Fitur utama

- **Console:** kirim pesan, hentikan respons yang sedang berjalan, balas jawaban AI, atau gunakan kembali prompt sebelumnya.
- **REGENERATE:** minta alternatif jawaban untuk prompt yang sama.
- **Voice Input:** tekan simbol mikrofon dan ucapkan pesan dalam Bahasa Indonesia. Fitur ini bergantung pada dukungan browser dan izin mikrofon.
- **ATTACH:** unggah gambar, PDF, DOCX, ZIP, teks, JSON atau source code. ZIP dibuka secara lokal; file yang didukung dibaca sebelum konteks dikirim ke Gemini.
- **Files:** code block yang menyebut nama/path file dapat disimpan ke workspace.
- **Canvas:** file HTML dapat dibuka sebagai preview terisolasi; file CSS dan JavaScript yang cocok akan dicoba dimasukkan ke HTML.
- **Project ZIP:** gabungkan file workspace menjadi satu ZIP. Tekan **DOWNLOAD FILE** pada panel unduhan untuk mulai menyimpan.
- **Plugins:** aktif/nonaktifkan fitur bawaan seperti pembaca dokumen, ZIP Explorer, Canvas, pencarian file dan voice input.
- **Memory:** simpan hobi, minat dan preferensi yang ingin dipakai sebagai konteks.
- **Notifications:** aktifkan di **Device & alerts** dan izinkan notifikasi Android.

## 5. Simpan file di Android

Ketika memasang versi APK, tombol unduhan menulis hasil ke cache aplikasi lalu membuka Android share sheet. Pilih **Files** atau aplikasi penyimpanan, kemudian pilih folder seperti **Downloads**. Menekan tombol unduh membuka pilihan simpan; file tidak dianggap tersimpan sampai tujuan dipilih. Di browser, unduhan memakai mekanisme download browser.

## 6. Batas notifikasi latar belakang

CodEX dapat menampilkan notifikasi lokal jika respons selesai selagi proses aplikasi/WebView masih diizinkan berjalan. Mengetuk notifikasi akan membuka Console. Jika Android menutup paksa atau menghentikan proses aplikasi, request Gemini di dalam aplikasi juga berhenti. Agar jawaban tetap selesai setelah aplikasi benar-benar ditutup dibutuhkan backend job yang berjalan di server serta layanan push notification. GitHub Pages saja tidak dapat menjalankan pekerjaan tersebut.

## 7. Meter penggunaan dan timer visual

Tampilan meter memberi batas lokal **20.000 token per hari** dan **100.000 token per minggu** dengan reset WIB. Meter ini berada di browser dan dapat diubah melalui data lokal; batas yang tidak bisa dimanipulasi membutuhkan backend. Durasi pergantian label aktivitas pada layar dibuat acak sekitar 0,85–2,6 detik. Label itu adalah status tingkat tinggi antarmuka, bukan tampilan proses berpikir internal model.

## 8. Bangun APK melalui GitHub Actions

1. Pastikan seluruh isi folder versi 1.2.0 sudah diunggah dan di-commit ke `main`.
2. Buka **Actions → Build CodEX AI Android APK**.
3. Tekan **Run workflow**. Workflow juga berjalan ketika ada push ke `main`.
4. Tunggu hingga semua langkah berstatus sukses.
5. Buka ringkasan run dan unduh artifact **CodEX-AI-Terminal-v1.2.0-APK**.
6. Ekstrak ZIP artifact; file instalasinya bernama `app-debug.apk`.

APK yang dihasilkan adalah debug build untuk uji/pasang manual, bukan build Play Store yang ditandatangani untuk distribusi resmi. Workflow menjalankan pemeriksaan TypeScript dan build web terlebih dahulu; bila salah satunya gagal, APK tidak diterbitkan.
