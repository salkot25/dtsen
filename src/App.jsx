import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Layout from './components/Layout';
import Login from './components/Login';
import DashboardOverview from './components/DashboardOverview';
import InputForm from './components/InputForm';
import HistoryTable from './components/HistoryTable';
import WhatsAppGenerator from './components/WhatsAppGenerator';
import Settings from './components/Settings';
import ExecutiveSummary from './components/ExecutiveSummary';
import AiChat from './components/AiChat';
import OfficerRecap from './components/OfficerRecap';
import PWAInstallBanner from './components/PWAInstallBanner';
import defaultOfficers from './data/officers.json';
import { saveToSpreadsheet, fetchHistory, saveSettingsToSpreadsheet, saveOfficersToSpreadsheet } from './services/api';
import { RefreshCw, X, FileInput, FileSpreadsheet, Send } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dtsen_auth_session') === 'true';
  });
  const [currentTab, setCurrentTab] = useState('overview');
  const [previousTab, setPreviousTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mobileInputSubTab, setMobileInputSubTab] = useState('form'); // 'form' | 'history' | 'wa'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (newTab) => {
    if (currentTab !== 'ai_chat') {
      setPreviousTab(currentTab);
    }
    setCurrentTab(newTab);
  };

  // Service Worker update hook – auto-detects new version and lets user refresh
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setShowUpdateToast(true);
    },
    onOfflineReady() {
      // App is ready for offline use, no action needed
    },
  });

  // Online / offline status detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dtsen_settings');
    return saved ? JSON.parse(saved) : {
      startDate: '2026-01-01',
      targetDate: '2026-08-31',
      startDayOfMonth: 2,
      endDayOfMonth: 20,
      totalTarget: 206533,
      officerCount: 10,
      excludeSaturday: true,
      excludeSunday: true,
      geminiApiKey: ''
    };
  });

  const [officers, setOfficers] = useState(() => {
    const saved = localStorage.getItem('dtsen_officers');
    if (saved) return JSON.parse(saved);
    return defaultOfficers.map(o => ({ ...o, type: o.type || 'paskabayar' }));
  });

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dtsen_settings', JSON.stringify(newSettings));
    try {
      await saveSettingsToSpreadsheet(newSettings);
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
    }
  };

  const handleUploadOfficers = async (newOfficers, type) => {
    setOfficers(prev => {
      const filtered = prev.filter(o => o.type !== type);
      const combined = [
        ...filtered,
        ...newOfficers.map(o => ({ ...o, type }))
      ];
      localStorage.setItem('dtsen_officers', JSON.stringify(combined));
      return combined;
    });

    try {
      await saveOfficersToSpreadsheet(newOfficers, type);
    } catch (err) {
      console.error("Gagal menyimpan rekap petugas ke server:", err);
    }
  };
  
  // Real history fetched from GAS
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefreshData = async () => {
    try {
      const data = await fetchHistory();
      setHistory(data.history);
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings(data.settings);
        localStorage.setItem('dtsen_settings', JSON.stringify(data.settings));
      }
      if (data.officers && data.officers.length > 0) {
        setOfficers(data.officers);
        localStorage.setItem('dtsen_officers', JSON.stringify(data.officers));
      }
      // Haptic tactile feedback for supported mobile devices (vibration)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error("Gagal memperbarui data:", err);
      throw err;
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await handleRefreshData();
      } catch (err) {
        console.error("Gagal inisialisasi data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('dtsen_auth_session', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dtsen_auth_session');
    setCurrentTab('overview');
  };

  const handleSubmitRealisasi = async (newValue) => {
    const previousTotal = history.length > 0 ? history[0].value : 0;
    const dailyAchieved = newValue - previousTotal;

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      value: newValue,
      dailyAchieved: dailyAchieved
    };
    
    // Attempt save to sheet
    await saveToSpreadsheet(newEntry);

    // Optimistically update local state
    setHistory(prev => [newEntry, ...prev]);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const lastCumulative = history.length > 0 ? history[0].value : 0;
  const activeTabToRender = currentTab === 'ai_chat' && isMobile ? previousTab : currentTab;

  return (
    <>
    {/* Offline status banner */}
    {isOffline && (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></span>
        Mode Luring – Menampilkan data terakhir yang tersimpan
      </div>
    )}

    {/* PWA Update Toast */}
    {showUpdateToast && (
      <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-toast">
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shrink-0">
            <RefreshCw size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">Versi Baru Tersedia!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Muat ulang untuk mendapatkan pembaruan terbaru.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => updateServiceWorker(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded-lg transition-colors"
            >
              Muat Ulang
            </button>
            <button
              onClick={() => setShowUpdateToast(false)}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    )}

    <Layout currentTab={currentTab} setCurrentTab={handleTabChange} onLogout={handleLogout} onRefresh={handleRefreshData}>
      {activeTabToRender === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardOverview history={history} settings={settings} setCurrentTab={handleTabChange} />
        </div>
      )}

      {activeTabToRender === 'input' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          
          {/* Mobile-Only Segmented Control Tab Bar */}
          <div className="lg:hidden bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setMobileInputSubTab('form')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                mobileInputSubTab === 'form'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-700 active:scale-95'
              }`}
            >
              <FileInput size={14} />
              Form Input
            </button>
            <button
              onClick={() => setMobileInputSubTab('history')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                mobileInputSubTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-700 active:scale-95'
              }`}
            >
              <FileSpreadsheet size={14} />
              Riwayat
            </button>
            <button
              onClick={() => setMobileInputSubTab('wa')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                mobileInputSubTab === 'wa'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-700 active:scale-95'
              }`}
            >
              <Send size={14} />
              Generator WA
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* 1. Form Input: displayed on desktop OR when mobile tab is 'form' */}
             <div className={`${mobileInputSubTab === 'form' ? 'block animate-in fade-in duration-300' : 'hidden lg:block'}`}>
                <InputForm 
                  onSubmit={handleSubmitRealisasi} 
                  lastCumulative={lastCumulative} 
                  onUploadOfficers={handleUploadOfficers} 
                  officers={officers}
                />
             </div>
             
             {/* 2. History Table: displayed on desktop OR when mobile tab is 'history' */}
             <div className={`${mobileInputSubTab === 'history' ? 'block animate-in fade-in duration-300' : 'hidden lg:block'}`}>
                <HistoryTable 
                  history={history} 
                  selectedId={selectedHistoryId} 
                  onSelectItem={(id) => setSelectedHistoryId(id === selectedHistoryId ? null : id)} 
                />
             </div>

             {/* 3. WhatsApp Generator: displayed on desktop OR when mobile tab is 'wa' */}
             <div className={`${mobileInputSubTab === 'wa' ? 'block animate-in fade-in duration-300' : 'hidden lg:block'}`}>
                <WhatsAppGenerator 
                  history={history} 
                  settings={settings} 
                  selectedItem={history.find(h => h.id === selectedHistoryId)} 
                />
             </div>
          </div>
        </div>
      )}

      {activeTabToRender === 'officer_recap' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OfficerRecap officers={officers} settings={settings} />
        </div>
      )}

      {activeTabToRender === 'executive_summary' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExecutiveSummary history={history} settings={settings} officers={officers} />
        </div>
      )}

      {/* AI Chat (Desktop Only - inside layout main area) */}
      {currentTab === 'ai_chat' && !isMobile && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          <AiChat history={history} settings={settings} />
        </div>
      )}

      {activeTabToRender === 'settings' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Settings settings={settings} onSave={handleSaveSettings} />
        </div>
      )}
    </Layout>
    <PWAInstallBanner />

    {/* AI Chat Mobile Bottom Sheet - absolute position outside layout, on top of everything! */}
    {isMobile && (
      <div className={`transition-all duration-300 ${currentTab === 'ai_chat' ? 'visible z-[9999]' : 'invisible pointer-events-none'}`}>
        <AiChat 
          history={history} 
          settings={settings} 
          isMobileSheet={true} 
          onClose={() => handleTabChange(previousTab)} 
        />
      </div>
    )}
    </>
  );
}

export default App;
