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

  const prompt = `
Anda adalah seorang analis data ahli dan manajer operasional untuk program "DTSEN ULP Salatiga Kota".
Tugas Anda adalah membuat Ringkasan Eksekutif (Executive Summary) yang tajam, profesional, dan memberikan rekomendasi yang dapat ditindaklanjuti (actionable) berdasarkan data kinerja saat ini.

Gunakan bahasa Indonesia yang baku, profesional, serta format markdown yang rapi (gunakan bold, bullet points, dan heading kecil).

Berikut adalah data kinerja operasional terkini:
- Pencapaian Total: ${data.currentTotal} pelanggan (${data.percentage}% dari Target Keseluruhan)
- Target Keseluruhan: ${data.totalTarget} pelanggan
- Sisa Pekerjaan: ${data.remainingWork} pelanggan
- Jumlah Petugas Aktif: ${data.officerCount} orang
- Sisa Waktu Kerja (Sisa hari di bulan ini / periode aktif): ${data.remainingDays} hari kerja
- Target Harian Total (Agar selesai tepat waktu): ${data.dailyTarget} pelanggan/hari
- Target Harian per Petugas: ${data.targetPerOfficer} pelanggan/hari
- Kinerja Rata-Rata Aktual (7 hari terakhir): ${data.avgRecent} pelanggan/hari
- Kinerja Tertinggi (7 hari terakhir): ${data.maxRecent} pelanggan/hari
- Status Sistem Saat Ini: ${data.statusLabel}

Buatkan laporan dengan struktur berikut:
### 📊 Intisari Kinerja
Paragraf singkat yang merangkum posisi saat ini secara keseluruhan.

### 🔍 Analisis Progres
Berdasarkan perbandingan antara Kinerja Rata-Rata Aktual vs Target Harian Total, analisis apakah tim sedang tertinggal, on track, atau melampaui target. Sebutkan besaran defisit atau surplusnya.

### 📈 Prognosa Pencapaian Target
Berdasarkan kecepatan rata-rata saat ini (${data.avgRecent} pelanggan/hari) dan sisa waktu kerja (${data.remainingDays} hari), berikan hitungan kasar prediksi perolehan di akhir periode. Nyatakan secara objektif probabilitas target tercapai (Rendah/Sedang/Tinggi) jika tren ini dipertahankan, serta berapa tambahan pelanggan ekstra mutlak per hari yang diperlukan untuk membalikkan keadaan.

### 💡 Rekomendasi Taktis
Berikan 3 rekomendasi taktis untuk petugas lapangan atau manajemen. Jika tertinggal, berikan simulasi beban tambahan per petugas agar target kembali *on track*.

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
