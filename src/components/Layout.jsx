import React from 'react';
import { LayoutDashboard, FileInput, LogOut } from 'lucide-react';

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
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="font-bold text-slate-900 text-lg">DTSEN Salkot</h1>
          <p className="text-xs text-slate-500">{todayStr}</p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white flex-shrink-0 sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Monitoring DTSEN</h1>
          <p className="text-sm text-slate-400 mt-1">ULP Salatiga Kota</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white font-medium shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Admin User</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        {/* Desktop Topbar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-5 items-center justify-between sticky top-0 z-10 transition-all">
          <h2 className="text-xl font-semibold text-slate-800">
            {tabs.find((t) => t.id === currentTab)?.label}
          </h2>
          <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-30 pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[80px] transition-colors ${
              currentTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className={`mb-1 ${currentTab === tab.id ? 'transform scale-110 transition-transform' : ''}`}>
               {tab.icon}
            </div>
            <span className={`text-[10px] ${currentTab === tab.id ? 'font-medium' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
