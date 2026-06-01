import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, Upload, FileSpreadsheet } from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

export default function InputForm({ onSubmit, lastCumulative, onUploadOfficers }) {
  // Card 1 state
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card 2 state
  const [excelError, setExcelError] = useState('');
  const [excelSuccess, setExcelSuccess] = useState('');
  const [isParsingExcel, setIsParsingExcel] = useState(false);

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

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setExcelError('');
    setExcelSuccess('');
    setIsParsingExcel(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find sheet 'PETUGAS' or fallback to first sheet
        const sheetName = workbook.SheetNames.includes('PETUGAS') 
          ? 'PETUGAS' 
          : workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawJson.length === 0) {
          throw new Error('Berkas Excel kosong atau tidak memiliki data.');
        }

        // Validate headers (must contain Nama Biller)
        const firstRow = rawJson[0];
        const hasName = 'Nama Biller' in firstRow || 'nama' in firstRow || 'Nama' in firstRow;
        
        if (!hasName) {
          throw new Error('Kolom "Nama Biller" tidak ditemukan dalam berkas Excel.');
        }

        // Map columns
        const mappedOfficers = rawJson.map((row, idx) => {
          const rawRealisasi = row['% REALISASI'] !== undefined ? row['% REALISASI'] : (row['realisasi'] || 0);
          return {
            no: Number(row['NO'] || row['no'] || idx + 1),
            unitUpi: row['UNITUPI'] || row['unitUpi'] || '',
            unitAp: row['UNITAP'] || row['unitAp'] || '',
            unitUp: row['UNITUP'] || row['unitUp'] || '',
            nama: row['Nama Biller'] || row['nama'] || row['Nama'] || '',
            email: row['Email Biller'] || row['email'] || row['Email'] || '',
            open: Number(row['OPEN'] || row['open'] || 0),
            submitted: Number(row['SUBMITTED'] || row['submitted'] || 0),
            rejected: Number(row['REJECTED'] || row['rejected'] || 0),
            realisasi: Number(rawRealisasi)
          };
        });

        // Trigger parent callback to save in State & GAS
        await onUploadOfficers(mappedOfficers);
        setExcelSuccess(`Berhasil mengunggah ${mappedOfficers.length} data rekap petugas ke cloud!`);
        setTimeout(() => setExcelSuccess(''), 5000);
      } catch (err) {
        setExcelError(err.message || 'Gagal membaca berkas Excel. Pastikan format kolom sesuai.');
      } finally {
        setIsParsingExcel(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      setExcelError('Terjadi kesalahan saat membaca berkas.');
      setIsParsingExcel(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Calculate preview of daily achievement
  const previewDaily = inputValue && Number(inputValue) > lastCumulative 
    ? Number(inputValue) - lastCumulative 
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 enterprise-shadow flex flex-col h-full overflow-hidden w-full">
      
      {/* SECTION 1: Formulir Capaian Kumulatif */}
      <div className="p-6 border-b border-slate-100 flex-1 flex flex-col justify-center">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Formulir Capaian Kumulatif</h3>
          <p className="text-xs text-slate-400 mt-0.5">Masukkan total realisasi capaian terbaru untuk hari ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Total Capaian Kumulatif Terbaru
            </label>
            <div className="relative">
               <input
                 type="text"
                 inputMode="numeric"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                 className="block w-full px-4 py-2.5 text-lg font-bold text-slate-900 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-sm"
                 placeholder={`Contoh: ${lastCumulative > 0 ? formatNumber(lastCumulative + 1500) : '120.500'}`}
                 required
               />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-400">
                Sebelumnya: <span className="font-semibold text-slate-600">{lastCumulative > 0 ? formatNumber(lastCumulative) : '-'}</span>
              </p>
              {previewDaily && (
                <p className="text-[11px] font-bold text-emerald-600 animate-fade-in">
                  Harian: +{formatNumber(previewDaily)}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-xs animate-fade-in">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4 shadow-lg shadow-blue-600/25 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            {isSubmitting ? 'Memproses Data...' : 'Verifikasi & Simpan Data'}
          </button>
        </form>
      </div>

      {/* SECTION 2: Upload Rekap Kinerja Petugas */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex-1 flex flex-col justify-center">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Upload Rekap Kinerja Petugas</h3>
          <p className="text-xs text-slate-400 mt-0.5">Unggah berkas Excel (.xlsx) untuk memperbarui database rekap per petugas.</p>
        </div>

        <div className="space-y-4">
          {/* Custom Dashed File Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group bg-white">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="hidden"
              disabled={isParsingExcel}
            />
            {isParsingExcel ? (
              <Loader2 size={28} className="text-blue-500 animate-spin mb-1.5" />
            ) : (
              <FileSpreadsheet size={28} className="text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-1.5" />
            )}
            <span className="text-xs font-bold text-slate-700">
              {isParsingExcel ? 'Membaca Excel...' : 'Pilih File Excel'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Format .xlsx atau .xls (Sheet: 'PETUGAS')
            </span>
          </label>

          {/* Excel Parser Status Messages */}
          {excelError && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-xs animate-fade-in">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="font-medium">{excelError}</p>
            </div>
          )}

          {excelSuccess && (
            <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs animate-fade-in">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" />
              <p className="font-semibold">{excelSuccess}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative Submit Success Notification */}
      {successMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-toast">
           <CheckCircle2 size={20} />
           <p className="font-medium text-sm">{successMsg}</p>
        </div>
      )}

    </div>
  );
}
