import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';

// Helper function to safely format ISO dates to YYYY-MM-DD
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  // If it's already YYYY-MM-DD (length 10)
  if (typeof dateValue === 'string' && dateValue.length === 10) return dateValue;
  // If it's an ISO string or Date object
  try {
    const d = new Date(dateValue);
    // Adjust for timezone offset so we don't accidentally get the previous day
    return d.toISOString().split('T')[0];
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
    excludeWeekends: settings.excludeWeekends !== undefined ? settings.excludeWeekends : true,
    geminiApiKey: settings.geminiApiKey || ''
  });

  useEffect(() => {
    setFormData({
      startDate: formatDateForInput(settings.startDate) || '2026-01-01',
      targetDate: formatDateForInput(settings.targetDate) || '2026-08-31',
      startDayOfMonth: settings.startDayOfMonth !== undefined ? settings.startDayOfMonth : 2,
      endDayOfMonth: settings.endDayOfMonth !== undefined ? settings.endDayOfMonth : 20,
      totalTarget: settings.totalTarget,
      officerCount: settings.officerCount !== undefined ? settings.officerCount : 10,
      excludeWeekends: settings.excludeWeekends !== undefined ? settings.excludeWeekends : true,
      geminiApiKey: settings.geminiApiKey || ''
    });
  }, [settings]);

  const [savedMessage, setSavedMessage] = useState('');

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengaturan Sistem</h2>
            <p className="text-slate-500 text-sm">
              Konfigurasi tanggal pelaksanaan dan target pekerjaan DTSEN.
            </p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <SettingsIcon size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Tanggal Proyek Mulai
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Tanggal Proyek Berakhir
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Kerja Mulai (Setiap Bulan)
              </label>
              <input
                type="number"
                name="startDayOfMonth"
                value={formData.startDayOfMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Kerja Selesai (Setiap Bulan)
              </label>
              <input
                type="number"
                name="endDayOfMonth"
                value={formData.endDayOfMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Total Target Pelanggan
              </label>
              <input
                type="number"
                name="totalTarget"
                value={formData.totalTarget}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Jumlah Petugas
              </label>
              <input
                type="number"
                name="officerCount"
                value={formData.officerCount}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
                min="1"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  name="excludeWeekends"
                  checked={formData.excludeWeekends}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Tidak termasuk Sabtu & Minggu</span>
                  <span className="block text-xs text-slate-500">Sisa hari hanya akan menghitung hari kerja efektif (Senin-Jumat).</span>
                </div>
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Gemini API Key (Untuk Fitur AI Insights)
              </label>
              <input
                type="password"
                name="geminiApiKey"
                value={formData.geminiApiKey}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Dapatkan API Key secara gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Save size={18} />
              Simpan Pengaturan
            </button>
            {savedMessage && (
              <span className="text-emerald-600 font-medium text-sm animate-fade-in">
                {savedMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
