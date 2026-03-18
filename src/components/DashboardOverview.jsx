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
import { formatNumber, getRemainingWorkingDays, calculateDailyTarget } from '../utils/dateUtils';

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

export default function DashboardOverview({ history, totalTarget }) {
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const percentage = Math.min(((currentTotal / totalTarget) * 100), 100).toFixed(1);
  
  const dailyTarget = calculateDailyTarget(currentTotal);
  const remainingDays = getRemainingWorkingDays();
  
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
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Capaian"
          value={formatNumber(currentTotal)}
          icon={<Activity size={20} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          delay="75"
        >
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-blue-600">{percentage}%</span> dari {formatNumber(totalTarget)}
          </p>
        </KPICard>

        <KPICard
          title="Kinerja Terakhir"
          value={`+${formatNumber(lastRealization)}`}
          icon={isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          iconBg={isUp ? 'bg-emerald-50' : 'bg-rose-50'}
          iconColor={isUp ? 'text-emerald-600' : 'text-rose-600'}
          delay="150"
        >
          <div className="flex items-center gap-1.5 mt-3">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {isUp ? '↑' : '↓'} {formatNumber(Math.abs(lastRealization - previousRealization))}
            </div>
            <span className="text-xs text-slate-400">vs kemarin</span>
          </div>
        </KPICard>

        <KPICard
          title="Rata-rata Harian"
          value={formatNumber(averageDaily)}
          subtitle={<>Target ideal: <span className="font-semibold text-slate-700">1.873</span>/hari</>}
          icon={<Target size={20} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          delay="225"
        />

        <KPICard
          title="Sisa Waktu"
          value={<>{remainingDays} <span className="text-base font-normal text-slate-400">hari</span></>}
          icon={<Clock size={20} />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          delay="300"
        >
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Target Harian Baru</p>
            <p className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
              <CalendarDays size={14} /> {formatNumber(dailyTarget)}<span className="text-xs font-normal text-slate-400">/hari</span>
            </p>
          </div>
        </KPICard>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 enterprise-shadow animate-fade-in-up delay-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tren Kinerja Capaian</h3>
            <p className="text-xs text-slate-400 mt-0.5">Realisasi harian vs Target Dinamis</p>
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
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} 
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={dailyTarget} 
                stroke="#f43f5e" 
                strokeDasharray="6 4" 
                strokeWidth={1.5}
                label={{ 
                  position: 'insideTopRight', 
                  value: `Target: ${formatNumber(dailyTarget)}`, 
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
