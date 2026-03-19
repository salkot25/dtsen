import React, { useState } from 'react';
import { formatNumber } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function HistoryTable({ history, selectedId, onSelectItem }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = history.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goTo = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 enterprise-shadow overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Riwayat Pendataan</h3>
          <p className="text-[11px] text-slate-400">Pilih data riwayat untuk dilaporkan melalui WhatsApp</p>
        </div>
        {history.length > 0 && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{history.length} data</span>
        )}
      </div>
      
      {/* Card-style list - no horizontal scroll */}
      <div className="divide-y divide-slate-50">
        {paginatedData.map((item, pageIndex) => {
          const globalIndex = startIdx + pageIndex;
          const previousCumulative = history[globalIndex + 1] ? history[globalIndex + 1].value : 0;
          const dailyAchieved = item.dailyAchieved !== undefined 
            ? item.dailyAchieved 
            : (globalIndex !== history.length - 1 ? item.value - previousCumulative : item.value);
          
          const dateStr = new Date(item.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                isSelected 
                  ? 'bg-blue-50 border-l-[3px] border-l-blue-600' 
                  : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Radio indicator */}
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {dateStr}
                    {globalIndex === 0 && <span className="ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Terbaru</span>}
                  </p>
                  <p className="text-[11px] text-slate-400">Kumulatif: {formatNumber(item.value)}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 flex-shrink-0">+{formatNumber(dailyAchieved)}</span>
            </button>
          );
        })}
        
        {history.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-300 text-sm">
            Data riwayat pendataan belum tersedia.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, history.length)} dari {history.length}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => goTo(currentPage - 1)} 
              disabled={currentPage === 1}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goTo(page)}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                  page === currentPage 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => goTo(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
