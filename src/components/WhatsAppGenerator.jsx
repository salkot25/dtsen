import React, { useState } from 'react';
import { Copy, MessageCircle, Check } from 'lucide-react';
import { formatNumber, calculateDailyTarget, getRemainingWorkingDays } from '../utils/dateUtils';

export default function WhatsAppGenerator({ history, totalTarget }) {
  const [copied, setCopied] = useState(false);
  
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const previousTotal = history.length > 1 ? history[1].value : 0;
  
  const realisasiHariIni = currentTotal - previousTotal;
  const percentage = ((currentTotal / totalTarget) * 100).toFixed(2);
  const remainingDays = getRemainingWorkingDays();
  const dailyTarget = calculateDailyTarget(currentTotal);
  
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const messageText = `*UPDATE PROGRES PENDATAAN DTSEN ULP SALATIGA KOTA*
Hari/Tanggal: ${todayStr}

*A. Realisasi:*
1. Realisasi Hari Ini: +${formatNumber(realisasiHariIni)} pelanggan
2. Total Kumulatif: ${formatNumber(currentTotal)} pelanggan
3. Persentase Capaian: ${percentage}% dari total target (${formatNumber(totalTarget)})

*B. Evaluasi & Target:*
1. Sisa Target: ${formatNumber(totalTarget - currentTotal)} pelanggan
2. Sisa Hari Kerja: ${remainingDays} hari (s.d 31 Agt 2026)
3. Target Harian Berikutnya: ${formatNumber(dailyTarget)} pelanggan/hari

Tetap semangat dan jaga kesehatan! ⚡️🙏`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleWA = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-800 text-white md:col-span-2 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-bl-full z-0 opacity-10"></div>
      
      <div className="relative z-10 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-emerald-400" /> WhatsApp Report
          </h3>
          <p className="text-sm text-slate-400">Generator otomatis laporan evaluasi harian</p>
        </div>
      </div>
      
      <div className="flex-1 relative z-10 bg-slate-950/50 rounded-lg p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-y-auto mb-5 border border-slate-800 leading-relaxed shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
        {messageText}
      </div>
      
      <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm border border-slate-700"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          {copied ? 'Tersalin' : 'Salin Teks'}
        </button>
        <button
          onClick={handleWA}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm shadow-emerald-900/50 shadow-lg"
        >
          <MessageCircle size={18} />
          Kirim via WA
        </button>
      </div>
    </div>
  );
}
