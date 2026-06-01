import React, { useState, useMemo } from 'react';
import { 
  Search, Users, Award, AlertTriangle, CheckCircle2, 
  ArrowUpDown, ChevronLeft, ChevronRight, User, Mail, Sparkles 
} from 'lucide-react';
import { formatNumber } from '../utils/dateUtils';

export default function OfficerRecap({ officers = [] }) {
  const [selectedType, setSelectedType] = useState('paskabayar'); // 'paskabayar', 'prabayar'
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('realisasi'); // name, submitted, realisasi
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. KPI Aggregations per Selected Type
  const stats = useMemo(() => {
    const typeOfficers = officers.filter(o => o.type === selectedType);
    if (!typeOfficers || typeOfficers.length === 0) {
      return { total: 0, submitted: 0, open: 0, avgRealisasi: 0 };
    }
    
    const total = typeOfficers.length;
    let sumSubmitted = 0;
    let sumOpen = 0;
    let sumRealisasi = 0;
    
    typeOfficers.forEach(o => {
      sumSubmitted += (o.submitted || 0);
      sumOpen += (o.open || 0);
      sumRealisasi += (o.realisasi || 0);
    });

    const avgRealisasi = sumRealisasi / total;
    return {
      total,
      submitted: sumSubmitted,
      open: sumOpen,
      avgRealisasi: (avgRealisasi * 100).toFixed(1)
    };
  }, [officers, selectedType]);

  // 2. Filter, Search, and Sort Logic
  const processedOfficers = useMemo(() => {
    // First filter by selected postpaid/prepaid type
    let list = officers.filter(o => o.type === selectedType);

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(o => 
        (o.nama && o.nama.toLowerCase().includes(query)) || 
        (o.email && o.email.toLowerCase().includes(query))
      );
    }

    // Filter by performance category
    if (performanceFilter !== 'all') {
      list = list.filter(o => {
        const pct = (o.realisasi || 0) * 100;
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
      } else if (sortBy === 'submitted') {
        valA = a.submitted || 0;
        valB = b.submitted || 0;
      } else {
        valA = a.realisasi || 0;
        valB = b.realisasi || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [officers, selectedType, searchTerm, performanceFilter, sortBy, sortOrder]);

  // 3. Pagination Logic
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

  // Helper for performance category styling
  const getPerformanceBadge = (realisasi) => {
    const pct = realisasi * 100;
    if (pct >= 95) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        label: 'Sangat Baik',
        color: 'text-emerald-500',
        progressBarBg: selectedType === 'paskabayar' ? 'bg-blue-500' : 'bg-violet-500'
      };
    } else if (pct >= 80) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-100',
        label: 'Cukup Baik',
        color: 'text-amber-500',
        progressBarBg: 'bg-amber-500'
      };
    } else {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-100',
        label: 'Butuh Pendampingan',
        color: 'text-rose-500',
        progressBarBg: 'bg-rose-500'
      };
    }
  };

  const activeColorClass = selectedType === 'paskabayar' ? 'text-blue-600 bg-blue-50' : 'text-violet-600 bg-violet-50';
  const activeBtnClass = selectedType === 'paskabayar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-violet-600 shadow-sm';

  return (
    <div className="space-y-6">
      
      {/* Category Toggle / Segmented Switch Tab */}
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800">Daftar Rekap Kinerja</h3>
          <p className="text-xs text-slate-400 mt-0.5">Pilih kategori layanan pendataan petugas</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-72">
          <button
            onClick={() => { setSelectedType('paskabayar'); setSearchTerm(''); setCurrentPage(1); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedType === 'paskabayar' ? activeBtnClass : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Paskabayar (Postpaid)
          </button>
          <button
            onClick={() => { setSelectedType('prabayar'); setSearchTerm(''); setCurrentPage(1); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedType === 'prabayar' ? activeBtnClass : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Prabayar (Prepaid)
          </button>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Data Rekap {selectedType === 'paskabayar' ? 'Paskabayar' : 'Prabayar'} Kosong
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Belum ada berkas rekap tipe ini yang diunggah. Silakan unggah berkas rekap Excel di menu <strong>Input Laporan</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className={`p-3 rounded-xl ${activeColorClass}`}>
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Petugas</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.total} <span className="text-xs font-normal text-slate-400">petugas</span></h3>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className={`p-3 rounded-xl ${selectedType === 'paskabayar' ? 'text-blue-600 bg-blue-50' : 'text-violet-600 bg-violet-50'}`}>
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submitted</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatNumber(stats.submitted)} <span className="text-xs font-normal text-slate-400">pelanggan</span></h3>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tunggakan (Open)</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatNumber(stats.open)} <span className="text-xs font-normal text-slate-400">pelanggan</span></h3>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Realisasi</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.avgRealisasi}%</h3>
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
                  placeholder="Cari nama atau email..."
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
                  className="px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-700 font-medium"
                >
                  <option value="all">Semua Kinerja</option>
                  <option value="excellent">Sangat Baik (≥ 95%)</option>
                  <option value="good">Cukup Baik (80% - 94.9%)</option>
                  <option value="warning">Butuh Bimbingan (&lt; 80%)</option>
                </select>

                {/* Sort buttons */}
                <div className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-200 rounded-xl p-1">
                  <button
                    onClick={() => toggleSort('name')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      sortBy === 'name' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Nama
                    {sortBy === 'name' && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort('submitted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      sortBy === 'submitted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Submitted
                    {sortBy === 'submitted' && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort('realisasi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      sortBy === 'realisasi' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Realisasi
                    {sortBy === 'realisasi' && <ArrowUpDown size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Data */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Peringkat</th>
                    <th className="py-4 px-6">Identitas Petugas</th>
                    <th className="py-4 px-6 text-center">Open (Tunggakan)</th>
                    <th className="py-4 px-6 text-center">Submitted (Capaian)</th>
                    <th className="py-4 px-6">Tingkat Realisasi</th>
                    <th className="py-4 px-6 text-center w-40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedOfficers.length > 0 ? (
                    paginatedOfficers.map((o, index) => {
                      const rank = sortOrder === 'desc' && sortBy === 'realisasi'
                        ? (currentPage - 1) * itemsPerPage + index + 1
                        : o.no;
                      const style = getPerformanceBadge(o.realisasi);
                      const percentage = (o.realisasi * 100).toFixed(1);

                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                          {/* Peringkat */}
                          <td className="py-3.5 px-6 text-center font-bold text-slate-500">
                            {rank <= 3 && sortOrder === 'desc' && sortBy === 'realisasi' ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs text-white font-extrabold ${
                                rank === 1 ? (selectedType === 'paskabayar' ? 'bg-blue-500 shadow-md shadow-blue-500/20' : 'bg-violet-500 shadow-md shadow-violet-500/20') : 
                                rank === 2 ? 'bg-slate-300 shadow-md shadow-slate-300/20' : 
                                'bg-amber-600 shadow-md shadow-amber-600/20'
                              }`}>
                                {rank}
                              </span>
                            ) : rank}
                          </td>

                          {/* Identitas */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-snug">{o.nama}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={12} />{o.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Open */}
                          <td className="py-3.5 px-6 text-center font-medium text-slate-600">
                            {formatNumber(o.open)}
                          </td>

                          {/* Submitted */}
                          <td className="py-3.5 px-6 text-center font-bold text-slate-700">
                            {formatNumber(o.submitted)}
                          </td>

                          {/* Realisasi Progress Bar */}
                          <td className="py-3.5 px-6">
                            <div className="w-full max-w-[200px] space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-slate-700">{percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`${style.progressBarBg} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.progressBarBg}`} />
                              {style.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Tidak ada petugas yang cocok dengan kriteria pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Section */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan <span className="font-semibold text-slate-700">{Math.min(processedOfficers.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="font-semibold text-slate-700">{Math.min(processedOfficers.length, currentPage * itemsPerPage)}</span> dari <span className="font-semibold text-slate-700">{processedOfficers.length}</span> petugas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? (selectedType === 'paskabayar' ? 'bg-blue-600 text-white shadow-sm' : 'bg-violet-600 text-white shadow-sm')
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Selanjutnya"
                  >
                    <ChevronRight size={16} />
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
