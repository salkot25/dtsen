# Setup Google Apps Script (Backend)

Google Apps Script digunakan sebagai "Backend Tanpa Server" yang akan dihubungkan langsung ke frontend React.

## Langkah-langkah Pembuatan:

1. **Buat Spreadsheet Baru**
   - Buka [Google Sheets](https://sheets.google.com).
   - Buat spreadsheet baru dan beri nama `Database DTSEN Salkot`.
   - Di baris pertama (Header), isi kolom:
     - `A1` -> `ID`
     - `B1` -> `Tanggal`
     - `C1` -> `Kumulatif`
   - _(Sistem akan mengisi baris selanjutnya secara otomatis ketika ada input dari Web)_

2. **Buka Apps Script Editor**
   - Di Spreadsheet tersebut, klik menu **Ekstensi** > **Apps Script** (Extensions > Apps Script).
   - Anda akan diarahkan ke tab baru berisi code editor.

3. **Masukkan Kode Script**
   - Ganti nama file default atau biarkan `Code.gs`.
   - Salin dan tempel (Copy-Paste) seluruh isi dari file `Code.gs` yang ada di folder ini ke dalam editor Apps Script.
   - Klik ikon "Simpan" (Save) atau tekan `Ctrl + S`.

4. **Deploy sebagai Web App**
   - Klik tombol **Terapkan** (Deploy) biru di kanan atas layar > **Deployment Baru** (New deployment).
   - Klik ikon roda gigi pada bagian "Pilih jenis" (Select type) > pilih **Aplikasi Web** (Web app).
   - Isi deskripsi (bebas, misal: `v1.0`).
   - Bagian **Jalankan sebagai** (Execute as): Pilih `Saya` (Me).
   - Bagian **Siapa yang memiliki akses** (Who has access): WAJIB pilih `Siapa saja` (Anyone) agar front-end bisa mengirim request tanpa login Google.
   - Klik **Terapkan** (Deploy).

5. **Otorisasi Akses (Pertama kali saja)**
   - Jika muncul peringatan Otorisasi, klik **Beri akses**, lalu pilih akun Google Anda.
   - Jika muncul peringatan keamanan warna merah (_"Google belum memverifikasi aplikasi ini"_), klik tautan kecil `Lanjutan` (Advanced), lalu scroll ke bawah dan pilih `Buka [Nama Script Anda] (Tidak Aman)`.
   - Klik **Izinkan** (Allow).

6. **Salin URL Web App**
   - Setelah selesai, Anda akan melihat baris **URL Aplikasi Web** (Web app URL) yang diawali dengan `https://script.google.com/macros/s/..../exec`.
   - Salin (Copy) URL tersebut.

7. **Hubungkan dengan Frontend React**
   - Buka file `src/services/api.js` di dalam project React.
   - Ganti tulisan `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` pada variabel `SCRIPT_URL` dengan URL yang baru saja Anda salin.
   - Simpan file, dan sekarang aplikasi React sudah terhubung sepenuhnya dengan Google Sheets!
