import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';

export default function InputForm({ onSubmit, lastCumulative }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const valueNum = Number(inputValue);
    
    if (!inputValue) {
      setError('Input tidak boleh kosong.');
      return;
    }
    
    if (isNaN(valueNum)) {
      setError('Input harus berupa angka.');
      return;
    }

    if (valueNum <= lastCumulative && lastCumulative > 0) {
      setError(`Angka kumulatif harus lebih besar dari hari sebelumnya (${formatNumber(lastCumulative)}).`);
      return;
    }

    // Process submission
    try {
      onSubmit(valueNum);
      setSuccessMsg('Data berhasil disimpan ke cloud.');
      setInputValue('');
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow h-full pb-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Input Capaian Kumulatif</h3>
        <p className="text-sm text-slate-500">Masukkan total realisasi terbaru untuk hari ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Total Kumulatif Terbaru (Angka Real)
          </label>
          <div className="relative">
             <input
               type="text"
               inputMode="numeric"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
               className="block w-full px-4 py-3 text-lg font-semibold text-slate-900 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
               placeholder={`Contoh: ${lastCumulative > 0 ? lastCumulative + 1500 : 120500}`}
               required
             />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Realisasi Kumulatif Sebelumnya: {lastCumulative > 0 ? formatNumber(lastCumulative) : 'Belum ada data'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-6"
        >
          <Send size={18} />
          Proses Data & Simpan
        </button>
      </form>

      {/* Toast Notification for Success */}
      {successMsg && (
        <div className="fixed bottom-20 md:bottom-8 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50">
           <CheckCircle2 size={20} />
           <p className="font-medium">{successMsg}</p>
        </div>
      )}
    </div>
  );
}
