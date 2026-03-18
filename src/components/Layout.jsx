import React from 'react';
import { LayoutDashboard, FileInput, LogOut, Zap } from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab, onLogout }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'input', label: 'Input Laporan', icon: <FileInput size={20} /> },
  ];

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">DTSEN Salkot</h1>
            <p className="text-[10px] text-slate-400">{todayStr}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex-shrink-0 sticky top-0 h-screen">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">Monitoring DTSEN</h1>
              <p className="text-xs text-slate-400">ULP Salatiga Kota</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="h-px bg-slate-800"></div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60 mx-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                AD
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 leading-tight">Admin</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative pb-20 md:pb-0 overflow-y-auto">
        {/* Desktop Topbar */}
        <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-4 items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
            {tabs.find((t) => t.id === currentTab)?.label}
          </h2>
          <div className="text-xs text-slate-500 font-medium bg-slate-100/80 px-3.5 py-1.5 rounded-lg border border-slate-200/50">
            {todayStr}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[1152px] mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/60 flex justify-around px-6 py-2 z-30 pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl min-w-[72px] transition-all duration-200 ${
              currentTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            <div className={`p-1 mb-0.5 transition-transform duration-200 ${currentTab === tab.id ? 'scale-110' : ''}`}>
               {tab.icon}
            </div>
            <span className={`text-[10px] leading-none ${currentTab === tab.id ? 'font-semibold' : 'font-medium'}`}>
              {tab.label}
            </span>
            {currentTab === tab.id && <div className="w-4 h-0.5 bg-blue-600 rounded-full mt-1"></div>}
          </button>
        ))}
      </div>
    </div>
  );
}
