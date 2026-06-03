import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateExecutiveSummary(apiKey, data) {
  if (!apiKey) {
    throw new Error("API Key Gemini belum diatur di Pengaturan.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Mencari model yang tersedia dan didukung secara dinamis
  let selectedModelName = "gemini-1.5-flash"; // fallback default
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const supportedModels = models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
      
      const flashModel = supportedModels.find(m => m.name.includes('flash') && !m.name.includes('vision'));
      const proModel = supportedModels.find(m => m.name.includes('pro') && !m.name.includes('vision'));
      
      if (flashModel) {
        selectedModelName = flashModel.name.replace('models/', '');
      } else if (proModel) {
        selectedModelName = proModel.name.replace('models/', '');
      } else if (supportedModels.length > 0) {
        selectedModelName = supportedModels[0].name.replace('models/', '');
      }
    }
  } catch (e) {
    console.warn("Gagal mengambil daftar model, menggunakan fallback default", e);
  }

  const model = genAI.getGenerativeModel({ model: selectedModelName });
  const hitungLabel = data.considerCategories ? "realisasi bersih" : "total submit";
  const officerSection = data.officerData ? `

--- DATA REKAP KINERJA PETUGAS ---
- Jumlah Petugas Terdata: ${data.officerData.totalOfficers} orang
- Total Submitted Paskabayar: ${data.officerData.totalPaskaSubmitted} pelanggan (Realisasi: ${data.officerData.paskaPct}%)
- Total Submitted Prabayar: ${data.officerData.totalPraSubmitted} pelanggan (Realisasi: ${data.officerData.praPct}%)
- Rata-rata Realisasi Paskabayar per Petugas: ${data.officerData.avgRealisasi}%

🏆 Top 3 Performers (berdasarkan ${hitungLabel}):
${data.officerData.top3 || '(Belum ada data)'}

⚠️ Petugas yang Membutuhkan Perhatian (${hitungLabel} terendah):
${data.officerData.bottom3 || '(Belum ada data)'}
` : '';

  const prompt = `
Anda adalah seorang analis data ahli dan manajer operasional untuk program "DTSEN ULP Salatiga Kota".
Tugas Anda adalah membuat Ringkasan Eksekutif (Executive Summary) yang tajam, profesional, komprehensif, dan memberikan rekomendasi yang dapat ditindaklanjuti (actionable) berdasarkan data kinerja keseluruhan tim maupun kinerja individual petugas.

Gunakan bahasa Indonesia yang baku dan profesional, serta format markdown yang rapi (bold, bullet points, dan heading kecil).

=== DATA KINERJA KUMULATIF ===
- Pencapaian Total: ${data.currentTotal} pelanggan (${data.percentage}% dari Target)
- Target Keseluruhan: ${data.totalTarget} pelanggan
- Sisa Pekerjaan: ${data.remainingWork} pelanggan
- Jumlah Petugas Aktif (Setting): ${data.officerCount} orang
- Sisa Waktu Kerja: ${data.remainingDays} hari kerja
- Target Harian Total (agar selesai tepat waktu): ${data.dailyTarget} pelanggan/hari
- Target Harian per Petugas: ${data.targetPerOfficer} pelanggan/hari
- Kinerja Rata-Rata Aktual (7 hari terakhir): ${data.avgRecent} pelanggan/hari
- Kinerja Tertinggi (7 hari terakhir): ${data.maxRecent} pelanggan/hari
- Status Sistem: ${data.statusLabel}
${officerSection}

Buatkan laporan dengan struktur berikut:

### 📊 Intisari Kinerja
Paragraf singkat yang merangkum posisi keseluruhan tim saat ini, termasuk progres kumulatif dan kontribusi dari data rekap petugas jika tersedia.

### 🔍 Analisis Progres & Dekomposisi
Bandingkan kinerja rata-rata aktual vs target harian. Jika data rekap tersedia, analisis kontribusi paskabayar dan prabayar secara terpisah, serta seberapa besar gap masing-masing terhadap target.

### 👥 Analisis Kinerja Individual Petugas
(Isi bagian ini HANYA jika data rekap petugas tersedia)
Berikan analisis singkat tentang pola kinerja: siapa yang menonjol, siapa yang perlu bimbingan, dan apakah ada disparitas performa yang signifikan antar petugas. Jangan hanya mengulangi nama – berikan interpretasi manajerial.

### 📈 Prognosa Pencapaian Target
Berdasarkan kecepatan rata-rata saat ini (${data.avgRecent} pelanggan/hari) dan sisa ${data.remainingDays} hari kerja, hitung prediksi perolehan akhir periode dan nyatakan probabilitas target tercapai (Rendah/Sedang/Tinggi). Sertakan angka ekstra yang dibutuhkan per hari agar target kembali on track.

### 💡 Rekomendasi Taktis
Berikan 3–4 rekomendasi spesifik dan dapat ditindaklanjuti, mencakup:
- Strategi tim secara keseluruhan
- Penanganan petugas berkinerja rendah (jika data tersedia)
- Optimasi segmen (paskabayar vs prabayar) jika relevan

Tulis langsung isi laporan tanpa salam pembuka atau penutup.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Gagal mengambil respons AI: ${error.message || "Pastikan API Key valid."}`);
  }
}

export async function sendChatMessage(apiKey, history, message, contextData) {
  if (!apiKey) {
    throw new Error("API Key Gemini belum diatur di Pengaturan.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  let selectedModelName = "gemini-1.5-flash";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const flashModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash') && !m.name.includes('vision'));
      if (flashModel) selectedModelName = flashModel.name.replace('models/', '');
    }
  } catch (e) {
    console.warn("Fallback to default model", e);
  }

  const model = genAI.getGenerativeModel({ model: selectedModelName });
  
  // Format history for Gemini SDK
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // System instruction prepended to the first message if history is empty, 
  // or injected in startChat. But startChat systemInstruction is only for gemini-1.5-pro/flash.
  // We can pass it via systemInstruction:
  
  const systemInstruction = `Anda adalah asisten AI operasional untuk program "DTSEN ULP Salatiga Kota". 
Data terkini: Capaian ${contextData?.currentTotal || 0} dari Target ${contextData?.totalTarget || 0}. 
Berikan jawaban yang ringkas, profesional, dan gunakan Bahasa Indonesia baku.`;

  const chatModel = genAI.getGenerativeModel({ 
    model: selectedModelName,
    systemInstruction: { parts: [{ text: systemInstruction }] }
  });

  try {
    const chat = chatModel.startChat({
      history: formattedHistory,
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    throw new Error(`Gagal memproses obrolan: ${error.message}`);
  }
}
