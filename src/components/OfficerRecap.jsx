import React, { useState, useMemo } from 'react';
import { 
  Search, Users, Award, AlertTriangle, CheckCircle2, 
  ArrowUpDown, ChevronLeft, ChevronRight, User, Mail, Sparkles 
} from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';

export default function OfficerRecap({ officers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('paska_realisasi'); // name, paska_realisasi, paska_submitted, pra_submitted
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Group & Merge Postpaid (Paskabayar) and Prepaid (Prabayar) by Officer Name
  const mergedOfficers = useMemo(() => {
    const map = new Map();
    
    officers.forEach(o => {
      const nameKey = (o.nama || '').trim().toUpperCase();
      if (!nameKey) return;
      
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          nama: o.nama,
          email: o.email || '',
          unitUpi: o.unitUpi || '',
          unitAp: o.unitAp || '',
          unitUp: o.unitUp || '',
          
          // Postpaid (Paskabayar) fields
          paskaOpen: 0,
          paskaSubmitted: 0,
          paskaRejected: 0,
          paskaRealisasi: 0,
          hasPaska: false,
          
          // Prepaid (Prabayar) fields
          praSubmitted: 0,
          praRejected: 0,
          hasPra: false
        });
      }
      
      const entry = map.get(nameKey);
      if (o.type === 'prabayar') {
        entry.praSubmitted = o.submitted || 0;
        entry.praRejected = o.rejected || 0;
        entry.hasPra = true;
      } else {
        // Default to paskabayar
        entry.paskaOpen = o.open || 0;
        entry.paskaSubmitted = o.submitted || 0;
        entry.paskaRejected = o.rejected || 0;
        entry.paskaRealisasi = o.realisasi || 0;
        entry.hasPaska = true;
      }
    });
    
    return Array.from(map.values());
  }, [officers]);

  // 2. Global KPI Aggregations
  const stats = useMemo(() => {
    if (!mergedOfficers || mergedOfficers.length === 0) {
      return {
        total: 0,
        totalPaskaSubmitted: 0,
        totalPaskaOpen: 0,
        totalPaskaRejected: 0,
        avgPaskaRealisasi: '0.0',
        totalPraSubmitted: 0,
        totalPraRejected: 0
      };
    }

    const total = mergedOfficers.length;
    let totalPaskaSubmitted = 0;
    let totalPaskaOpen = 0;
    let totalPaskaRejected = 0;
    let sumPaskaRealisasi = 0;
    let countPaskaRealisasi = 0;
    
    let totalPraSubmitted = 0;
    let totalPraRejected = 0;

    mergedOfficers.forEach(o => {
      totalPaskaSubmitted += o.paskaSubmitted;
      totalPaskaOpen += o.paskaOpen;
      totalPaskaRejected += o.paskaRejected;
      
      if (o.hasPaska) {
        sumPaskaRealisasi += o.paskaRealisasi;
        countPaskaRealisasi++;
      }

      totalPraSubmitted += o.praSubmitted;
      totalPraRejected += o.praRejected;
    });

    const avgPaskaRealisasi = countPaskaRealisasi > 0 
      ? (sumPaskaRealisasi / countPaskaRealisasi * 100).toFixed(1) 
      : '0.0';

    return {
      total,
      totalPaskaSubmitted,
      totalPaskaOpen,
      totalPaskaRejected,
      avgPaskaRealisasi,
      totalPraSubmitted,
      totalPraRejected
    };
  }, [mergedOfficers]);

  // 3. Filtering, Searching, and Sorting Logic
  const processedOfficers = useMemo(() => {
    let list = [...mergedOfficers];

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(o => 
        (o.nama && o.nama.toLowerCase().includes(query)) || 
        (o.email && o.email.toLowerCase().includes(query))
      );
    }

    // Filter by Paskabayar performance category
    if (performanceFilter !== 'all') {
      list = list.filter(o => {
        const pct = (o.paskaRealisasi || 0) * 100;
        if (performanceFilter === 'excellent') return pct >= 95;
        if (performanceFilter === 'good') return pct >= 80 && pct < 95;
        if (performanceFilter === 'warning') return pct < 80;
        return true;
      });
    }

    // Sort logic
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.nama || '';
        valB = b.nama || '';
      } else if (sortBy === 'paska_submitted') {
        valA = a.paskaSubmitted || 0;
        valB = b.paskaSubmitted || 0;
      } else if (sortBy === 'pra_submitted') {
        valA = a.praSubmitted || 0;
        valB = b.praSubmitted || 0;
      } else {
        // Default to paska_realisasi
        valA = a.paskaRealisasi || 0;
        valB = b.paskaRealisasi || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [mergedOfficers, searchTerm, performanceFilter, sortBy, sortOrder]);

  // 4. Pagination Logic
  const totalPages = Math.ceil(processedOfficers.length / itemsPerPage) || 1;
  const paginatedOfficers = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * itemsPerPage;
    return processedOfficers.slice(start, start + itemsPerPage);
  }, [processedOfficers, currentPage, totalPages]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Helper for performance category styling (Postpaid)
  const getPerformanceBadge = (realisasi) => {
    const pct = realisasi * 100;
    if (pct >= 95) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        label: 'Sangat Baik',
        textColor: 'text-emerald-600',
        progressBarBg: 'bg-emerald-500'
      };
    } else if (pct >= 80) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-100',
        label: 'Cukup Baik',
        textColor: 'text-amber-600',
        progressBarBg: 'bg-amber-500'
      };
    } else {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-100',
        label: 'Butuh Bimbingan',
        textColor: 'text-rose-600',
        progressBarBg: 'bg-rose-500'
      };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800">Rekap Kinerja Petugas Gabungan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Satu tabel rekapitulasi data Paskabayar dan Prabayar untuk seluruh petugas</p>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <Users size={14} className="text-slate-400" />
          <span>{stats.total} Petugas Terdaftar</span>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Data Rekap Petugas Kosong</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Belum ada berkas rekap kinerja yang diunggah. Silakan unggah berkas Excel Paskabayar atau Prabayar di menu <strong>Input Laporan</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Petugas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Petugas</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.total} <span className="text-xs font-normal text-slate-400">petugas</span></h3>
              </div>
            </div>

            {/* Capaian Paskabayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted Paskabayar</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatNumber(stats.totalPaskaSubmitted)}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Open: <span className="font-semibold text-slate-600">{formatNumber(stats.totalPaskaOpen)}</span> | Rej: <span className="font-semibold text-rose-500">{formatNumber(stats.totalPaskaRejected)}</span>
                </p>
              </div>
            </div>

            {/* Rata-rata Realisasi Paskabayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Realisasi</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.avgPaskaRealisasi}%</h3>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${stats.avgPaskaRealisasi}%` }} />
                </div>
              </div>
            </div>

            {/* Capaian Prabayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted Prabayar</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight text-violet-900">{formatNumber(stats.totalPraSubmitted)}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rejected: <span className="font-semibold text-rose-500">{formatNumber(stats.totalPraRejected)}</span>
                </p>
              </div>
            </div>

          </div>

          {/* Control Panel: Search, Filter, Sort */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search bar */}
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama biller..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-inner"
                />
              </div>

              {/* Filter & Sort controls */}
              <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                
                {/* Filter by performance */}
                <select
                  value={performanceFilter}
                  onChange={(e) => { setPerformanceFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="all">Semua Kinerja Paskabayar</option>
                  <option value="excellent">Sangat Baik (≥ 95%)</option>
                  <option value="good">Cukup Baik (80% - 94.9%)</option>
                  <option value="warning">Butuh Bimbingan (&lt; 80%)</option>
                </select>

                {/* Sort buttons */}
                <div className="flex items-center gap-1 bg-slate-50/50 border border-slate-200 rounded-xl p-1">
                  <button
                    onClick={() => toggleSort('name')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === 'name' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Nama
                    {sortBy === 'name' && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort('paska_realisasi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === 'paska_realisasi' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Realisasi Paska
                    {sortBy === 'paska_realisasi' && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort('paska_submitted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === 'paska_submitted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Submit Paska
                    {sortBy === 'paska_submitted' && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort('pra_submitted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === 'pra_submitted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Submit Pra
                    {sortBy === 'pra_submitted' && <ArrowUpDown size={12} />}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Unified Dual-Header Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th rowSpan="2" className="py-4 px-6 text-center w-16 border-r border-slate-200">Peringkat</th>
                    <th rowSpan="2" className="py-4 px-6 border-r border-slate-200 w-64">Identitas Petugas</th>
                    <th colSpan="4" className="py-2.5 px-4 text-center bg-blue-50/50 text-blue-800 border-r border-b border-blue-100 font-extrabold">Paskabayar (Postpaid)</th>
                    <th colSpan="2" className="py-2.5 px-4 text-center bg-violet-50/50 text-violet-850 border-b border-violet-100 font-extrabold">Prabayar (Prepaid)</th>
                  </tr>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Open (Tunggak)</th>
                    <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Submitted</th>
                    <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Rejected</th>
                    <th className="py-3 px-4 text-center border-r border-slate-200 bg-blue-50/10">Realisasi %</th>
                    <th className="py-3 px-4 text-center border-r border-slate-100 bg-violet-50/10">Submitted</th>
                    <th className="py-3 px-4 text-center bg-violet-50/10">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedOfficers.length > 0 ? (
                    paginatedOfficers.map((o, index) => {
                      const rank = (currentPage - 1) * itemsPerPage + index + 1;
                      const style = getPerformanceBadge(o.paskaRealisasi);
                      const paskaPercentage = (o.paskaRealisasi * 100).toFixed(1);

                      return (
                        <tr key={index} className="hover:bg-slate-50/30 transition-colors group">
                          
                          {/* Peringkat */}
                          <td className="py-3.5 px-6 text-center font-bold text-slate-500 border-r border-slate-200">
                            {rank <= 3 && sortOrder === 'desc' && sortBy === 'paska_realisasi' ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs text-white font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/25">
                                {rank}
                              </span>
                            ) : rank}
                          </td>

                          {/* Identitas */}
                          <td className="py-3.5 px-6 border-r border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                                <User size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 leading-snug truncate">{o.nama}</p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                  <Mail size={11} className="shrink-0" />
                                  <span className="truncate">{o.email}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Paskabayar - Open */}
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600 border-r border-slate-100 bg-blue-50/5">
                            {o.hasPaska ? formatNumber(o.paskaOpen) : '-'}
                          </td>

                          {/* Paskabayar - Submitted */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 border-r border-slate-100 bg-blue-50/5">
                            {o.hasPaska ? formatNumber(o.paskaSubmitted) : '-'}
                          </td>

                          {/* Paskabayar - Rejected */}
                          <td className="py-3.5 px-4 text-center font-medium text-rose-500 border-r border-slate-100 bg-blue-50/5">
                            {o.hasPaska ? formatNumber(o.paskaRejected) : '-'}
                          </td>

                          {/* Paskabayar - Realisasi % */}
                          <td className="py-3.5 px-4 border-r border-slate-200 bg-blue-50/5">
                            {o.hasPaska ? (
                              <div className="flex flex-col items-center gap-1 w-full min-w-[120px]">
                                <span className={`text-xs font-extrabold ${style.textColor}`}>{paskaPercentage}%</span>
                                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div className={`${style.progressBarBg} h-1 rounded-full transition-all duration-500`} style={{ width: `${Math.min(paskaPercentage, 100)}%` }} />
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-0.5 shrink-0 ${style.bg}`}>
                                  {style.label}
                                </span>
                              </div>
                            ) : '-'}
                          </td>

                          {/* Prabayar - Submitted */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 border-r border-slate-100 bg-violet-50/5">
                            {o.hasPra ? formatNumber(o.praSubmitted) : '-'}
                          </td>

                          {/* Prabayar - Rejected */}
                          <td className="py-3.5 px-4 text-center font-medium text-rose-500 bg-violet-50/5">
                            {o.hasPra ? formatNumber(o.praRejected) : '-'}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada petugas yang cocok dengan kriteria pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-col sm:flex-row gap-3">
                <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  Menampilkan <span className="font-semibold text-slate-700">{Math.min(processedOfficers.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="font-semibold text-slate-700">{Math.min(processedOfficers.length, currentPage * itemsPerPage)}</span> dari <span className="font-semibold text-slate-700">{processedOfficers.length}</span> petugas
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 border-blue-650'
                            : 'border border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Selanjutnya"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
