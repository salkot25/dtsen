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
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-6 shadow-xl border border-slate-800/50 text-white relative overflow-hidden h-full flex flex-col animate-slide-in-right">
      {/* Decorative Accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 rounded-bl-full opacity-[0.07]"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-tr-full opacity-[0.05]"></div>
      
      <div className="relative z-10 mb-5 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <MessageCircle size={18} className="text-emerald-400" />
            </div>
            WhatsApp Report
          </h3>
          <p className="text-xs text-slate-400 mt-1">Generator otomatis laporan evaluasi harian</p>
        </div>
      </div>
      
      <div className="flex-1 relative z-10 bg-black/30 backdrop-blur-sm rounded-xl p-4 font-mono-code text-[13px] text-slate-300 whitespace-pre-wrap overflow-y-auto mb-5 border border-slate-700/50 leading-relaxed">
        {messageText}
      </div>
      
      <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl transition-all font-medium text-sm border border-slate-700/50 active:scale-[0.97]"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          {copied ? 'Tersalin!' : 'Salin Teks'}
        </button>
        <button
          onClick={handleWA}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-emerald-900/40 active:scale-[0.97]"
        >
          <MessageCircle size={18} />
          Kirim via WA
        </button>
      </div>
    </div>
  );
}
