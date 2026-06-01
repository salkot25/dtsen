import { LayoutDashboard, FileInput, LogOut, Zap, FileText, Settings as SettingsIcon, Bot, Plus, Users } from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab, onLogout }) {
  // Coordinated global tabs list order (Nama, Total, Paskabayar, Prabayar sync)
  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'officer_recap', label: 'Rekap Petugas', icon: <Users size={20} /> },
    { id: 'input', label: 'Input Laporan', icon: <FileInput size={20} /> },
    { id: 'executive_summary', label: 'Ringkasan Kinerja', icon: <FileText size={20} /> },
    { id: 'ai_chat', label: 'Asisten AI', icon: <Bot size={20} /> },
    { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon size={20} /> },
  ];

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Top AppBar Header */}
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
        
        {/* AppBar Actions (Settings placed directly to the left of Logout) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('settings')}
            className={`p-2 rounded-xl transition-colors ${
              currentTab === 'settings' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            aria-label="Settings"
          >
            <SettingsIcon size={18} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded-xl transition-colors"
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

      {/* Mobile Bottom Navigation Bar (Dashboard, Petugas, Add, Ringkasan, Asisten AI) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/60 flex justify-around items-center px-2 py-1.5 z-30 pb-safe shadow-lg">
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
                className="flex flex-col items-center justify-center -translate-y-5.5 w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-650 text-white shadow-lg shadow-blue-500/35 border-4 border-white transition-all duration-300 active:scale-95 z-50 shrink-0 cursor-pointer"
                aria-label="Tambah Laporan"
              >
                <Plus size={22} />
              </button>
            );
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] transition-all duration-200 shrink-0 cursor-pointer ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-400'
              }`}
            >
              <div className={`p-0.5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                 {tab.icon}
              </div>
              <span className={`text-[9px] leading-none ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.id === 'overview' ? 'Dashboard' : 
                 tab.id === 'officer_recap' ? 'Petugas' : 
                 tab.id === 'executive_summary' ? 'Ringkasan' : 
                 tab.id === 'ai_chat' ? 'Asisten AI' : 
                 tab.label}
              </span>
              {isActive && <div className="w-3.5 h-0.5 bg-blue-600 rounded-full mt-0.5"></div>}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
