import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Activity, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatNumber, getRemainingWorkingDays, calculateDailyTarget, getTotalWorkingDays, parseLocalDate } from '../utils/dateUtils';

function KPICard({ title, value, subtitle, icon, iconBg, iconColor, children, delay = '0' }) {
  return (
    <div className={`kpi-card bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 enterprise-shadow animate-fade-in-up delay-${delay}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{subtitle}</p>}
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(payload[0].value)} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">pelanggan</span></p>
      </div>
    );
  }
  return null;
};

export default function DashboardOverview({ history, settings, setCurrentTab, onRefresh }) {
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const lastRealization = history.length > 0 ? (history[0].dailyAchieved !== undefined ? history[0].dailyAchieved : 0) : 0;
  
  const dailyTarget = calculateDailyTarget(currentTotal, settings);
  const remainingDays = getRemainingWorkingDays(settings);
  
  // Hitung tren kinerja harian (rata-rata 7 data terakhir)
  const recentHistory = history.slice(0, 7);
  const avgRecent = recentHistory.length > 0
    ? Math.round(recentHistory.reduce((sum, h) => sum + (h.dailyAchieved !== undefined ? h.dailyAchieved : 0), 0) / recentHistory.length)
    : 0;

  const averageDaily = history.length > 1 
    ? Math.round(currentTotal / (history.length - 1))
    : lastRealization;

  const percentage = Math.min(((currentTotal / (settings.totalTarget || 1)) * 100), 100).toFixed(1);
  const totalProjectDays = getTotalWorkingDays(settings);
  const idealDaily = Math.ceil(settings.totalTarget / (totalProjectDays || 1));
  
  const previousRealization = history.length > 1 
    ? (history[1].dailyAchieved !== undefined ? history[1].dailyAchieved : (history[1].value - (history[2] ? history[2].value : 0))) 
    : 0;
    
  const isUp = lastRealization >= previousRealization;
    
  const [timeFilter, setTimeFilter] = useState('7d');
  
  const sliceMap = { '7d': 8, '30d': 31, 'all': history.length };
  const pointsToSlice = sliceMap[timeFilter] || 8;

  const chartData = [...history]
    .slice(0, pointsToSlice)
    .reverse()
    .map((item, idx, arr) => {
      if (idx === 0) return null; 
      const realisasi = item.dailyAchieved !== undefined ? item.dailyAchieved : (item.value - arr[idx - 1].value);
      const dateObj = parseLocalDate(item.date);
      return {
        name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
        realisasi: realisasi > 0 ? realisasi : 0,
      };
    })
    .filter(Boolean);

  const timeFilterOptions = [
    { id: '7d', label: '7 Hari' },
    { id: '30d', label: '30 Hari' },
    { id: 'all', label: 'Semua' },
  ];

  // ─── Pull to Refresh State & Handlers ───
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshState, setRefreshState] = useState('idle'); // 'idle' | 'pull' | 'ready' | 'loading'

  const handleTouchStart = (e) => {
    if (window.scrollY > 0 || refreshState === 'loading') return;
    const touch = e.touches[0];
    startYRef.current = touch.pageY;
    isPullingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || refreshState === 'loading' || window.scrollY > 0) return;
    const touch = e.touches[0];
    const distance = touch.pageY - startYRef.current;
    
    if (distance > 0) {
      const resistanceDistance = Math.min(distance * 0.4, 90);
      setPullDistance(resistanceDistance);
      setRefreshState(resistanceDistance >= 70 ? 'ready' : 'pull');
      
      // Prevent browser default pull-to-refresh gesture
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    
    if (refreshState === 'ready') {
      setRefreshState('loading');
      setPullDistance(60);
      try {
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error("Failed to refresh:", error);
      } finally {
        setRefreshState('idle');
        setPullDistance(0);
      }
    } else {
      setRefreshState('idle');
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull To Refresh Indicator (Mobile) */}
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-200 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-slate-200/40 dark:border-slate-800/40 shadow-inner"
        style={{ 
          height: `${pullDistance}px`, 
          opacity: pullDistance > 0 ? 1 : 0,
          marginBottom: pullDistance > 0 ? '1rem' : '0',
          borderStyle: pullDistance > 0 ? 'solid' : 'none',
          borderWidth: pullDistance > 0 ? '1px' : '0px',
          transition: isPullingRef.current ? 'none' : 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'
        }}
      >
        <div className="flex items-center gap-2.5 py-3">
          <RefreshCw 
            size={16} 
            className={`text-blue-600 dark:text-blue-400 transition-all ${refreshState === 'loading' ? 'animate-spin' : ''}`} 
            style={{ 
              transform: refreshState !== 'loading' ? `rotate(${pullDistance * 4.5}deg)` : undefined 
            }} 
          />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide">
            {refreshState === 'pull' && 'Tarik untuk memperbarui...'}
            {refreshState === 'ready' && 'Lepaskan untuk memperbarui...'}
            {refreshState === 'loading' && 'Memperbarui data...'}
          </span>
        </div>
      </div>

      {/* Main Content Flow with space-y-6 */}
      <div className="space-y-6">
        {/* Desktop Header with Manual Refresh Action */}
        <div className="hidden md:flex justify-between items-center bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Kinerja Real-time</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Metrik di bawah diperbarui secara otomatis dari basis data.</p>
          </div>
          <button
            onClick={async () => {
              setRefreshState('loading');
              try {
                if (onRefresh) await onRefresh();
              } finally {
                setRefreshState('idle');
              }
            }}
            disabled={refreshState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold transition-all shadow-sm text-xs cursor-pointer disabled:opacity-55"
          >
            <RefreshCw size={14} className={refreshState === 'loading' ? 'animate-spin' : ''} />
            {refreshState === 'loading' ? 'Memperbarui...' : 'Perbarui Data'}
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Capaian */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 animate-fade-in-up delay-75">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Activity size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Pencapaian</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none">{formatNumber(currentTotal)}</h3>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                <span>Target: {formatNumber(settings.totalTarget)}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Card 2: Capaian Terakhir */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 animate-fade-in-up delay-150">
            <div className={`p-3 rounded-xl shrink-0 ${isUp ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450'}`}>
              {isUp ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Capaian Terakhir</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none">+{formatNumber(lastRealization)}</h3>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                <span>Selisih vs kemarin:</span>
                <span className={`font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                  {isUp ? '↑' : '↓'} {formatNumber(Math.abs(lastRealization - previousRealization))}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                <div className={`h-1 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((lastRealization / (averageDaily || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3: Rata-rata Aktual */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 animate-fade-in-up delay-225">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <Target size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Rata-rata Aktual</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none">{formatNumber(averageDaily)}</h3>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                <span>Target Ideal:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatNumber(idealDaily)}/hari</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                <div className="bg-amber-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min((averageDaily / (idealDaily || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Card 4: Sisa Waktu & Target */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 animate-fade-in-up delay-300">
            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
              <Clock size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Sisa Waktu Kerja</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none">{remainingDays} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">hari</span></h3>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                <span>Target Harian Baru:</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">{formatNumber(dailyTarget)}/hari</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                <div className="bg-violet-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min((remainingDays / (totalProjectDays || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 enterprise-shadow animate-fade-in-up delay-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">Tren Kinerja Pencapaian</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Kinerja Aktual dibandingkan Target Dinamis</p>
            </div>
            <div className="flex bg-slate-100/80 dark:bg-slate-800 p-1 rounded-lg gap-0.5">
              {timeFilterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                    timeFilter === opt.id
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-800'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 w-full" style={{ minHeight: 288 }}>
            <ResponsiveContainer width="100%" height={288} minWidth={0}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} 
                  dy={10} 
                  minTickGap={20} 
                />
                <YAxis 
                  domain={[0, dataMax => Math.max(dataMax, dailyTarget * 1.15)]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={dailyTarget} 
                  stroke="#f43f5e" 
                  strokeDasharray="6 4" 
                  strokeWidth={1.5}
                  label={{ 
                    position: 'insideTopRight', 
                    value: `Target Harian: ${formatNumber(dailyTarget)}`, 
                    fill: '#f43f5e', 
                    fontSize: 11,
                    fontFamily: 'Inter',
                    fontWeight: 600
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="realisasi" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRealisasi)" 
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
