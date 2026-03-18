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

export default function DashboardOverview({ history, totalTarget }) {
  const currentTotal = history.length > 0 ? history[0].value : 0;
  const percentage = Math.min(((currentTotal / totalTarget) * 100), 100).toFixed(1);
  
  const dailyTarget = calculateDailyTarget(currentTotal);
  const remainingDays = getRemainingWorkingDays();
  
  // Calculate performance metrics
  const lastRealization = history.length > 0 
    ? (history.length > 1 ? history[0].value - history[1].value : history[0].value) 
    : 0;
    
  const previousRealization = history.length > 1 
    ? (history.length > 2 ? history[1].value - history[2].value : history[1].value) 
    : 0;
    
  const isUp = lastRealization >= previousRealization;
  
  const averageDaily = history.length > 1 
    ? Math.round(currentTotal / (history.length - 1)) // Naive average based on entered days
    : lastRealization;
    
  const [timeFilter, setTimeFilter] = useState('7d');
  
  const sliceMap = { '7d': 8, '30d': 31, 'all': history.length };
  const pointsToSlice = sliceMap[timeFilter] || 8;

  // Prepare chart data (reversed so oldest is left)
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

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Capaian */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Capaian</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatNumber(currentTotal)}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{percentage}%</span> dari target {formatNumber(totalTarget)}
          </p>
        </div>

        {/* Card 2: Kinerja Terakhir */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Kinerja Harian Terakhir</p>
              <h3 className="text-2xl font-bold text-slate-900">+{formatNumber(lastRealization)}</h3>
            </div>
            <div className={`p-2 rounded-lg ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            vs hari sebelumnya: <span className={`font-medium ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatNumber(Math.abs(lastRealization - previousRealization))}
            </span>
          </p>
        </div>

        {/* Card 3: Rata-rata Harian */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Rata-rata Harian</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatNumber(averageDaily)}</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
             Target ideal awal: <span className="font-medium text-slate-700">1.873</span> /hari
          </p>
        </div>

        {/* Card 4: Sisa Waktu & Target Baru */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Sisa Hari Kerja</p>
              <h3 className="text-2xl font-bold text-slate-900">{remainingDays} <span className="text-base font-normal text-slate-500">hari</span></h3>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Target Harian Baru:</p>
            <p className="text-sm font-bold text-blue-600 flex items-center gap-1">
              <CalendarDays size={14} /> {formatNumber(dailyTarget)} /hari
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 enterprise-shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tren Kinerja Capaian</h3>
            <p className="text-sm text-slate-500">Realisasi per hari vs Target Dinamis</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setTimeFilter('7d')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === '7d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>7 Hari</button>
            <button onClick={() => setTimeFilter('30d')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === '30d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>30 Hari</button>
            <button onClick={() => setTimeFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Semua</button>
          </div>
        </div>
        
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatNumber(value), 'Realisasi']}
              />
              <ReferenceLine y={dailyTarget} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: `Target: ${formatNumber(dailyTarget)}`, fill: '#f43f5e', fontSize: 12 }} />
              <Area type="monotone" dataKey="realisasi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRealisasi)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
