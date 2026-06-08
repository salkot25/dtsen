# Aplikasi Monitoring DTSEN ULP Salatiga Kota

![Status](https://img.shields.io/badge/Status-Production_Ready-success)
![Platform](https://img.shields.io/badge/Platform-Progressive_Web_App-blue)
![Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_Vite_%7C_Tailwind_v3_%7C_GAS-informational)
![PWA](https://img.shields.io/badge/PWA-Supported-emerald)
![AI](https://img.shields.io/badge/AI_Assistant-Gemini_Flash-violet)

Aplikasi web tingkat *enterprise* modern (Responsive Desktop & Mobile) yang dirancang untuk memantau, mendata, menganalisis secara prediktif, dan melaporkan pencapaian target pendataan DTSEN secara otomatis di ULP Salatiga Kota (Target total: 206.533 pelanggan s/d 31 Agustus 2026).

---

## 🌟 Fitur Utama (Features)

1. **📊 Dashboard Overview & Analitik Tingkat Enterprise:**
   * 4 Kartu KPI Dinamis: Sisa Pekerjaan, Sisa Waktu, Target Harian, dan Target per Petugas dengan progress bar seragam.
   * **Visualisasi AreaChart:** Grafik interaktif dengan filter khusus (7 Hari, 30 Hari, Semua Riwayat) yang otomatis terpotong berdasarkan pilihan (*Client-side slicing*).

2. **📈 Halaman Ringkasan Kinerja (Strategic Performance Intelligence):**
   * **Circular Progress Ring SVG** interaktif sebagai visual utama pencapaian kumulatif.
   * **Simulator Skenario Otomatis**: Memprediksi total pencapaian akhir berdasarkan 3 skenario (Optimis, Realistis, dan Target Harian) lengkap dengan probabilitas keberhasilan.
   * **Velocity Tracker**: Perhitungan kecepatan pencapaian harian aktual vs target harian dengan indikator selisih (surplus/defisit).
   * **AI Strategic Analysis**: Panel rangkuman strategi berbasis AI menggunakan data tren dan rekap petugas.

3. **👥 Rekap Kinerja Petugas Gabungan (Tabel Terpadu & Ekspor PDF):**
   * Integrasi data **Paskabayar (Postpaid)** dan **Prabayar (Prepaid)** dalam satu tabel terintegrasi.
   * **Peringkat Global Stabil**: Peringkat dihitung secara dinamis berdasarkan total gabungan submitted, tetap stabil meskipun data difilter atau diurutkan berdasarkan nama.
   * **Pembeda Medali Beranimasi**: Peringkat 1, 2, dan 3 dihiasi lencana gradasi emas (`gold-shine`), perak (`silver-sway`), dan perunggu (`bronze-pulse`) yang bergerak interaktif.
   * **Ekspor PDF Enterprise-Grade**: Fitur unduhan laporan tabular lengkap berstandar formal korporat dengan tata letak landscape A4, ringkasan kinerja KPI, branding instansi, penomoran halaman otomatis, dan tanda tangan pengesahan oleh Manager ULP Salatiga Kota.
   * **Panel Kontrol Canggih**: Dukungan pencarian cepat, filter status kinerja, pengurutan multi-kriteria (Nama, Total, Paskabayar, Prabayar), serta sistem paginasi responsif di mobile.

4. **💬 Asisten AI Interaktif Terintegrasi (Native Mobile Experience):**
   * Diskusi strategi pencapaian target secara langsung dengan AI yang memahami data real-time Anda.
   * Dioptimalkan penuh untuk mobile: anti-double-scroll, area chat terbentang penuh (*edge-to-edge*), menu riwayat samping pintar, dan penggulingan otomatis cerdas saat keyboard virtual ponsel muncul.

5. **📥 Modul Input Data Harian & Validasi Berlapis (Grid 30:30:40):**
   * Pengisian data capaian kumulatif terbaru dengan verifikasi otomatis mencegah salah ketik dan penurunan angka.
   * **Upload Excel Pintar**: Mendukung pembacaan rekap (.xlsx) Paskabayar & Prabayar langsung di browser, auto-hitung gabungan, dan auto-isi formulir.
   * **Rasio Grid Kustom Desktop (30:30:40)**: Pembagian kolom optimal dengan porsi 30% Form Input, 30% Riwayat Log, dan 40% pratinjau **WhatsApp Report** (generator teks laporan formal wa.me/).

6. **🔌 Keandalan PWA (Progressive Web App) Penuh:**
   * **Instalasi Mudah**: Banner premium untuk menginstal aplikasi langsung ke layar utama perangkat Android, iOS, atau Windows.
   * **Offline First**: Menggunakan Service Worker untuk melakukan caching statis dan kebijakan `NetworkFirst` pada API agar aplikasi tetap bekerja dalam kondisi luring (tanpa internet).
   * **Notifikasi Update Instan**: Toast otomatis memberi tahu jika ada pembaruan versi aplikasi terbaru.
   * **Manajemen Notch & Notch Safe**: Mendukung area aman layar insets (`safe-area-inset`) pada iOS/Android modern.

7. **⚙️ Pengaturan Fleksibel & Model AI Dinamis:**
   * Kustomisasi periode kerja (tanggal mulai & berakhir), target total, jumlah petugas aktif, serta pengecualian hari libur kerja (Sabtu/Minggu).
   * **Dynamic AI Model Fetching**: Pendeteksian model secara langsung (real-time) melalui API Key Gemini pengguna. Anda dapat secara bebas memilih model seperti `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`, atau varian model lain yang didukung oleh API Key Anda.
   * Sinkronisasi data dua arah antara LocalStorage dan database Google Sheets dengan proteksi format Plain Text.

---

## 💻 Tech Stack & Arsitektur

### Frontend
* **React 19** + **Vite 8**: *Build tool* dan framework SPA super cepat.
* **Tailwind CSS v3**: Utilitas framework styling *(Enterprise Minimalism theme)*.
* **Lucide-React**: Ikonografi vektor minimalis yang presisi.
* **Recharts**: Rendering SVG tingkat tinggi untuk grafik analitik interaktif.
* **Date-Fns**: Memastikan perhitungan hari kerja (*Business Days*) akurat.
* **XLSX (SheetJS)**: Membaca dan mem-parsing berkas Excel di sisi klien.
* **Google Generative AI SDK**: Integrasi langsung dengan model Gemini AI.

### Backend (Serverless)
* **Google Apps Script (GAS)**: Berfungsi sebagai router API (mengelola *JSON Payload POST* dan *GET*).
* **Google Sheets**: Berperan sebagai database utama penyimpanan data riwayat, konfigurasi target, dan data petugas.

---

## 📂 Struktur Direktori (*Directory Structure*)

```
/dtsen_salkot
├── /google_apps_script      # File Backend
│   ├── Code.gs              # Script Server untuk Google Sheets (Router POST/GET)
│   └── README.md            # Panduan instalasi backend
├── /src
│   ├── /components
│   │   ├── AiChat.jsx             # Panel Diskusi Asisten AI Terintegrasi
│   │   ├── AiHistoryModal.jsx     # Riwayat Percakapan AI terdahulu
│   │   ├── DashboardOverview.jsx  # Grafik Recharts & Status KPI Ringkas
│   │   ├── ExecutiveSummary.jsx   # Dashboard Strategis (Progress Ring, Simulator, Velocity)
│   │   ├── HistoryTable.jsx       # Tabel Log Riwayat (Descending dengan Paginasi)
│   │   ├── InputForm.jsx          # UI Pengisian Valid & parser Excel Rekap Petugas
│   │   ├── Layout.jsx             # Shell Dinamis (Desktop Sidebar / Mobile Bottom Nav)
│   │   ├── Login.jsx              # Tampilan Login Form Aman
│   │   ├── OfficerRecap.jsx       # Tabel Kinerja Gabungan, Kontrol Filter, dan Medali Animasi
│   │   ├── PWAInstallBanner.jsx   # Toast Banner Undangan Instalasi PWA
│   │   ├── Settings.jsx           # Pengaturan Target, Hari Kerja, & API Key Gemini
│   │   └── WhatsAppGenerator.jsx  # Tinjauan Laporan Whatsapp Format Khusus
│   ├── /data
│   │   └── officers.json          # Data petugas default (fallback lokal)
│   ├── /services
│   │   ├── api.js                 # Integrasi Network Fetch Data (Otomatis Mock/GAS)
│   │   └── geminiService.js       # Mesin AI penganalisis data berbasis model Gemini
│   ├── /utils
│   │   └── dateUtils.js           # Mesin pengolah target & kalkulator hari kerja
│   ├── App.jsx                    # State Authentication & Wiring Core
│   ├── index.css                  # Konfigurasi Tailwind, Keyframes Medali, & Overrides
│   └── main.jsx                   # React Entry Point DOM
├── tailwind.config.js       # Aturan konfigurasi tema
├── postcss.config.js        # Konfigurasi engine prosesor CSS
├── package.json             # Modul Node.js & Script Build
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
2. Buat 6 *Sheet/Tab* dengan nama persis sebagai berikut:
   * **Laporan** (Untuk data log riwayat realisasi kumulatif harian)
   * **Users** (Untuk verifikasi akun admin)
   * **Settings** (Untuk sinkronisasi target, rentang waktu, dan model AI)
   * **Rekap_Petugas** (Untuk rekapitulasi data kinerja petugas Paskabayar dan Prabayar)
   * **Riwayat_AI** (Untuk riwayat log ringkasan analisis AI yang digenerasi)
   * **Riwayat_Chat** (Untuk riwayat log obrolan dengan asisten AI)
3. Klik Menu **Ekstensi > Apps Script**.
4. Buka file `/google_apps_script/Code.gs` di repository ini, lalu _Copy-Paste_ isinya ke dalam file `Code.gs` milik Apps Script Anda.
5. Simpan dan **Terapkan (Deploy) > Aplikasi Web (Web App)**.
   * Execute as: **Me**
   * Who has access: **Anyone**
6. Copy URL Web App yang panjang berawalan `https://script.google.com/...` tersebut.
7. Di dalam proyek lokal Anda, buka file `/src/services/api.js` dan tempel tautan Anda pada variabel `SCRIPT_URL`:
   ```javascript
   const SCRIPT_URL = 'URL_DEPLOYMENT_ANDA_DI_SINI';
   ```

---

## 📋 Timeline Rekam Jejak Perkembangan Aplikasi

*Dokumentasi histori penyusunan dan struktur implementasi logis yang dirancang oleh Agen (*AI*):*

* **Tahap 1, Fondasi UI/UX**: Inisiasi lingkungan React Vite. Perancangan skema palet Tailwind Enterprise (Blue-600, Slate-900, Slate-50). Konfigurasi *Layout* dual mode (Sidebar/BottomNav).
* **Tahap 2, Mesin Modul**: Integrasi pustaka *Date-Fns* untuk menyortir perhitungan *Business Days* hingga jendela final target (*Agustus 2026*), pembuatan `InputForm` dan `WhatsAppGenerator` anti kesalahan manipulasi. Visualisasi dengan grafik Recharts bertransisi.
* **Tahap 3, Database Injection & Purity Refactor**: Pembersihan teguran linter strict (`useEffect` deps), pemasangan `api.js` lokal *Mocking* fallback bila link database kosong. Pembuatan router Google Apps Script.
* **Tahap 4, Otorisasi Tingkat Lanjut**: Implementasi pengecekan Kredensial Langsung ke Database Sheets, dan peluncuran Filter Waktu (7h, 30h, Semua) untuk area grafik dengan manipulasi tipe `type="monotone"`.
* **Tahap 5, Integrasi PWA & AI Assistant**: Pembentukan arsitektur aplikasi PWA yang luring-siap, mengaktifkan asisten AI yang dinamis berbasis Gemini Flash, perombakan struktur navigasi sidebar, dan peluncuran **Strategic Performance Intelligence (ExecutiveSummary)** yang dilengkapi simulator skenario pencapaian target.
* **Tahap 6, Unified Rekap Petugas & Penyempurnaan Detail**: Penggabungan rekap Paskabayar dan Prabayar dengan sistem ranking total gabungan yang stabil, visualisasi medali beranimasi untuk Top 3, layout grid input kustom desktop 30:30:40, perbaikan layout chat mobile, serta pembersihan elemen avatar demi visual minimalis yang elegan.
* **Tahap 7, Kustomisasi Identitas, Sinkronisasi Data, Ekspor PDF Enterprise & Model AI Dinamis**: Integrasi logo resmi instansi di seluruh layout desktop & mobile, perbaikan bug format desimal/tanggal pada sinkronisasi pengaturan Google Sheets, pengisian opsi paginasi rekap petugas mobile, tata letak responsif ikon PDF bersanding dengan pencarian, peluncuran mesin cetak PDF berstandar korporat (landscape A4, ringkasan KPI, blok tanda tangan pengesahan manager), serta menu pemilihan model Gemini AI secara dinamis yang terhubung langsung ke Google AI Studio API.

*(Proyek di *build* sukses dan dideploy tanpa Error ke GitHub Pages - **Verifikasi Selesai** v1.4)*

---
*© 2026 DTSEN ULP Salatiga Kota. Dikelola oleh Kord/@salkot25.*
