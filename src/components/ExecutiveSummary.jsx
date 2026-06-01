import React, { useState, useMemo } from 'react';
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar,
  Activity, BarChart2, FileText, Users, Sparkles, Loader2, Clock, X,
  Award, Medal, Zap, ArrowRight, Gauge, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { generateExecutiveSummary } from '../services/geminiService';
import { saveAiSummaryToSpreadsheet } from '../services/api';
import AiHistoryModal from './AiHistoryModal';
import {
  formatNumber, getRemainingWorkingDays, calculateDailyTarget,
  getWorkingDaysInMonth, getTotalWorkingDays
} from '../utils/dateUtils';

// ─── SVG Circular Progress Ring ───────────────────────────────────────────────
function ProgressRing({ percentage, size = 180, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const pct = parseFloat(percentage);

  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const bgColor = pct >= 80 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={bgColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl md:text-4xl font-black text-slate-900 leading-none">{percentage}%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Tercapai</span>
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">
          {formatNumber(payload[0].value)} <span className="text-xs text-slate-400 font-normal">pelanggan</span>
        </p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ExecutiveSummary = ({ history, settings, officers = [] }) => {
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const percentage = Math.min(((currentTotal / settings.totalTarget) * 100), 100).toFixed(1);
  const remainingWork = settings.totalTarget - currentTotal;
  const remainingDays = getRemainingWorkingDays(settings);
  const dailyTarget = calculateDailyTarget(currentTotal, settings);
  const totalProjectDays = getTotalWorkingDays(settings);

  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('7d');

  // ─── 7-Day Analysis ───
  const recentHistory = history.slice(0, 7);
  const recentAchieved = recentHistory.map((item, idx, arr) => {
    if (item.dailyAchieved !== undefined) return item.dailyAchieved;
    if (idx < arr.length - 1) return item.value - arr[idx + 1].value;
    return 0;
  }).filter(val => val > 0);

  const avgRecent = recentAchieved.length > 0
    ? Math.round(recentAchieved.reduce((a, b) => a + b, 0) / recentAchieved.length)
    : 0;
  const maxRecent = recentAchieved.length > 0 ? Math.max(...recentAchieved) : 0;
  const minRecent = recentAchieved.length > 0 ? Math.min(...recentAchieved) : 0;

  const isOnTrack = avgRecent >= dailyTarget;
  const isSlightlyBehind = avgRecent > 0 && avgRecent < dailyTarget;

  // ─── Chart Data ───
  const sliceMap = { '7d': 8, '30d': 31, 'all': history.length };
  const pointsToSlice = sliceMap[timeFilter] || 8;

  const chartData = [...history]
    .slice(0, pointsToSlice)
    .reverse()
    .map((item, idx, arr) => {
      if (idx === 0) return null;
      const realisasi = item.dailyAchieved !== undefined ? item.dailyAchieved : (item.value - arr[idx - 1].value);
      const dateObj = new Date(item.date);
      return {
        name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
        realisasi: realisasi > 0 ? realisasi : 0,
      };
    })
    .filter(Boolean);

  // ─── Scenario Calculations ───
  const scenarioOptimistic = currentTotal + (maxRecent * remainingDays);
  const scenarioRealistic = currentTotal + (avgRecent * remainingDays);
  const scenarioTarget = currentTotal + (dailyTarget * remainingDays);

  const getScenarioStatus = (predicted) => {
    if (predicted >= settings.totalTarget) return { label: 'Tercapai', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', prob: 'Tinggi' };
    if (predicted >= settings.totalTarget * 0.9) return { label: 'Hampir', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', prob: 'Sedang' };
    return { label: 'Sulit', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', prob: 'Rendah' };
  };

  // ─── Officer Stats ───
  const officerStats = useMemo(() => {
    if (!officers || officers.length === 0) return null;
    const map = new Map();
    officers.forEach(o => {
      const nameKey = (o.nama || '').trim().toUpperCase();
      if (!nameKey) return;
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          nama: o.nama,
          paskaOpen: 0, paskaSubmitted: 0, paskaRejected: 0, paskaRealisasi: 0,
          praSubmitted: 0, praRejected: 0,
        });
      }
      const entry = map.get(nameKey);
      if (o.type === 'prabayar') {
        entry.praSubmitted = o.submitted || 0;
        entry.praRejected = o.rejected || 0;
      } else {
        entry.paskaOpen = o.open || 0;
        entry.paskaSubmitted = o.submitted || 0;
        entry.paskaRejected = o.rejected || 0;
        entry.paskaRealisasi = o.realisasi || 0;
      }
    });

    const list = Array.from(map.values()).map(o => ({
      ...o,
      totalSubmitted: o.paskaSubmitted + o.praSubmitted,
    })).sort((a, b) => b.totalSubmitted - a.totalSubmitted);

    let totalPaskaSubmitted = 0, totalPaskaOpen = 0, totalPraSubmitted = 0;
    let sumRealisasi = 0, countRealisasi = 0;
    list.forEach(o => {
      totalPaskaSubmitted += o.paskaSubmitted;
      totalPaskaOpen += o.paskaOpen;
      totalPraSubmitted += o.praSubmitted;
      if (o.paskaRealisasi > 0) { sumRealisasi += o.paskaRealisasi; countRealisasi++; }
    });

    const targetPaska = totalPaskaOpen + totalPaskaSubmitted;
    const paskaPct = targetPaska > 0 ? (totalPaskaSubmitted / targetPaska * 100).toFixed(1) : '0.0';
    const targetPra = (settings.totalTarget || 0) - targetPaska;
    const praPct = targetPra > 0 ? (totalPraSubmitted / targetPra * 100).toFixed(1) : '0.0';
    const avgRealisasi = countRealisasi > 0 ? (sumRealisasi / countRealisasi * 100).toFixed(1) : '0.0';

    const top3 = list.slice(0, 3);
    const bottom3 = list.filter(o => o.totalSubmitted > 0).slice(-3).reverse();

    return { total: list.length, totalPaskaSubmitted, totalPaskaOpen, totalPraSubmitted, paskaPct, praPct, avgRealisasi, top3, bottom3, list };
  }, [officers, settings.totalTarget]);

  // ─── AI Handler ───
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiError('');
    setShowAiModal(true);
    try {
      const officerData = officerStats ? {
        totalOfficers: officerStats.total,
        totalPaskaSubmitted: formatNumber(officerStats.totalPaskaSubmitted),
        paskaPct: officerStats.paskaPct,
        totalPraSubmitted: formatNumber(officerStats.totalPraSubmitted),
        praPct: officerStats.praPct,
        avgRealisasi: officerStats.avgRealisasi,
        top3: officerStats.top3.map((o, i) => `${i + 1}. ${o.nama} (Paska: ${o.paskaSubmitted}, Pra: ${o.praSubmitted}, Total: ${o.totalSubmitted})`).join('\n'),
        bottom3: officerStats.bottom3.map((o, i) => `${i + 1}. ${o.nama} (Paska: ${o.paskaSubmitted}, Pra: ${o.praSubmitted}, Total: ${o.totalSubmitted})`).join('\n'),
      } : null;

      const data = {
        currentTotal: formatNumber(currentTotal), percentage,
        totalTarget: formatNumber(settings.totalTarget),
        remainingWork: formatNumber(remainingWork > 0 ? remainingWork : 0),
        officerCount: settings.officerCount || 1,
        remainingDays, dailyTarget: formatNumber(dailyTarget),
        targetPerOfficer: formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1))),
        avgRecent: formatNumber(avgRecent), maxRecent: formatNumber(maxRecent),
        statusLabel: isOnTrack ? 'On Track (Sangat Baik)' : isSlightlyBehind ? 'Perlu Peningkatan' : 'Perhatian Khusus',
        officerData,
      };

      const summary = await generateExecutiveSummary(settings.geminiApiKey, data);
      setAiSummary(summary);
      saveAiSummaryToSpreadsheet(summary).catch(err => console.error('Gagal menyimpan riwayat AI:', err));
    } catch (err) {
      setAiError(err.message || 'Terjadi kesalahan saat menghubungi AI Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const gap = dailyTarget - avgRecent;
  const velocityPct = dailyTarget > 0 ? Math.min((avgRecent / dailyTarget) * 100, 150) : 0;

  const timeFilterOptions = [
    { id: '7d', label: '7 Hari' },
    { id: '30d', label: '30 Hari' },
    { id: 'all', label: 'Semua' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: Hero Progress Ring + Status Banner
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Progress Ring */}
          <div className="shrink-0">
            <ProgressRing percentage={percentage} size={160} strokeWidth={12} />
          </div>

          {/* Stats */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pencapaian Kumulatif</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {formatNumber(currentTotal)}
                <span className="text-base font-medium text-slate-400 ml-2">/ {formatNumber(settings.totalTarget)}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Pekerjaan</p>
                <p className="text-lg font-black text-slate-800">{formatNumber(remainingWork > 0 ? remainingWork : 0)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Waktu</p>
                <p className="text-lg font-black text-slate-800">{remainingDays} <span className="text-xs font-normal text-slate-400">hari kerja</span></p>
              </div>
            </div>

            {/* Status Banner */}
            {isOnTrack ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Status: On Track</p>
                  <p className="text-xs text-emerald-600">Rata-rata kinerja ({formatNumber(avgRecent)}/hari) melampaui target ({formatNumber(dailyTarget)}/hari).</p>
                </div>
              </div>
            ) : isSlightlyBehind ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Status: Perlu Peningkatan</p>
                  <p className="text-xs text-amber-600">Dibutuhkan tambahan +{formatNumber(gap)}/hari agar sesuai target ({formatNumber(dailyTarget)}/hari).</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-800">Status: Perhatian Khusus</p>
                  <p className="text-xs text-rose-600">Belum ada data kinerja aktual. Segera lakukan evaluasi operasional.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: KPI Cards Row
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Target Harian */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Harian</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{formatNumber(dailyTarget)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>per Petugas:</span>
              <span className="font-bold text-amber-600">{formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1)))}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Rata-rata Aktual */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className={`p-2.5 md:p-3 rounded-xl shrink-0 ${isOnTrack ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Activity size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rata-rata Aktual</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{formatNumber(avgRecent)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Gap:</span>
              <span className={`font-bold ${isOnTrack ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isOnTrack ? '+' : ''}{formatNumber(-gap)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className={`h-1 rounded-full transition-all duration-500 ${isOnTrack ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(velocityPct, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Capaian Tertinggi */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Award size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tertinggi (7H)</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{formatNumber(maxRecent)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Terendah:</span>
              <span className="font-bold text-blue-600">{formatNumber(minRecent)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${dailyTarget > 0 ? Math.min((maxRecent / dailyTarget) * 100, 100) : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Sisa Waktu */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0">
            <Calendar size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{remainingDays} <span className="text-xs font-normal text-slate-400">hari</span></h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Total Hari Kerja:</span>
              <span className="font-bold text-violet-600">{totalProjectDays}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-violet-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((remainingDays / (totalProjectDays || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: Grafik Tren Kinerja Harian
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600" /> Tren Kinerja Harian
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Capaian aktual vs target harian yang diperlukan</p>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-lg gap-0.5">
            {timeFilterOptions.map((opt) => (
              <button key={opt.id} onClick={() => setTimeFilter(opt.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  timeFilter === opt.id
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 md:h-72 w-full" style={{ minHeight: 256 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKinerja" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} dy={10} minTickGap={20} />
                <YAxis domain={[0, dataMax => Math.max(dataMax, dailyTarget * 1.15)]}
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={dailyTarget} stroke="#f43f5e" strokeDasharray="6 4" strokeWidth={1.5}
                  label={{
                    position: 'insideTopRight',
                    value: `Target: ${formatNumber(dailyTarget)}`,
                    fill: '#f43f5e', fontSize: 11, fontFamily: 'Inter', fontWeight: 600
                  }} />
                <Area type="monotone" dataKey="realisasi" stroke="#3b82f6" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#colorKinerja)"
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BarChart2 size={40} className="mb-3 text-slate-300" />
            <p className="text-sm">Belum cukup data untuk menampilkan grafik tren.</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: Simulator Skenario Pencapaian Target
         ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Gauge size={18} className="text-indigo-600" /> Simulator Skenario Pencapaian
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Optimis */}
          {(() => {
            const s = getScenarioStatus(scenarioOptimistic);
            return (
              <div className={`bg-white rounded-2xl p-5 border shadow-sm ${s.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp size={16} /></div>
                    <h4 className="text-sm font-bold text-slate-800">Skenario Optimis</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.color}`}>{s.prob}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Jika kinerja tertinggi ({formatNumber(maxRecent)}/hari) dipertahankan</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prediksi Total Akhir</span>
                    <span className="font-black text-slate-900">{formatNumber(scenarioOptimistic)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Selisih vs Target</span>
                    <span className={`font-bold ${scenarioOptimistic >= settings.totalTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scenarioOptimistic >= settings.totalTarget ? '+' : ''}{formatNumber(scenarioOptimistic - settings.totalTarget)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Realistis */}
          {(() => {
            const s = getScenarioStatus(scenarioRealistic);
            return (
              <div className={`bg-white rounded-2xl p-5 border shadow-sm ${s.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Activity size={16} /></div>
                    <h4 className="text-sm font-bold text-slate-800">Skenario Realistis</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.color}`}>{s.prob}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Jika rata-rata aktual ({formatNumber(avgRecent)}/hari) dipertahankan</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prediksi Total Akhir</span>
                    <span className="font-black text-slate-900">{formatNumber(scenarioRealistic)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Selisih vs Target</span>
                    <span className={`font-bold ${scenarioRealistic >= settings.totalTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scenarioRealistic >= settings.totalTarget ? '+' : ''}{formatNumber(scenarioRealistic - settings.totalTarget)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Target */}
          {(() => {
            const s = getScenarioStatus(scenarioTarget);
            return (
              <div className={`bg-white rounded-2xl p-5 border shadow-sm ${s.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Target size={16} /></div>
                    <h4 className="text-sm font-bold text-slate-800">Skenario Target</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.color}`}>{s.prob}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Jika target harian ({formatNumber(dailyTarget)}/hari) tercapai setiap hari</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prediksi Total Akhir</span>
                    <span className="font-black text-slate-900">{formatNumber(scenarioTarget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Selisih vs Target</span>
                    <span className={`font-bold ${scenarioTarget >= settings.totalTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scenarioTarget >= settings.totalTarget ? '+' : ''}{formatNumber(scenarioTarget - settings.totalTarget)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5: Velocity Tracker
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-indigo-600" /> Kecepatan Kinerja (Velocity)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rata-rata vs Target */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Aktual vs Target Harian</span>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-[10px] text-slate-400">Aktual</p>
                <p className="text-2xl font-black text-slate-900">{formatNumber(avgRecent)}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 mb-2" />
              <div>
                <p className="text-[10px] text-slate-400">Target</p>
                <p className="text-2xl font-black text-slate-900">{formatNumber(dailyTarget)}</p>
              </div>
              <div className="ml-auto">
                <p className="text-[10px] text-slate-400">Gap</p>
                <p className={`text-2xl font-black ${isOnTrack ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isOnTrack ? '+' : ''}{formatNumber(-gap)}
                </p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-700 ${isOnTrack ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(velocityPct, 100)}%` }} />
              {/* Target marker */}
              <div className="absolute top-0 h-3 w-0.5 bg-slate-800" style={{ left: `${Math.min(100, 100)}%`, transform: 'translateX(-100%)' }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-right">{velocityPct.toFixed(0)}% dari target harian</p>
          </div>

          {/* Breakdown Target Per Petugas */}
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Breakdown per Petugas</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-indigo-200">Target Harian</p>
                <p className="text-xl font-black">{formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1)))}</p>
                <p className="text-[10px] text-indigo-200">per petugas</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-indigo-200">Target Bulanan</p>
                <p className="text-xl font-black">{formatNumber(Math.ceil((dailyTarget * getWorkingDaysInMonth(settings)) / (settings.officerCount || 1)))}</p>
                <p className="text-[10px] text-indigo-200">per petugas</p>
              </div>
            </div>
            <p className="text-[10px] text-indigo-200 mt-3 flex items-center gap-1">
              <Users size={12} /> {settings.officerCount || 1} petugas aktif · {getWorkingDaysInMonth(settings)} hari kerja/bulan
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6: Rekap Petugas Ringkas
         ══════════════════════════════════════════════════════════════════════ */}
      {officerStats && officerStats.total > 0 && (
        <>
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={18} className="text-blue-600" /> Rekap Kinerja Petugas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl shrink-0"><Users size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Petugas</p>
                  <h4 className="text-xl font-black text-slate-800">{officerStats.total}</h4>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><CheckCircle2 size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paskabayar</p>
                  <h4 className="text-xl font-black text-slate-800">{formatNumber(officerStats.totalPaskaSubmitted)}</h4>
                  <p className="text-[10px] font-bold text-blue-600">{officerStats.paskaPct}% realisasi</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl shrink-0"><Zap size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prabayar</p>
                  <h4 className="text-xl font-black text-slate-800">{formatNumber(officerStats.totalPraSubmitted)}</h4>
                  <p className="text-[10px] font-bold text-violet-600">{officerStats.praPct}% realisasi</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Activity size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Realisasi</p>
                  <h4 className="text-xl font-black text-slate-800">{officerStats.avgRealisasi}%</h4>
                  <p className="text-[10px] font-bold text-emerald-600">rata-rata petugas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top & Bottom Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 3 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Top 3 Performers
              </h4>
              <div className="space-y-3">
                {officerStats.top3.map((o, idx) => (
                  <div key={o.nama} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                      ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{o.nama}</p>
                      <p className="text-[10px] text-slate-400">Paska: {formatNumber(o.paskaSubmitted)} · Pra: {formatNumber(o.praSubmitted)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-900">{formatNumber(o.totalSubmitted)}</p>
                      <p className="text-[10px] text-slate-400">total</p>
                    </div>
                  </div>
                ))}
                {officerStats.top3.length === 0 && <p className="text-sm text-slate-400 text-center py-2">Belum ada data</p>}
              </div>
            </div>

            {/* Bottom 3 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> Perlu Perhatian
              </h4>
              <div className="space-y-3">
                {officerStats.bottom3.map((o) => (
                  <div key={o.nama} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <TrendingDown size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{o.nama}</p>
                      <p className="text-[10px] text-slate-400">Paska: {formatNumber(o.paskaSubmitted)} · Pra: {formatNumber(o.praSubmitted)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-rose-700">{formatNumber(o.totalSubmitted)}</p>
                      <p className="text-[10px] text-slate-400">total</p>
                    </div>
                  </div>
                ))}
                {officerStats.bottom3.length === 0 && <p className="text-sm text-slate-400 text-center py-2">Belum ada data</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7: AI Executive Summary
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 shadow-sm border border-indigo-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
            <Sparkles className="text-purple-500 dark:text-purple-400" /> AI Executive Summary
          </h3>
          <p className="text-xs md:text-sm text-indigo-850 dark:text-slate-400 mt-1">Ringkasan cerdas & rekomendasi taktis dari Google Gemini AI — termasuk analisis rekap petugas</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-750 rounded-xl font-medium transition-all shadow-sm text-sm cursor-pointer">
            <Clock size={16} /> Riwayat
          </button>
          <button onClick={handleGenerateAI}
            className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md text-sm cursor-pointer">
            <Sparkles size={16} /> Buat Ringkasan
          </button>
        </div>
      </div>

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/50 to-purple-50 dark:to-purple-950/50">
              <h2 className="text-lg md:text-xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Sparkles className="text-purple-500" /> Hasil Analisis AI
              </h2>
              {!isGenerating && (
                <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 cursor-pointer">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-5 md:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                  <Loader2 size={40} className="animate-spin mb-4" />
                  <p className="font-medium animate-pulse">AI sedang menganalisis data Anda...</p>
                  <p className="text-sm text-slate-400 mt-2">Biasanya membutuhkan waktu beberapa detik.</p>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-start gap-3">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Gagal Menganalisis</h4>
                    <p className="text-sm">{aiError}</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-indigo max-w-none text-slate-700 text-sm md:text-base">
                  <ReactMarkdown
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-900 mt-6 mb-3 flex items-center gap-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                    }}
                  >
                    {aiSummary}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <AiHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />
    </div>
  );
};

export default ExecutiveSummary;
