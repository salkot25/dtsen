# Aplikasi Monitoring DTSEN ULP Salatiga Kota

![Status](https://img.shields.io/badge/Status-Production_Ready-success)
![Platform](https://img.shields.io/badge/Platform-Web_Application-blue)
![Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_Vite_%7C_Tailwind_v3_%7C_GAS-informational)

Aplikasi web modern (Responsive Desktop & Mobile) yang dirancang untuk membantu Koordinator Petugas/Admin ULP Salatiga Kota dalam memantau, mendata, dan melaporkan secara otomatis performa realisasi pencapaian target pendataan DTSEN (Target total: 206.533 pelanggan s/d 31 Agustus 2026).

---

## 🌟 Fitur Utama (Features)

1. **Dashboard Overview & Analitik Tingkat Enterprise:**
   - 4 Kartu KPI Dinamis: Total Capaian, Kinerja Harian Terakhir, Rata-rata Harian, dan Kalkulasi Sisa Waktu & Target Baru.
   - **Visualisasi AreaChart:** Menggunakan warna gradasi biru yang modern dengan filter khusus (7 Hari, 30 Hari, Semua Riwayat) yang otomatis terpotong berdasarkan pilihan (*Client-side slicing*).

2. **Otentikasi Kredensial via Google Sheets (Serverless Backend):**
   - Layar *Login* aman dengan animasi loading dan validasi database dari Spreadsheet (mengakses Sheet bernama `Users`).
   - Default login: `admin` / `salkot123`.

3. **Modul Input Data Harian & Validasi Berlapis:**
   - Fitur pencegahan salah angka (huruf otomatis ditolak).
   - Penolakan jika input angka kumulatif terbaru lebih kecil atau sama dengan angka hari sebelumnya.
   - Perhitungan jumlah capaian harian yang dikalkulasi otomatis di *frontend* sebelum ditambahkan ke *backend*.

4. **Tabel Riwayat & Ekstraktor Laporan WhatsApp:**
   - Sistem membaca dan mem-parsing histori input dan merendernya dalam tabel (Terbaru di bagian atas/Descending).
   - "Terminal-styled" Generator pesan WhatsApp yang merangkum *bullet point* evaluasi pencapaian. Tombol khusus menyalin isi dan *Launch Deep Link* aplikasi WhatsApp `wa.me/`.

---

## 💻 Tech Stack & Arsitektur

### Frontend
- **React 19** + **Vite 8**: *Build tool* dan framework SPA super cepat.
- **Tailwind CSS v3**: Utilitas framework styling *(Enterprise Minimalism theme)*.
- **Lucide-React**: Ikonografi vektor minimalis yang presisi.
- **Recharts**: Rendering SVG tingkat tinggi untuk grafik analitik interaktif.
- **Date-Fns**: Memastikan perhitungan hari kerja (*Business Days*) akurat.

### Backend (Serverless)
- **Google Apps Script (GAS)**: Berfungsi sebagai router API (mengelola *JSON Payload POST* dan *GET*).
- **Google Sheets**: Berperan sebagai database utama penyimpanan data riwayat dan pengguna.

---

## 📂 Struktur Direktori (*Directory Structure*)

```
/dtsen_salkot
├── /google_apps_script      # File Backend
│   ├── Code.gs              # Script Server untuk Google Sheets (Router POST/GET)
│   └── README.md            # Panduan instalasi backend
├── /src
│   ├── /components
│   │   ├── DashboardOverview.jsx  # Grafik Recharts & Status KPI
│   │   ├── HistoryTable.jsx       # Tabel Log Riwayat (Descending)
│   │   ├── InputForm.jsx          # UI pengisian (Validasi Kumulatif)
│   │   ├── Layout.jsx             # Shell Dinamis (Desktop Sidebar / Mobile Bottom Nav)
│   │   ├── Login.jsx              # Tampilan Login Form
│   │   └── WhatsAppGenerator.jsx  # Generator Payload Whatsapp
│   ├── /services
│   │   └── api.js                 # Integrasi Network Fetch Data (Otomatis Mock/GAS)
│   ├── /utils
│   │   └── dateUtils.js           # Mesin pengolah target & kalkulator hari kerja
│   ├── App.jsx                    # State Authentication & Wiring Core
│   ├── index.css                  # Konfigurasi Tailwind & Overrides Khusus
│   └── main.jsx                   # React Entry Point DOM
├── tailwind.config.js       # Aturan konfigurasi tema
├── postcss.config.js        # Konfigurasi engine prosesor CSS
├── package.json             # Modul Node.js
└── README.md                # Dokumentasi utama proyek
```

---

## 🚀 Panduan Setup Lokal (Local Development)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/salkot25/dtsen.git
   cd dtsen_salkot
   ```

2. **Instalasi Modul / Node Modules:**
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka secara default di `http://localhost:5173/`.

---

## 🔗 Panduan Setup Backend (Google Sheets & Apps Script)

Untuk membuat sistem menyimpan data secara *Real-Time*, Anda wajib mengaktifkan script di Google Sheets Anda:

1. Buat **Spreadsheet Baru** (misal: "Dataset DTSEN Salkot").
2. Biarkan kosong, atau buat 2 *Sheet/Tab*:
   - Sheet Pertama ganti nama menjadi: **Laporan**
   - Sheet Kedua ganti nama menjadi: **Users**
3. Klik Menu **Ekstensi > Apps Script**.
4. Buka file `/google_apps_script/Code.gs` di repository ini, lalu _Copy-Paste_ isinya ke dalam file `Code.gs` milik Apps Script Anda.
5. Simpan dan **Terapkan (Deploy) > Aplikasi Web (Web App)**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL Web App yang panjang berawalan `https://script.google.com/...` tersebut.
7. Di dalam kode proyek ini, buka `/src/services/api.js` dan ganti `SCRIPT_URL` dengan link Anda tersebut.
   ```javascript
   const SCRIPT_URL = 'URL_ANDA_DI_SINI';
   ```

---

## 📋 Implementation Plan & Timeline Rekam Jejak

*Dokumentasi histori penyusunan dan struktur implementasi logis yang dirancang oleh Agen (*AI*):*

- **Tahap 1, Fondasi UI/UX**: Inisiasi lingkungan React Vite. Perancangan skema palet Tailwind Enterprise (Blue-600, Slate-900, Slate-50). Konfigurasi *Layout* dual mode (Sidebar/BottomNav).
- **Tahap 2, Mesin Modul**: Integrasi pustaka *Date-Fns* untuk menyortir perhitungan *Business Days* hingga jendela final target (*Agustus 2026*), pembuatan `InputForm` dan `WhatsAppGenerator` anti kesalahan manipulasi. Visualisasi dengan grafik Recharts bertransisi.
- **Tahap 3, Database Injection & Purity Refactor**: Pembersihan teguran linter strict (`useEffect` deps), pemasangan `api.js` lokal *Mocking* fallback bila link database kosong. Pembuatan router Google Apps Script.
- **Tahap 4, Otorisasi Tingkat Lanjut**: Implementasi pengecekan Kredensial Langsung ke Database Sheets, dan peluncuran Filter Waktu (7h, 30h, Semua) untuk area grafik dengan manipulasi tipe `type="monotone"`.

*(Proyek di *build* sukses dan tanpa Error - **Verifikasi Selesai** v1.0)*

---
*© 2026 DTSEN ULP Salatiga Kota. Dikelola oleh Kord/@salkot25.*
