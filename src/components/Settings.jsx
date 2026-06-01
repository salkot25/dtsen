import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, CalendarDays, Target, Users, Key, Sparkles } from 'lucide-react';

const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string' && dateValue.length === 10) return dateValue;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateValue;
  }
};

export default function Settings({ settings, onSave }) {
  const [formData, setFormData] = useState({
    startDate: formatDateForInput(settings.startDate) || '2026-01-01',
    targetDate: formatDateForInput(settings.targetDate) || '2026-08-31',
    startDayOfMonth: settings.startDayOfMonth !== undefined ? settings.startDayOfMonth : 2,
    endDayOfMonth: settings.endDayOfMonth !== undefined ? settings.endDayOfMonth : 20,
    totalTarget: settings.totalTarget,
    officerCount: settings.officerCount !== undefined ? settings.officerCount : 10,
    excludeSaturday: settings.excludeSaturday !== undefined ? settings.excludeSaturday : (settings.excludeWeekends !== undefined ? settings.excludeWeekends : true),
    excludeSunday: settings.excludeSunday !== undefined ? settings.excludeSunday : (settings.excludeWeekends !== undefined ? settings.excludeWeekends : true),
    geminiApiKey: settings.geminiApiKey || ''
  });

  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setFormData({
      startDate: formatDateForInput(settings.startDate) || '2026-01-01',
      targetDate: formatDateForInput(settings.targetDate) || '2026-08-31',
      startDayOfMonth: settings.startDayOfMonth !== undefined ? settings.startDayOfMonth : 2,
      endDayOfMonth: settings.endDayOfMonth !== undefined ? settings.endDayOfMonth : 20,
      totalTarget: settings.totalTarget,
      officerCount: settings.officerCount !== undefined ? settings.officerCount : 10,
      excludeSaturday: settings.excludeSaturday !== undefined ? settings.excludeSaturday : (settings.excludeWeekends !== undefined ? settings.excludeWeekends : true),
      excludeSunday: settings.excludeSunday !== undefined ? settings.excludeSunday : (settings.excludeWeekends !== undefined ? settings.excludeWeekends : true),
      geminiApiKey: settings.geminiApiKey || ''
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = value;
    if (type === 'checkbox') {
      parsedValue = checked;
    } else if (type === 'number') {
      parsedValue = parseInt(value) || 0;
    }
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setSavedMessage('Pengaturan berhasil disimpan!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Timeline & Dates */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <CalendarDays size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Waktu & Periode Kerja</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal Proyek Mulai</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal Proyek Berakhir</label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Kerja Mulai (Tanggal per Bulan)</label>
              <input
                type="number"
                name="startDayOfMonth"
                value={formData.startDayOfMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Kerja Selesai (Tanggal per Bulan)</label>
              <input
                type="number"
                name="endDayOfMonth"
                value={formData.endDayOfMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            
            <div className="md:col-span-2 pt-2">
              <div className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Pengecualian Hari Libur</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-sm">
                  <input
                    type="checkbox"
                    name="excludeSaturday"
                    checked={formData.excludeSaturday}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 dark:text-blue-500 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-base font-semibold text-slate-800 dark:text-slate-200">Libur Hari Sabtu</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Sisa hari kerja tidak akan menghitung hari Sabtu.</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-sm">
                  <input
                    type="checkbox"
                    name="excludeSunday"
                    checked={formData.excludeSunday}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 dark:text-blue-500 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-base font-semibold text-slate-800 dark:text-slate-200">Libur Hari Minggu</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Sisa hari kerja tidak akan menghitung hari Minggu.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Operasional */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Target Operasional</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target size={16} className="text-slate-400 dark:text-slate-500" />
                Total Target Pelanggan
              </label>
              <input
                type="number"
                name="totalTarget"
                value={formData.totalTarget}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-lg font-medium text-slate-900 dark:text-slate-100"
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users size={16} className="text-slate-400" dark:text-slate-500 />
                Jumlah Petugas Aktif
              </label>
              <input
                type="number"
                name="officerCount"
                value={formData.officerCount}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-lg font-medium text-slate-900 dark:text-slate-100"
                required
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Section 3: AI Integration */}
        <div className="bg-white dark:bg-slate-900 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-900 dark:to-slate-950 rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 p-6 border-b border-indigo-100/50 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-lg">
              <Key size={20} />
            </div>
            <h3 className="text-lg font-bold text-indigo-950 dark:text-indigo-200">Integrasi Kecerdasan Buatan (AI)</h3>
          </div>
          <div className="relative z-10 p-6">
            <div className="space-y-3 max-w-2xl">
              <label className="block text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="geminiApiKey"
                  value={formData.geminiApiKey}
                  onChange={handleChange}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-indigo-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm font-mono text-sm text-slate-900 dark:text-slate-100"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Sparkles size={18} className="text-indigo-400 dark:text-indigo-300" />
                </div>
              </div>
              <p className="text-sm text-indigo-850 dark:text-slate-400 leading-relaxed">
                Kunci API ini diperlukan untuk mengaktifkan fitur <strong>Ringkasan Kinerja AI</strong> dan <strong>Asisten AI Chat</strong>. Dapatkan API Key Anda secara gratis di{' '}
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Google AI Studio
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 pb-12">
          {savedMessage ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-900 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-700 animate-in slide-in-from-left-4 fade-in">
              <Sparkles size={18} />
              {savedMessage}
            </div>
          ) : <div />}
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white dark:from-blue-800 dark:to-indigo-900 hover:dark:from-blue-900 hover:dark:to-indigo-950 px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Save size={20} />
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
