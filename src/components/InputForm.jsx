import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

export default function InputForm({ onSubmit, lastCumulative, onUploadOfficers, officers = [] }) {
  // Card 1 state (Cumulative Achievement Form)
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card 2 state (Excel Upload with Confirmation)
  const [pendingPaska, setPendingPaska] = useState(null);
  const [pendingPra, setPendingPra] = useState(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [excelError, setExcelError] = useState('');
  const [excelSuccess, setExcelSuccess] = useState('');

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

  // Safe Excel parser locally
  const handleExcelUpload = (e, type) => {
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
        
        // Find sheet 'PETUGAS' case-insensitively or fallback to first sheet
        const sheetName = workbook.SheetNames.find(name => name.toUpperCase() === 'PETUGAS') 
          || workbook.SheetNames[0];
        
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

        let totalSubmittedUploaded = 0;
        let totalOpenUploaded = 0;
        
        const mappedOfficers = rawJson.map((row, idx) => {
          // Parse Open safely (NaN, null, or empty string are parsed as 0)
          const rawOpen = row['OPEN'] !== undefined ? row['OPEN'] : (row['open'] || 0);
          const openVal = isNaN(Number(rawOpen)) || rawOpen === null || rawOpen === 'NaN' || rawOpen === '' ? 0 : Number(rawOpen);

          // Parse Submitted safely (supports 'SUBMITTED' or 'SUBMIT')
          const rawSubmitted = row['SUBMITTED'] !== undefined 
            ? row['SUBMITTED'] 
            : (row['SUBMIT'] !== undefined ? row['SUBMIT'] : (row['submitted'] || row['submit'] || 0));
          const submittedVal = isNaN(Number(rawSubmitted)) ? 0 : Number(rawSubmitted);

          // Parse Rejected safely
          const rawRejected = row['REJECTED'] !== undefined ? row['REJECTED'] : (row['rejected'] || 0);
          const rejectedVal = isNaN(Number(rawRejected)) ? 0 : Number(rawRejected);

          // Parse or calculate Realisasi
          let realisasiVal = 0;
          const rawRealisasi = row['% REALISASI'] !== undefined ? row['% REALISASI'] : (row['realisasi'] || null);
          if (rawRealisasi !== null && !isNaN(Number(rawRealisasi))) {
            realisasiVal = Number(rawRealisasi);
          } else {
            // Calculate realisasi dynamically: submitted / (submitted + open + rejected)
            const total = submittedVal + openVal + rejectedVal;
            realisasiVal = total > 0 ? (submittedVal / total) : 0;
          }

          totalSubmittedUploaded += submittedVal;
          totalOpenUploaded += openVal;
          
          return {
            no: Number(row['NO'] || row['no'] || row['No'] || idx + 1),
            unitUpi: row['UNITUPI'] || row['unitUpi'] || '',
            unitAp: row['UNITAP'] || row['unitAp'] || '',
            unitUp: row['UNITUP'] || row['unitUp'] || '',
            nama: row['Nama Biller'] || row['nama'] || row['Nama'] || '',
            email: row['Email Biller'] || row['email'] || row['Email'] || '',
            open: openVal,
            submitted: submittedVal,
            rejected: rejectedVal,
            realisasi: realisasiVal
          };
        });

        // Set pending upload state locally (instead of immediate server upload)
        const pendingObj = {
          fileName: file.name,
          officers: mappedOfficers,
          netSubmitted: totalSubmittedUploaded,
          netOpen: totalOpenUploaded
        };

        if (type === 'paskabayar') {
          setPendingPaska(pendingObj);
        } else {
          setPendingPra(pendingObj);
        }

        setExcelSuccess(`Berkas ${type === 'paskabayar' ? 'Paskabayar' : 'Prabayar'} berhasil dimuat! Gunakan panel di bawah untuk melakukan konfirmasi unggah.`);
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

  // Dynamic Real-time Summation (Pending vs Existing State)
  const paskaNet = useMemo(() => {
    if (pendingPaska) {
      return pendingPaska.netSubmitted - pendingPaska.netOpen;
    }
    // Fallback to existing stored postpaid officers
    return (officers || [])
      .filter(o => o.type === 'paskabayar')
      .reduce((sum, o) => sum + (o.submitted || 0) - (o.open || 0), 0);
  }, [pendingPaska, officers]);

  const praNet = useMemo(() => {
    if (pendingPra) {
      return pendingPra.netSubmitted - pendingPra.netOpen;
    }
    // Fallback to existing stored prepaid officers
    return (officers || [])
      .filter(o => o.type === 'prabayar')
      .reduce((sum, o) => sum + (o.submitted || 0) - (o.open || 0), 0);
  }, [pendingPra, officers]);

  const computedCumulative = paskaNet + praNet;

  // Confirm and batch upload to Cloud Spreadsheet and state
  const handleConfirmUpload = async () => {
    if (!pendingPaska && !pendingPra) return;
    
    setIsUploading(true);
    setExcelError('');
    setExcelSuccess('');
    
    try {
      // 1. Upload postpaid if pending
      if (pendingPaska) {
        await onUploadOfficers(pendingPaska.officers, 'paskabayar');
      }
      
      // 2. Upload prepaid if pending
      if (pendingPra) {
        await onUploadOfficers(pendingPra.officers, 'prabayar');
      }
      
      // 3. Set the cumulative value automatically in Card 1 input field
      setInputValue(String(computedCumulative));
      
      let uploadLabel = '';
      if (pendingPaska && pendingPra) {
        uploadLabel = 'Paskabayar & Prabayar';
      } else if (pendingPaska) {
        uploadLabel = 'Paskabayar';
      } else {
        uploadLabel = 'Prabayar';
      }
      
      setExcelSuccess(`Sukses mengunggah rekap ${uploadLabel} ke cloud! Akumulasi capaian kumulatif (${formatNumber(computedCumulative)}) otomatis dimasukkan ke formulir.`);
      
      // Clear pending states
      setPendingPaska(null);
      setPendingPra(null);
      
      setTimeout(() => setExcelSuccess(''), 7000);
    } catch (err) {
      setExcelError(err.message || 'Gagal mengunggah rekap ke cloud. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Preview daily achievement calculation
  const previewDaily = inputValue && Number(inputValue) > lastCumulative 
    ? Number(inputValue) - lastCumulative 
    : null;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* CARD 1: Formulir Capaian Kumulatif */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
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
                <p className="text-[11px] font-semibold text-emerald-600">
                  Harian: +{formatNumber(previewDaily)}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? 'Memproses Data...' : 'Verifikasi & Simpan Data'}
          </button>
        </form>
      </div>

      {/* CARD 2: Upload Rekap Kinerja Petugas */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Upload Rekap Kinerja Petugas</h3>
          <p className="text-xs text-slate-400 mt-0.5">Unggah berkas rekap (.xlsx) dan konfirmasikan untuk menghitung capaian baru.</p>
        </div>

        <div className="space-y-4">
          {/* Side-by-Side Upload Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Upload Paskabayar */}
            <div className="flex flex-col">
              <label className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group ${
                isParsingExcel || isUploading ? 'border-slate-100 opacity-50 cursor-not-allowed' : 'border-blue-100 hover:border-blue-400 bg-blue-50/5 hover:bg-blue-50/20'
              }`}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => handleExcelUpload(e, 'paskabayar')}
                  className="hidden"
                  disabled={isParsingExcel || isUploading}
                />
                {isParsingExcel ? (
                  <Loader2 size={24} className="text-blue-500 animate-spin mb-1.5" />
                ) : (
                  <FileSpreadsheet size={24} className="text-blue-400 group-hover:text-blue-600 group-hover:scale-110 transition-all mb-1.5" />
                )}
                <span className="text-xs font-bold text-blue-900">Pilih Rekap Paskabayar</span>
                <span className="text-[10px] text-slate-400 mt-1">Format Excel (Sheet: 'PETUGAS')</span>
              </label>

              {/* Pending Paskabayar Status Indicator */}
              {pendingPaska && (
                <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl text-xs text-blue-800">
                  <span className="font-semibold truncate max-w-[120px]">{pendingPaska.fileName}</span>
                  <button 
                    type="button" 
                    onClick={() => setPendingPaska(null)} 
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 uppercase tracking-wider ml-2 shrink-0 cursor-pointer"
                  >
                    <Trash2 size={12} /> Batal
                  </button>
                </div>
              )}
            </div>

            {/* Upload Prabayar */}
            <div className="flex flex-col">
              <label className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group ${
                isParsingExcel || isUploading ? 'border-slate-100 opacity-50 cursor-not-allowed' : 'border-violet-100 hover:border-violet-400 bg-violet-50/5 hover:bg-violet-50/20'
              }`}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => handleExcelUpload(e, 'prabayar')}
                  className="hidden"
                  disabled={isParsingExcel || isUploading}
                />
                {isParsingExcel ? (
                  <Loader2 size={24} className="text-violet-500 animate-spin mb-1.5" />
                ) : (
                  <FileSpreadsheet size={24} className="text-violet-400 group-hover:text-violet-600 group-hover:scale-110 transition-all mb-1.5" />
                )}
                <span className="text-xs font-bold text-violet-900">Pilih Rekap Prabayar</span>
                <span className="text-[10px] text-slate-400 mt-1">Format Excel (Sheet: 'PETUGAS')</span>
              </label>

              {/* Pending Prabayar Status Indicator */}
              {pendingPra && (
                <div className="mt-2 flex items-center justify-between bg-violet-50 border border-violet-100 px-3 py-2 rounded-xl text-xs text-violet-850">
                  <span className="font-semibold truncate max-w-[120px]">{pendingPra.fileName}</span>
                  <button 
                    type="button" 
                    onClick={() => setPendingPra(null)} 
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 uppercase tracking-wider ml-2 shrink-0 cursor-pointer"
                  >
                    <Trash2 size={12} /> Batal
                  </button>
                </div>
              )}
            </div>
            
          </div>

          {/* Action Confirmation Panel (Visible when files are pending) */}
          {(pendingPaska || pendingPra) && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-2 space-y-3">
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Rencana Pengunggahan Rekap:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                  {pendingPaska ? (
                    <li>
                      <span className="font-bold text-blue-600">Paskabayar:</span> {pendingPaska.officers.length} petugas ({formatNumber(pendingPaska.netSubmitted)} submitted, {formatNumber(pendingPaska.netOpen)} open)
                    </li>
                  ) : (
                    <li className="list-none text-slate-400 italic">
                      Menggunakan data Paskabayar cloud yang sudah ada
                    </li>
                  )}
                  {pendingPra ? (
                    <li>
                      <span className="font-bold text-violet-600">Prabayar:</span> {pendingPra.officers.length} petugas ({formatNumber(pendingPra.netSubmitted)} submitted)
                    </li>
                  ) : (
                    <li className="list-none text-slate-400 italic">
                      Menggunakan data Prabayar cloud yang sudah ada
                    </li>
                  )}
                </ul>
                
                <div className="border-t border-slate-200/80 my-2.5 pt-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Preview Akumulasi Capaian Gabungan:</span>
                  <span className="text-sm font-extrabold text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded-lg border border-slate-300">
                    {formatNumber(computedCumulative)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md disabled:opacity-70 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                {isUploading ? 'Menyimpan & Mengunggah...' : 'Konfirmasi & Unggah Rekap ke Cloud'}
              </button>
            </div>
          )}

          {/* Excel Parser Status Messages */}
          {excelError && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="font-medium">{excelError}</p>
            </div>
          )}

          {excelSuccess && (
            <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
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
