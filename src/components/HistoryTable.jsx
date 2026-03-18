import React from 'react';
import { formatNumber } from '../utils/dateUtils';

export default function HistoryTable({ history }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 enterprise-shadow overflow-hidden flex flex-col h-full max-h-[400px]">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Riwayat Input</h3>
        <p className="text-xs text-slate-400 mt-0.5">Rekam jejak pembaruan data</p>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">Tanggal</th>
              <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">Harian</th>
              <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">Kumulatif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.map((item, index) => {
              const previousCumulative = history[index + 1] ? history[index + 1].value : 0;
              const dailyAchieved = item.dailyAchieved !== undefined 
                ? item.dailyAchieved 
                : (index !== history.length - 1 ? item.value - previousCumulative : item.value);
              
              const dateStr = new Date(item.date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap text-sm">
                    <span className="font-medium">{dateStr}</span>
                    {index === 0 && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">Terbaru</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-semibold text-sm">
                    +{formatNumber(dailyAchieved)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-600 text-sm tabular-nums">
                    {formatNumber(item.value)}
                  </td>
                </tr>
              );
            })}
            
            {history.length === 0 && (
              <tr>
                <td colSpan="3" className="px-5 py-10 text-center text-slate-300 text-sm">
                  Belum ada riwayat data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
