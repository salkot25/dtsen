import React, { useState, useEffect } from 'react';
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
import defaultOfficers from './data/officers.json';
import { saveToSpreadsheet, fetchHistory, saveSettingsToSpreadsheet, saveOfficersToSpreadsheet } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dtsen_auth_session') === 'true';
  });
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

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
    return saved ? JSON.parse(saved) : defaultOfficers;
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

  const handleUploadOfficers = async (newOfficers) => {
    setOfficers(newOfficers);
    localStorage.setItem('dtsen_officers', JSON.stringify(newOfficers));
    try {
      await saveOfficersToSpreadsheet(newOfficers);
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

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={handleLogout}>
      {currentTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardOverview history={history} settings={settings} setCurrentTab={setCurrentTab} />
        </div>
      )}

      {currentTab === 'input' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <InputForm 
               onSubmit={handleSubmitRealisasi} 
               lastCumulative={lastCumulative} 
               onUploadOfficers={handleUploadOfficers} 
             />
             <WhatsAppGenerator 
               history={history} 
               settings={settings} 
               selectedItem={history.find(h => h.id === selectedHistoryId)} 
             />
             <HistoryTable 
               history={history} 
               selectedId={selectedHistoryId} 
               onSelectItem={(id) => setSelectedHistoryId(id === selectedHistoryId ? null : id)} 
             />
          </div>
        </div>
      )}

      {currentTab === 'officer_recap' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OfficerRecap officers={officers} />
        </div>
      )}

      {currentTab === 'executive_summary' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExecutiveSummary history={history} settings={settings} />
        </div>
      )}

      {currentTab === 'ai_chat' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          <AiChat history={history} settings={settings} />
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Settings settings={settings} onSave={handleSaveSettings} />
        </div>
      )}
    </Layout>
  );
}

export default App;
