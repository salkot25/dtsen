import React from 'react';
import { formatNumber } from '../utils/dateUtils';

export default function HistoryTable({ history }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 enterprise-shadow overflow-hidden flex flex-col h-full max-h-[400px]">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900">Riwayat Input</h3>
        <p className="text-sm text-slate-500">Rekam jejak pembaruan data (Terbaru di atas)</p>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
            <tr>
              <th scope="col" className="px-5 py-3 border-b border-slate-200">Tanggal</th>
              <th scope="col" className="px-5 py-3 border-b border-slate-200 text-right">Capaian Harian</th>
              <th scope="col" className="px-5 py-3 border-b border-slate-200 text-right">Kumulatif</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              // Calculate daily achieved by subtracting from previous day (which is at index + 1 in a descending array)
              const previousCumulative = history[index + 1] ? history[index + 1].value : 0;
              const dailyAchieved = index !== history.length - 1 ? item.value - previousCumulative : item.value;
              
              const dateStr = new Date(item.date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <tr key={item.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {dateStr}
                    {index === 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">New</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-medium">
                    +{formatNumber(dailyAchieved)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-700">
                    {formatNumber(item.value)}
                  </td>
                </tr>
              );
            })}
            
            {history.length === 0 && (
              <tr>
                <td colSpan="3" className="px-5 py-8 text-center text-slate-400">
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
