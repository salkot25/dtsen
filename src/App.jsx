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
import { RefreshCw, X } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dtsen_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dtsen_theme', theme);
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dtsen_auth_session') === 'true';
  });
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  useEffect(() => {
    async function loadData() {
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
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
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

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    const newEntry = {
      id: Date.now(),
      date: localDateStr,
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

    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={handleLogout} theme={theme} setTheme={setTheme}>
      {currentTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardOverview history={history} settings={settings} setCurrentTab={setCurrentTab} />
        </div>
      )}

      {currentTab === 'input' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_3fr_4fr] gap-6">
             <InputForm 
               onSubmit={handleSubmitRealisasi} 
               lastCumulative={lastCumulative} 
               onUploadOfficers={handleUploadOfficers} 
               officers={officers}
             />
             <HistoryTable 
               history={history} 
               selectedId={selectedHistoryId} 
               onSelectItem={(id) => setSelectedHistoryId(id === selectedHistoryId ? null : id)} 
             />
             <WhatsAppGenerator 
               history={history} 
               settings={settings} 
               selectedItem={history.find(h => h.id === selectedHistoryId)} 
             />
          </div>
        </div>
      )}

      {currentTab === 'officer_recap' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OfficerRecap officers={officers} settings={settings} />
        </div>
      )}

      {currentTab === 'executive_summary' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExecutiveSummary history={history} settings={settings} officers={officers} />
        </div>
      )}

      {currentTab === 'ai_chat' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 min-h-0 flex flex-col">
          <AiChat history={history} settings={settings} />
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Settings settings={settings} onSave={handleSaveSettings} />
        </div>
      )}
    </Layout>
    <PWAInstallBanner />
    </>
  );
}

export default App;
