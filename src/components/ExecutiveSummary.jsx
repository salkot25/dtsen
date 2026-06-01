import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, Activity, BarChart2, FileText, Users, Sparkles, Loader2, Clock, X, Award, Medal, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateExecutiveSummary } from '../services/geminiService';
import { saveAiSummaryToSpreadsheet } from '../services/api';
import AiHistoryModal from './AiHistoryModal';
import { formatNumber, getRemainingWorkingDays, calculateDailyTarget, getWorkingDaysInMonth, getTotalWorkingDays } from '../utils/dateUtils';

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

  // Analysis for the last 7 entries (days)
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

  const isSlightlyBehind = avgRecent > 0 && avgRecent < dailyTarget;
  const isOnTrack = avgRecent >= dailyTarget;

  // ============================================================
  // OFFICER RECAP AGGREGATION (from OfficerRecap logic)
  // ============================================================
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

    // Aggregate totals
    let totalPaskaSubmitted = 0, totalPaskaOpen = 0, totalPraSubmitted = 0, totalPraRejected = 0;
    let sumRealisasi = 0, countRealisasi = 0;
    list.forEach(o => {
      totalPaskaSubmitted += o.paskaSubmitted;
      totalPaskaOpen += o.paskaOpen;
      totalPraSubmitted += o.praSubmitted;
      totalPraRejected += o.praRejected;
      if (o.paskaRealisasi > 0) { sumRealisasi += o.paskaRealisasi; countRealisasi++; }
    });

    const totalTarget = settings.totalTarget || 0;
    const targetPaska = totalPaskaOpen + totalPaskaSubmitted;
    const paskaPct = targetPaska > 0 ? (totalPaskaSubmitted / targetPaska * 100).toFixed(1) : '0.0';
    const targetPra = totalTarget - targetPaska;
    const praPct = targetPra > 0 ? (totalPraSubmitted / targetPra * 100).toFixed(1) : '0.0';
    const avgRealisasi = countRealisasi > 0 ? (sumRealisasi / countRealisasi * 100).toFixed(1) : '0.0';

    // Top 3 & bottom 3
    const top3 = list.slice(0, 3);
    const bottom3 = list.filter(o => o.totalSubmitted > 0).slice(-3).reverse();

    return {
      total: list.length,
      totalPaskaSubmitted,
      totalPaskaOpen,
      totalPraSubmitted,
      paskaPct,
      praPct,
      avgRealisasi,
      top3,
      bottom3,
      list,
    };
  }, [officers, settings.totalTarget]);

  // ============================================================
  // AI HANDLER with enriched officer data
  // ============================================================
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
        currentTotal: formatNumber(currentTotal),
        percentage,
        totalTarget: formatNumber(settings.totalTarget),
        remainingWork: formatNumber(remainingWork > 0 ? remainingWork : 0),
        officerCount: settings.officerCount || 1,
        remainingDays,
        dailyTarget: formatNumber(dailyTarget),
        targetPerOfficer: formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1))),
        avgRecent: formatNumber(avgRecent),
        maxRecent: formatNumber(maxRecent),
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

  const getRankIcon = (idx) => {
    if (idx === 0) return <Award size={14} className="text-amber-500" />;
    if (idx === 1) return <Medal size={14} className="text-slate-400" />;
    if (idx === 2) return <Medal size={14} className="text-amber-700" />;
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pencapaian Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pencapaian Total</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{formatNumber(currentTotal)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Target: {formatNumber(settings.totalTarget)}</span>
              <span className="font-bold text-blue-600">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        {/* Card 2: Sisa Pekerjaan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Target size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa Pekerjaan</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{formatNumber(remainingWork > 0 ? remainingWork : 0)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Progres Sisa:</span>
              <span className="font-bold text-rose-600">{(100 - percentage).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-rose-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.max(100 - percentage, 0)}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Waktu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl shrink-0">
            <Calendar size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{remainingDays} <span className="text-sm font-normal text-slate-400">hari</span></h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Total Hari Kerja:</span>
              <span className="font-bold text-slate-600">{totalProjectDays} Hari</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-slate-400 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min((remainingDays / (totalProjectDays || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Target Harian */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Harian</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{formatNumber(dailyTarget)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Target Per Petugas:</span>
              <span className="font-bold text-amber-600">{formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1)))}/hari</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full transition-all duration-500" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Target Breakdown Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between text-white gap-4">
        <div>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Users size={20} /> Breakdown Target per Petugas</h3>
          <p className="text-indigo-100 text-sm">Dengan {settings.officerCount || 1} petugas aktif di bulan ini</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white/10 rounded-xl p-4 min-w-[150px]">
            <div className="text-sm text-indigo-100 mb-1">Target Harian</div>
            <div className="text-2xl font-bold">{formatNumber(Math.ceil(dailyTarget / (settings.officerCount || 1)))}</div>
          </div>
          <div className="bg-white/20 rounded-xl p-4 min-w-[150px]">
            <div className="text-sm text-indigo-50 mb-1">Target Bulanan</div>
            <div className="text-2xl font-bold">{formatNumber(Math.ceil((dailyTarget * getWorkingDaysInMonth(settings)) / (settings.officerCount || 1)))}</div>
          </div>
        </div>
      </div>

      {/* ===== OFFICER RECAP SECTION ===== */}
      {officerStats && officerStats.total > 0 && (
        <>
          {/* Rekap Petugas KPI Row */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top 3 Performers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Top 3 Performers
              </h4>
              <div className="space-y-3">
                {officerStats.top3.map((o, idx) => (
                  <div key={o.nama} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0
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

            {/* Bottom 3 / Need Attention */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> Perlu Perhatian
              </h4>
              <div className="space-y-3">
                {officerStats.bottom3.map((o, idx) => (
                  <div key={o.nama} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
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

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Analisis Kinerja Terkini (7 Hari)
          </h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Rata-rata Capaian Harian</span>
              <span className="font-semibold text-slate-800">{formatNumber(avgRecent)} <span className="text-xs text-slate-400">/ hari</span></span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Capaian Tertinggi</span>
              <span className="font-semibold text-slate-800">{formatNumber(maxRecent)} <span className="text-xs text-slate-400">pelanggan</span></span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-l-4 border-indigo-500">
              <span className="text-sm text-slate-600 font-medium">Gap Target Harian vs Rata-rata Aktual</span>
              <span className={`font-bold ${avgRecent >= dailyTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                {avgRecent >= dailyTarget ? '+' : '-'}{formatNumber(Math.abs(dailyTarget - avgRecent))}
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-slate-500" />
            Kesimpulan Status
          </h3>
          {isOnTrack ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 mb-1">Status: On Track</h4>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Kinerja saat ini sangat baik. Rata-rata pencapaian harian ({formatNumber(avgRecent)}) melebihi atau sesuai dengan target harian yang dibutuhkan ({formatNumber(dailyTarget)}). Lanjutkan momentum ini untuk mencapai target tepat waktu.
                </p>
              </div>
            </div>
          ) : isSlightlyBehind ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-amber-800 mb-1">Status: Perlu Peningkatan</h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Rata-rata capaian harian ({formatNumber(avgRecent)}) masih di bawah target yang dibutuhkan ({formatNumber(dailyTarget)}). Dibutuhkan peningkatan laju pekerjaan sekitar {(dailyTarget - avgRecent).toFixed(0)} pelanggan per hari agar tidak tertinggal.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-rose-800 mb-1">Status: Perhatian Khusus</h4>
                <p className="text-sm text-rose-700 leading-relaxed">
                  Kinerja aktual jauh di bawah ekspektasi target. Segera lakukan evaluasi operasional dan kejar ketertinggalan untuk memenuhi target harian ({formatNumber(dailyTarget)}).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Sparkles className="text-purple-500" /> AI Executive Summary
          </h3>
          <p className="text-sm text-indigo-700/70">Ringkasan cerdas &amp; rekomendasi taktis dari Google Gemini AI — termasuk analisis rekap petugas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl font-medium transition-all shadow-sm"
          >
            <Clock size={18} /> Lihat Riwayat
          </button>
          <button
            onClick={handleGenerateAI}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md"
          >
            <Sparkles size={18} /> Buat Ringkasan AI
          </button>
        </div>
      </div>

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="text-purple-500" /> Hasil Analisis AI
              </h2>
              {!isGenerating && (
                <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-white/50 rounded-xl transition-colors text-slate-500">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
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
