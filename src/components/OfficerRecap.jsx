import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Sparkles,
} from "lucide-react";
import { formatNumber } from "../utils/dateUtils";

export default function OfficerRecap({ officers = [], settings = {} }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all"); // all, paskabayar, prabayar
  const [sortBy, setSortBy] = useState("total_submitted"); // total_submitted, name, paska_submitted, pra_submitted
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMobileCard, setExpandedMobileCard] = useState(null);
  const itemsPerPage = 10;

  // 1. Group & Merge Postpaid (Paskabayar) and Prepaid (Prabayar) by Officer Name
  const mergedOfficers = useMemo(() => {
    const map = new Map();

    officers.forEach((o) => {
      const nameKey = (o.nama || "").trim().toUpperCase();
      if (!nameKey) return;

      if (!map.has(nameKey)) {
        map.set(nameKey, {
          nama: o.nama,
          email: o.email || "",
          unitUpi: o.unitUpi || "",
          unitAp: o.unitAp || "",
          unitUp: o.unitUp || "",

          // Postpaid (Paskabayar) fields
          paskaOpen: 0,
          paskaSubmitted: 0,
          paskaRejected: 0,
          paskaRealisasi: 0,
          hasPaska: false,
          paskaColI: 0,
          paskaColJ: 0,
          paskaColK: 0,
          paskaColL: 0,

          // Prepaid (Prabayar) fields
          praSubmitted: 0,
          praRejected: 0,
          hasPra: false,
          praColI: 0,
          praColJ: 0,
          praColK: 0,
          praColL: 0,
        });
      }

      const entry = map.get(nameKey);
      if (o.type === "prabayar") {
        entry.praSubmitted = o.submitted || 0;
        entry.praRejected = o.rejected || 0;
        entry.hasPra = true;
        entry.praColI = o.colI !== undefined ? o.colI : 0;
        entry.praColJ = o.colJ !== undefined ? o.colJ : 0;
        entry.praColK = o.colK !== undefined ? o.colK : 0;
        entry.praColL = o.colL !== undefined ? o.colL : 0;
      } else {
        // Default to paskabayar
        entry.paskaOpen = o.open || 0;
        entry.paskaSubmitted = o.submitted || 0;
        entry.paskaRejected = o.rejected || 0;
        entry.paskaRealisasi = o.realisasi || 0;
        entry.hasPaska = true;
        entry.paskaColI = o.colI !== undefined ? o.colI : 0;
        entry.paskaColJ = o.colJ !== undefined ? o.colJ : 0;
        entry.paskaColK = o.colK !== undefined ? o.colK : 0;
        entry.paskaColL = o.colL !== undefined ? o.colL : 0;
      }
    });

    // Convert to list, calculate total submitted (Postpaid + Prepaid) for each officer
    const list = Array.from(map.values()).map((o) => {
      const totalSubmitted = o.paskaSubmitted + o.praSubmitted;
      return {
        ...o,
        totalSubmitted,
      };
    });

    // Sort by totalSubmitted descending to calculate absolute global ranking
    list.sort((a, b) => b.totalSubmitted - a.totalSubmitted);

    // Assign rank (no) based on the absolute global ranking
    return list.map((o, idx) => ({
      ...o,
      no: idx + 1,
    }));
  }, [officers]);

  // 2. Global KPI Aggregations
  const stats = useMemo(() => {
    if (!mergedOfficers || mergedOfficers.length === 0) {
      return {
        total: 0,
        totalPaskaSubmitted: 0,
        totalPaskaOpen: 0,
        totalPaskaRejected: 0,
        avgPaskaRealisasi: "0.0",
        totalPraSubmitted: 0,
        totalPraRejected: 0,
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

    mergedOfficers.forEach((o) => {
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

    const avgPaskaRealisasi =
      countPaskaRealisasi > 0
        ? ((sumPaskaRealisasi / countPaskaRealisasi) * 100).toFixed(1)
        : "0.0";

    return {
      total,
      totalPaskaSubmitted,
      totalPaskaOpen,
      totalPaskaRejected,
      avgPaskaRealisasi,
      totalPraSubmitted,
      totalPraRejected,
    };
  }, [mergedOfficers]);

  // 3. Filtering, Searching, and Sorting Logic
  const processedOfficers = useMemo(() => {
    let list = [...mergedOfficers];

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          (o.nama && o.nama.toLowerCase().includes(query)) ||
          (o.email && o.email.toLowerCase().includes(query)),
      );
    }

    // Filter by Paskabayar performance category
    if (performanceFilter !== "all") {
      list = list.filter((o) => {
        const pct = (o.paskaRealisasi || 0) * 100;
        if (performanceFilter === "excellent") return pct >= 95;
        if (performanceFilter === "good") return pct >= 80 && pct < 95;
        if (performanceFilter === "warning") return pct < 80;
        return true;
      });
    }

    // Sort logic
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") {
        valA = a.nama || "";
        valB = b.nama || "";
      } else if (sortBy === "paska_submitted") {
        valA = a.paskaSubmitted || 0;
        valB = b.paskaSubmitted || 0;
      } else if (sortBy === "pra_submitted") {
        valA = a.praSubmitted || 0;
        valB = b.praSubmitted || 0;
      } else {
        // Default: sort by totalSubmitted ('total_submitted' or fallback)
        valA = a.totalSubmitted || 0;
        valB = b.totalSubmitted || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
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
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page
  };

  const toggleMobileCard = (mobileCardKey) => {
    setExpandedMobileCard((prev) =>
      prev === mobileCardKey ? null : mobileCardKey,
    );
  };

  // Helper for performance category styling (Postpaid)
  const getPerformanceBadge = (realisasi) => {
    const pct = realisasi * 100;
    if (pct >= 95) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
        label: "Sangat Baik",
        textColor: "text-emerald-600",
        progressBarBg: "bg-emerald-500",
      };
    } else if (pct >= 80) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-100",
        label: "Cukup Baik",
        textColor: "text-amber-600",
        progressBarBg: "bg-amber-500",
      };
    } else {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-100",
        label: "Butuh Bimbingan",
        textColor: "text-rose-600",
        progressBarBg: "bg-rose-500",
      };
    }
  };

  // Target & Percentage Calculations according to customized formula
  const totalTarget = settings.totalTarget || 206533;

  // Paskabayar target = Total Open Paskabayar + Total Submitted Paskabayar
  const targetPaska = stats.totalPaskaOpen + stats.totalPaskaSubmitted;
  // Paskabayar percentage = (Total Submitted / targetPaska) * 100
  const paskaPct =
    targetPaska > 0
      ? ((stats.totalPaskaSubmitted / targetPaska) * 100).toFixed(1)
      : "0.0";

  // Prabayar target = Total Target - targetPaska
  const targetPra = totalTarget - targetPaska;
  // Prabayar percentage = (Total Submitted / targetPra) * 100
  const praPct =
    targetPra > 0
      ? ((stats.totalPraSubmitted / targetPra) * 100).toFixed(1)
      : "0.0";

  // Combined progress = Total Combined Submitted / Total Target
  const totalCombinedSubmitted =
    stats.totalPaskaSubmitted + stats.totalPraSubmitted;
  const combinedPct =
    totalTarget > 0
      ? ((totalCombinedSubmitted / totalTarget) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {stats.total === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Data Rekap Petugas Kosong
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Belum ada berkas rekap kinerja yang diunggah. Silakan unggah berkas
            Excel Paskabayar atau Prabayar di menu{" "}
            <strong>Input Laporan</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Petugas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl shrink-0">
                <Users size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Total Petugas
                </p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">
                  {stats.total}
                </h3>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Kontribusi Aktif:</span>
                  <span className="font-bold text-slate-600">100%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-slate-400 h-1 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Total Target */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Award size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Total Target
                </p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">
                  {formatNumber(totalTarget)}
                </h3>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Progres Gabungan:</span>
                  <span className="font-bold text-amber-600">
                    {combinedPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(combinedPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Submitted Paskabayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Submitted Paskabayar
                </p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">
                  {formatNumber(stats.totalPaskaSubmitted)}
                </h3>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Rasio Realisasi:</span>
                  <span className="font-bold text-blue-600">{paskaPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(paskaPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Submitted Prabayar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0">
                <Sparkles size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Submitted Prabayar
                </p>
                <h3 className="text-2xl font-black text-violet-800 leading-none">
                  {formatNumber(stats.totalPraSubmitted)}
                </h3>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Rasio Realisasi:</span>
                  <span className="font-bold text-violet-600">{praPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-violet-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(praPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel: Search, Filter, Sort */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-inner"
                />
              </div>

              {/* Filter & Sort controls */}
              <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                {/* Filter by Service Type */}
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => {
                    setServiceTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="all">Semua Layanan</option>
                  <option value="paskabayar">Paskabayar Saja</option>
                  <option value="prabayar">Prabayar Saja</option>
                </select>

                {/* Filter by performance */}
                <select
                  value={performanceFilter}
                  onChange={(e) => {
                    setPerformanceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                    onClick={() => toggleSort("name")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === "name"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Nama
                    {sortBy === "name" && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort("total_submitted")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === "total_submitted"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Total
                    {sortBy === "total_submitted" && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort("paska_submitted")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === "paska_submitted"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Paskabayar
                    {sortBy === "paska_submitted" && <ArrowUpDown size={12} />}
                  </button>
                  <button
                    onClick={() => toggleSort("pra_submitted")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      sortBy === "pra_submitted"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Prabayar
                    {sortBy === "pra_submitted" && <ArrowUpDown size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Recap Cards */}
          <div className="md:hidden space-y-3">
            {paginatedOfficers.map((o) => {
              const style = getPerformanceBadge(o.paskaRealisasi);
              const paskaPercentage = (o.paskaRealisasi * 100).toFixed(1);
              const mobileCardKey = (o.nama || "").trim().toUpperCase();
              const isExpanded = expandedMobileCard === mobileCardKey;

              return (
                <div
                  key={o.no}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4 transition-all duration-200 active:scale-[0.99]"
                >
                  <button
                    type="button"
                    onClick={() => toggleMobileCard(mobileCardKey)}
                    className="w-full text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {o.no === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-yellow-950 border border-yellow-200/50 shadow-md animate-gold-shine shrink-0">
                                1
                              </span>
                            ) : o.no === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 text-slate-900 border border-slate-200/50 shadow-md animate-silver-sway shrink-0">
                                2
                              </span>
                            ) : o.no === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 text-amber-50 border border-amber-500/30 shadow-md animate-bronze-pulse shrink-0">
                                3
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 shrink-0">
                                {o.no}
                              </span>
                            )}
                            <p className="font-bold text-slate-800 leading-snug truncate">
                              {o.nama}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 pl-8 truncate">
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate">{o.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {o.hasPaska && (
                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold border ${style.bg}`}
                          >
                            {style.label}
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          className={`text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <p className="text-slate-400 uppercase tracking-wider font-bold">
                          Total
                        </p>
                        <p className="text-sm font-extrabold text-slate-800 mt-1">
                          {formatNumber(o.totalSubmitted)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                        <p className="text-blue-800 uppercase tracking-wider font-bold">
                          Paska
                        </p>
                        <p className="text-sm font-extrabold text-blue-800 mt-1">
                          {o.hasPaska ? formatNumber(o.paskaSubmitted) : "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                        <p className="text-violet-800 uppercase tracking-wider font-bold">
                          Pra
                        </p>
                        <p className="text-sm font-extrabold text-violet-800 mt-1">
                          {o.hasPra ? formatNumber(o.praSubmitted) : "-"}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
                      isExpanded
                        ? "max-h-[600px] opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 -translate-y-2"
                    }`}
                    aria-hidden={!isExpanded}
                  >
                    <div className="space-y-3 pt-1 pb-1">
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                          <p className="font-bold text-blue-800 uppercase tracking-wider text-[10px] mb-2">
                            Paskabayar
                          </p>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between gap-2">
                              <span>Open</span>
                              <span className="font-semibold">
                                {o.hasPaska ? formatNumber(o.paskaOpen) : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span>Submitted</span>
                              <span className="font-semibold">
                                {o.hasPaska
                                  ? formatNumber(o.paskaSubmitted)
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span>Rejected</span>
                              <span className="font-semibold">
                                {o.hasPaska
                                  ? formatNumber(o.paskaRejected)
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2 pt-1 border-t border-blue-100">
                              <span>Realisasi</span>
                              <span
                                className={`font-extrabold ${style.textColor}`}
                              >
                                {o.hasPaska ? `${paskaPercentage}%` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                          <p className="font-bold text-violet-800 uppercase tracking-wider text-[10px] mb-2">
                            Prabayar
                          </p>
                          <div className="space-y-1.5 text-slate-600">
                            <div className="flex justify-between gap-2">
                              <span>Submitted</span>
                              <span className="font-semibold">
                                {o.hasPra ? formatNumber(o.praSubmitted) : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span>Rejected</span>
                              <span className="font-semibold">
                                {o.hasPra ? formatNumber(o.praRejected) : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2 pt-1 border-t border-violet-100">
                              <span>Total Submit</span>
                              <span className="font-extrabold text-violet-700">
                                {formatNumber(o.totalSubmitted)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Columns (I, J, K, L) */}
                      {(serviceTypeFilter === "paskabayar" || serviceTypeFilter === "prabayar") && (
                        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100/60 p-3 mt-1 text-[11px]">
                          <p className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] mb-2">
                            Kategori Kunjungan
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                            <div className="flex justify-between gap-1">
                              <span className="truncate text-slate-400">1. Berhasil</span>
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(serviceTypeFilter === "paskabayar" ? o.paskaColI : o.praColI)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="truncate text-slate-400">2. Rmh Kosong</span>
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(serviceTypeFilter === "paskabayar" ? o.paskaColJ : o.praColJ)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="truncate text-slate-400">3. Menolak</span>
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(serviceTypeFilter === "paskabayar" ? o.paskaColK : o.praColK)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="truncate text-slate-400">4. Mtr Tdk Ada</span>
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(serviceTypeFilter === "paskabayar" ? o.paskaColL : o.praColL)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {o.hasPaska && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>Progres Paskabayar</span>
                            <span className={`font-bold ${style.textColor}`}>
                              {paskaPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${style.progressBarBg} h-1.5 rounded-full transition-all duration-500`}
                              style={{
                                width: `${Math.min(paskaPercentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unified Dual-Header Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className={`w-full text-left border-collapse ${serviceTypeFilter === "all" ? "min-w-[900px]" : "min-w-[800px]"}`}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th
                      rowSpan="2"
                      className={`py-4 px-2 text-center border-r border-slate-200 text-[11px] leading-tight ${serviceTypeFilter === "all" ? "w-16" : "w-12"}`}
                    >
                      Peringkat
                      <span className="block text-[9px] font-normal text-slate-400 normal-case mt-0.5">
                        (Total Submit)
                      </span>
                    </th>
                    <th
                      rowSpan="2"
                      className={`py-4 border-r border-slate-200 ${serviceTypeFilter === "all" ? "px-6 w-64" : "px-3 w-48"}`}
                    >
                      Identitas Petugas
                    </th>
                    {serviceTypeFilter === "all" && (
                      <>
                        <th
                          colSpan="4"
                          className="py-2.5 px-4 text-center bg-blue-50/50 text-blue-800 border-r border-b border-blue-100 font-extrabold"
                        >
                          Paskabayar (Postpaid)
                        </th>
                        <th
                          colSpan="2"
                          className="py-2.5 px-4 text-center bg-violet-50/50 text-violet-800 border-b border-violet-100 font-extrabold"
                        >
                          Prabayar (Prepaid)
                        </th>
                      </>
                    )}
                    {serviceTypeFilter === "paskabayar" && (
                      <>
                        <th
                          colSpan="4"
                          className="py-2.5 px-4 text-center bg-blue-50/50 text-blue-800 border-r border-b border-blue-100 font-extrabold"
                        >
                          Kinerja Paskabayar
                        </th>
                        <th
                          colSpan="4"
                          className="py-2.5 px-4 text-center bg-emerald-50/50 text-emerald-800 border-b border-emerald-100 font-extrabold"
                        >
                          Kategori Kunjungan (I - L)
                        </th>
                      </>
                    )}
                    {serviceTypeFilter === "prabayar" && (
                      <>
                        <th
                          colSpan="2"
                          className="py-2.5 px-4 text-center bg-violet-50/50 text-violet-800 border-r border-b border-violet-100 font-extrabold"
                        >
                          Kinerja Prabayar
                        </th>
                        <th
                          colSpan="4"
                          className="py-2.5 px-4 text-center bg-emerald-50/50 text-emerald-800 border-b border-emerald-100 font-extrabold"
                        >
                          Kategori Kunjungan (I - L)
                        </th>
                      </>
                    )}
                  </tr>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {serviceTypeFilter === "all" && (
                      <>
                        <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Open</th>
                        <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Submitted</th>
                        <th className="py-3 px-4 text-center border-r border-slate-100 bg-blue-50/10">Rejected</th>
                        <th className="py-3 px-4 text-center border-r border-slate-200 bg-blue-50/10">Realisasi %</th>
                        <th className="py-3 px-4 text-center border-r border-slate-100 bg-violet-50/10">Submitted</th>
                        <th className="py-3 px-4 text-center bg-violet-50/10">Rejected</th>
                      </>
                    )}
                    {serviceTypeFilter === "paskabayar" && (
                      <>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-blue-50/10">Open</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-blue-50/10">Submitted</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-blue-50/10">Rejected</th>
                        <th className="py-3 px-2 text-center border-r border-slate-200 bg-blue-50/10">Realisasi</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Berhasil</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Rmh Kosong</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Menolak</th>
                        <th className="py-3 px-2 text-center bg-emerald-50/10">Mtr Tdk Ada</th>
                      </>
                    )}
                    {serviceTypeFilter === "prabayar" && (
                      <>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-violet-50/10">Submitted</th>
                        <th className="py-3 px-2 text-center border-r border-slate-200 bg-violet-50/10">Rejected</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Berhasil</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Rmh Kosong</th>
                        <th className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">Menolak</th>
                        <th className="py-3 px-2 text-center bg-emerald-50/10">Mtr Tdk Ada</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedOfficers.length > 0 ? (
                    paginatedOfficers.map((o, index) => {
                      const style = getPerformanceBadge(o.paskaRealisasi);
                      const paskaPercentage = (o.paskaRealisasi * 100).toFixed(
                        1,
                      );

                      return (
                        <tr
                          key={index}
                          className="group recap-table-row"
                        >
                          {/* Peringkat */}
                          <td className={`py-3.5 text-center font-bold text-slate-500 border-r border-slate-200 ${serviceTypeFilter === "all" ? "px-3" : "px-2"}`}>
                            {o.no === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-yellow-950 border border-yellow-200/50 shadow-md animate-gold-shine">
                                1
                              </span>
                            ) : o.no === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 text-slate-900 border border-slate-200/50 shadow-md animate-silver-sway">
                                2
                              </span>
                            ) : o.no === 3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 text-amber-50 border border-amber-500/30 shadow-md animate-bronze-pulse">
                                3
                              </span>
                            ) : (
                              o.no
                            )}
                          </td>

                          {/* Identitas */}
                          <td className={`py-3.5 border-r border-slate-200 ${serviceTypeFilter === "all" ? "px-6" : "px-3"}`}>
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <p className={`font-bold text-slate-800 leading-snug truncate group-hover:text-blue-700 transition-colors ${serviceTypeFilter !== "all" ? "text-[13px]" : ""}`}>
                                  {o.nama}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate group-hover:text-slate-500 transition-colors">
                                  <Mail size={11} className="shrink-0" />
                                  <span className="truncate">{o.email}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* If serviceTypeFilter is all, render both */}
                          {serviceTypeFilter === "all" && (
                            <>
                              {/* Paskabayar - Open */}
                              <td className="py-3.5 px-4 text-center font-medium text-slate-600 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaOpen) : "-"}
                              </td>

                              {/* Paskabayar - Submitted */}
                              <td className="py-3.5 px-4 text-center font-bold text-slate-700 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaSubmitted) : "-"}
                              </td>

                              {/* Paskabayar - Rejected */}
                              <td className="py-3.5 px-4 text-center font-medium text-rose-500 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaRejected) : "-"}
                              </td>

                              {/* Paskabayar - Realisasi % */}
                              <td className="py-3.5 px-4 border-r border-slate-200 bg-blue-50/5">
                                {o.hasPaska ? (
                                  <div className="flex flex-col items-center gap-1 w-full min-w-[120px]">
                                    <span
                                      className={`text-xs font-extrabold ${style.textColor}`}
                                    >
                                      {paskaPercentage}%
                                    </span>
                                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                      <div
                                        className={`${style.progressBarBg} h-1 rounded-full transition-all duration-500`}
                                        style={{
                                          width: `${Math.min(paskaPercentage, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-0.5 shrink-0 ${style.bg}`}
                                    >
                                      {style.label}
                                    </span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>

                              {/* Prabayar - Submitted */}
                              <td className="py-3.5 px-4 text-center font-bold text-slate-700 border-r border-slate-100 bg-violet-50/5">
                                {o.hasPra ? formatNumber(o.praSubmitted) : "-"}
                              </td>

                              {/* Prabayar - Rejected */}
                              <td className="py-3.5 px-4 text-center font-medium text-rose-500 bg-violet-50/5">
                                {o.hasPra ? formatNumber(o.praRejected) : "-"}
                              </td>
                            </>
                          )}

                          {/* If serviceTypeFilter is paskabayar */}
                          {serviceTypeFilter === "paskabayar" && (
                            <>
                              {/* Paskabayar - Open */}
                              <td className="py-3.5 px-2 text-center font-medium text-slate-600 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaOpen) : "-"}
                              </td>

                              {/* Paskabayar - Submitted */}
                              <td className="py-3.5 px-2 text-center font-bold text-slate-700 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaSubmitted) : "-"}
                              </td>

                              {/* Paskabayar - Rejected */}
                              <td className="py-3.5 px-2 text-center font-medium text-rose-500 border-r border-slate-100 bg-blue-50/5">
                                {o.hasPaska ? formatNumber(o.paskaRejected) : "-"}
                              </td>

                              {/* Paskabayar - Realisasi % */}
                              <td className="py-3.5 px-2 border-r border-slate-200 bg-blue-50/5">
                                {o.hasPaska ? (
                                  <div className="flex flex-col items-center gap-1 w-full min-w-[90px]">
                                    <span
                                      className={`text-xs font-extrabold ${style.textColor}`}
                                    >
                                      {paskaPercentage}%
                                    </span>
                                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                      <div
                                        className={`${style.progressBarBg} h-1 rounded-full transition-all duration-500`}
                                        style={{
                                          width: `${Math.min(paskaPercentage, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border mt-0.5 shrink-0 ${style.bg}`}
                                    >
                                      {style.label}
                                    </span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>

                              {/* Columns I, J, K, L details */}
                              <td className="py-3.5 px-2 text-center font-bold text-slate-700 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPaska ? formatNumber(o.paskaColI) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPaska ? formatNumber(o.paskaColJ) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPaska ? formatNumber(o.paskaColK) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 bg-emerald-50/5">
                                {o.hasPaska ? formatNumber(o.paskaColL) : "-"}
                              </td>
                            </>
                          )}

                          {/* If serviceTypeFilter is prabayar */}
                          {serviceTypeFilter === "prabayar" && (
                            <>
                              {/* Prabayar - Submitted */}
                              <td className="py-3.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200 bg-violet-50/5">
                                {o.hasPra ? formatNumber(o.praSubmitted) : "-"}
                              </td>

                              {/* Prabayar - Rejected */}
                              <td className="py-3.5 px-2 text-center font-medium text-rose-500 border-r border-slate-200 bg-violet-50/5">
                                {o.hasPra ? formatNumber(o.praRejected) : "-"}
                              </td>

                              {/* Columns I, J, K, L details */}
                              <td className="py-3.5 px-2 text-center font-bold text-slate-700 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPra ? formatNumber(o.praColI) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPra ? formatNumber(o.praColJ) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 border-r border-slate-100 bg-emerald-50/5">
                                {o.hasPra ? formatNumber(o.praColK) : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-slate-600 bg-emerald-50/5">
                                {o.hasPra ? formatNumber(o.praColL) : "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={serviceTypeFilter === "all" ? 8 : serviceTypeFilter === "paskabayar" ? 10 : 8}
                        className="py-12 text-center text-slate-400 font-medium"
                      >
                        Tidak ada petugas yang cocok dengan kriteria pencarian
                        atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between flex-col sm:flex-row gap-3">
                <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      processedOfficers.length,
                      (currentPage - 1) * itemsPerPage + 1,
                    )}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      processedOfficers.length,
                      currentPage * itemsPerPage,
                    )}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-700">
                    {processedOfficers.length}
                  </span>{" "}
                  petugas
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 disabled:opacity-55 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="sm:hidden text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm min-w-[56px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 border-blue-600"
                            : "border border-slate-200 bg-white text-slate-650 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 disabled:opacity-55 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
