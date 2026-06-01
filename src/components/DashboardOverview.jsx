import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Activity, CalendarDays } from 'lucide-react';
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
import { formatNumber, getRemainingWorkingDays, calculateDailyTarget, getTotalWorkingDays } from '../utils/dateUtils';

function KPICard({ title, value, subtitle, icon, iconBg, iconColor, children, delay = '0' }) {
  return (
    <div className={`kpi-card bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow animate-fade-in-up delay-${delay}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {children}
      {subtitle && <p className="text-xs text-slate-500 mt-3">{subtitle}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">{formatNumber(payload[0].value)} <span className="text-xs text-slate-400 font-normal">pelanggan</span></p>
      </div>
    );
  }
  return null;
};

export default function DashboardOverview({ history, settings, setCurrentTab }) {
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const percentage = Math.min(((currentTotal / settings.totalTarget) * 100), 100).toFixed(1);
  
  const dailyTarget = calculateDailyTarget(currentTotal, settings);
  const remainingDays = getRemainingWorkingDays(settings);
  
  const totalProjectDays = getTotalWorkingDays(settings);
  const idealDaily = Math.ceil(settings.totalTarget / totalProjectDays);
  
  const lastRealization = history.length > 0 
    ? (history.length > 1 ? history[0].value - history[1].value : history[0].value) 
    : 0;
    
  const previousRealization = history.length > 1 
    ? (history.length > 2 ? history[1].value - history[2].value : history[1].value) 
    : 0;
    
  const isUp = lastRealization >= previousRealization;
  
  const averageDaily = history.length > 1 
    ? Math.round(currentTotal / (history.length - 1))
    : lastRealization;
    
  const [timeFilter, setTimeFilter] = useState('7d');
  
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

  const timeFilterOptions = [
    { id: '7d', label: '7 Hari' },
    { id: '30d', label: '30 Hari' },
    { id: 'all', label: 'Semua' },
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Quick Action Link */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-950 border border-blue-100/50 dark:border-slate-800 rounded-xl p-3.5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500 text-white rounded-lg"><CalendarDays size={14} /></div>
          <div>
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Ringkasan Kinerja & Analisis AI</span>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Analisis tren capaian oleh asisten kecerdasan buatan</span>
          </div>
        </div>
        <button 
          onClick={() => setCurrentTab && setCurrentTab('executive_summary')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          Lihat
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Capaian */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in-up delay-75">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Activity size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pencapaian</p>
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

        {/* Card 2: Kinerja Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in-up delay-150">
          <div className={`p-3 rounded-xl shrink-0 ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isUp ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capaian Terakhir</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">+{formatNumber(lastRealization)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Selisih vs kemarin:</span>
              <span className={`font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isUp ? '↑' : '↓'} {formatNumber(Math.abs(lastRealization - previousRealization))}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className={`h-1 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((lastRealization / (averageDaily || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Rata-rata Harian */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in-up delay-225">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Target size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rata-rata Aktual</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{formatNumber(averageDaily)}</h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Target Ideal:</span>
              <span className="font-bold text-amber-600">{formatNumber(idealDaily)}/hari</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min((averageDaily / (idealDaily || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Waktu & Target */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in-up delay-300">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0">
            <Clock size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa Waktu Kerja</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{remainingDays} <span className="text-sm font-normal text-slate-400">hari</span></h3>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
              <span>Target Harian Baru:</span>
              <span className="font-bold text-violet-600">{formatNumber(dailyTarget)}/hari</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-violet-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min((remainingDays / (totalProjectDays || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 enterprise-shadow animate-fade-in-up delay-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tren Kinerja Pencapaian</h3>
            <p className="text-xs text-slate-400 mt-0.5">Kinerja Aktual dibandingkan Target Dinamis</p>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-lg gap-0.5">
            {timeFilterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeFilter(opt.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  timeFilter === opt.id
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
  );
}
