import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';

export default function InputForm({ onSubmit, lastCumulative }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
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

    setIsSubmitting(true);
    try {
      await onSubmit(valueNum);
      setSuccessMsg('Data capaian berhasil disimpan ke dalam sistem.');
      setInputValue('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate preview of daily achievement
  const previewDaily = inputValue && Number(inputValue) > lastCumulative 
    ? Number(inputValue) - lastCumulative 
    : null;

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 enterprise-shadow">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900">Formulir Capaian Kumulatif</h3>
        <p className="text-xs text-slate-400 mt-0.5">Masukkan total realisasi capaian terbaru untuk hari ini.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            Total Capaian Kumulatif Terbaru
          </label>
          <div className="relative">
             <input
               type="text"
               inputMode="numeric"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
               className="block w-full px-4 py-3 text-lg font-bold text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-sm"
               placeholder={`Contoh: ${lastCumulative > 0 ? formatNumber(lastCumulative + 1500) : '120.500'}`}
               required
             />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400">
              Sebelumnya: <span className="font-medium text-slate-600">{lastCumulative > 0 ? formatNumber(lastCumulative) : '-'}</span>
            </p>
            {previewDaily && (
              <p className="text-[11px] font-semibold text-emerald-600 animate-fade-in">
                Harian: +{formatNumber(previewDaily)}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4 shadow-lg shadow-blue-600/25 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
          {isSubmitting ? 'Memproses Data...' : 'Verifikasi & Simpan Data'}
        </button>
      </form>

      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-toast">
           <CheckCircle2 size={20} />
           <p className="font-medium text-sm">{successMsg}</p>
        </div>
      )}
    </div>
  );
}
