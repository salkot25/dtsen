import React, { useState } from 'react';
import { Copy, MessageCircle, Check } from 'lucide-react';
import { formatNumber, calculateDailyTarget, getRemainingWorkingDays } from '../utils/dateUtils';

const JML_PETUGAS = 60;

export default function WhatsAppGenerator({ history, totalTarget, selectedItem }) {
  const [copied, setCopied] = useState(false);
  
  // Gunakan data yang dipilih user, atau data terbaru jika tidak ada yang dipilih
  const selectedIndex = selectedItem ? history.findIndex(h => h.id === selectedItem.id) : 0;
  const currentTotal = selectedItem ? selectedItem.value : (history.length > 0 ? history[0].value : 0);
  const previousTotal = history[selectedIndex + 1] ? history[selectedIndex + 1].value : 0;
  
  const realisasiHariIni = selectedItem?.dailyAchieved !== undefined 
    ? selectedItem.dailyAchieved 
    : (currentTotal - previousTotal);
  const dailyTarget = calculateDailyTarget(currentTotal);
  const remainingDays = getRemainingWorkingDays();
  
  // Persentase harian: realisasi hari ini vs target harian
  const pctHarian = dailyTarget > 0 ? ((realisasiHariIni / dailyTarget) * 100).toFixed(2) : '0';
  
  // Target kumulatif s/d hari ini (Total Target)
  const targetKumulatif = totalTarget;
  const pctKumulatif = targetKumulatif > 0 ? ((currentTotal / targetKumulatif) * 100).toFixed(2) : '0';

  // Format tanggal dari selected item atau hari ini
  const reportDate = selectedItem ? new Date(selectedItem.date) : new Date();
  const dd = String(reportDate.getDate()).padStart(2, '0');
  const mm = String(reportDate.getMonth() + 1).padStart(2, '0');
  const yyyy = reportDate.getFullYear();
  const dateFormatted = `${dd}/${mm}/${yyyy}`;

  const messageText = `*Laporan harian hasil Pendataan DTSEN ULP SALATIGA KOTA, tgl ${dateFormatted}, sbb :*

*HARIAN*
Jml Petugas : ${JML_PETUGAS}
Target : ${formatNumber(dailyTarget)}
Realisasi : ${formatNumber(realisasiHariIni)}
% : ${pctHarian}%

*KUMULATIF*
Target : ${formatNumber(targetKumulatif)}
Realisasi : ${formatNumber(currentTotal)}
% : ${pctKumulatif}%.

Demikian disampaikan, mohon dukungan agar laporan dapat disampaikan secara rutin dan tepat waktu sebagai bahan monitoring bersama.

Terima kasih atas kerjasamanya 🙏`;

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
          <p className="text-xs text-slate-400 mt-1">Format resmi laporan harian manajemen</p>
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
