import { LayoutDashboard, FileInput, LogOut, Zap, FileText, Settings as SettingsIcon, Bot, Plus, Users } from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab, onLogout }) {
  // Coordinated global tabs list order (Enterprise UX standard)
  const tabs = [
    { id: 'overview',           label: 'Dashboard',         icon: <LayoutDashboard size={20} /> },
    { id: 'input',              label: 'Input Laporan',     icon: <FileInput size={20} /> },
    { id: 'officer_recap',      label: 'Rekap Petugas',     icon: <Users size={20} /> },
    { id: 'executive_summary',  label: 'Ringkasan Kinerja', icon: <FileText size={20} /> },
    { id: 'ai_chat',            label: 'Asisten AI',        icon: <Bot size={20} /> },
    { id: 'settings',           label: 'Pengaturan',        icon: <SettingsIcon size={20} /> },
  ];

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Top AppBar Header (Solid White, Not Transparent) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">DTSEN Salkot</h1>
            <p className="text-[10px] text-slate-400">{todayStr}</p>
          </div>
        </div>
        
        {/* AppBar Actions (Settings placed directly to the left of Logout, clear solid colors) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('settings')}
            className={`p-2 rounded-xl transition-colors ${
              currentTab === 'settings' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            aria-label="Settings"
          >
            <SettingsIcon size={18} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 rounded-xl transition-colors"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
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
      <div className={`flex-1 flex flex-col relative ${
        currentTab === 'ai_chat' 
          ? 'h-[calc(100dvh-52px)] overflow-hidden pb-[72px] md:h-screen md:pb-0' 
          : 'pb-20 md:pb-0 overflow-y-auto'
      }`}>
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
        <main className={`flex-1 ${currentTab === 'ai_chat' ? 'overflow-hidden h-full flex flex-col' : 'overflow-x-hidden'}`}>
          <div className={`w-full ${
            currentTab === 'ai_chat' 
              ? 'max-w-[1152px] mx-auto p-0 md:p-6 h-full flex flex-col' 
              : 'max-w-[1152px] mx-auto p-4 md:p-8'
          }`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Solid White, Solid and Clear Colors) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 flex justify-around items-center px-4 py-2 z-30 pb-safe shadow-xl">
        {[
          tabs.find(t => t.id === 'overview'),
          tabs.find(t => t.id === 'officer_recap'),
          tabs.find(t => t.id === 'input'),
          tabs.find(t => t.id === 'executive_summary'),
          tabs.find(t => t.id === 'ai_chat'),
        ].map((tab) => {
          if (!tab) return null;
          const isInput = tab.id === 'input';
          const isActive = currentTab === tab.id;
          
          if (isInput) {
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className="flex flex-col items-center justify-center -translate-y-5 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/35 border-4 border-white transition-all duration-300 active:scale-95 z-50 shrink-0 cursor-pointer animate-none"
                aria-label="Tambah Laporan"
              >
                <Plus size={24} />
              </button>
            );
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[64px] transition-all duration-200 shrink-0 cursor-pointer`}
            >
              <div className={`p-1 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 text-blue-600 font-bold' : 'text-slate-500'}`}>
                 {tab.icon}
              </div>
              <span className={`text-[10px] leading-none ${isActive ? 'font-bold text-blue-600' : 'font-semibold text-slate-500'}`}>
                {tab.id === 'overview' ? 'Dashboard' : 
                 tab.id === 'officer_recap' ? 'Petugas' : 
                 tab.id === 'executive_summary' ? 'Ringkasan' : 
                 tab.id === 'ai_chat' ? 'Asisten AI' : 
                 tab.label}
              </span>
              {isActive && <div className="w-4 h-0.5 bg-blue-600 rounded-full mt-1 animate-fade-in"></div>}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
