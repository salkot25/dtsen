import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import DashboardOverview from './components/DashboardOverview';
import InputForm from './components/InputForm';
import HistoryTable from './components/HistoryTable';
import WhatsAppGenerator from './components/WhatsAppGenerator';
import { saveToSpreadsheet, fetchHistory } from './services/api';

const TOTAL_TARGET = 206533;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Real history fetched from GAS
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchHistory();
        setHistory(data);
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
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
          <DashboardOverview history={history} totalTarget={TOTAL_TARGET} />
        </div>
      )}

      {currentTab === 'input' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
             <div className="lg:col-span-1 flex flex-col gap-6">
                <InputForm onSubmit={handleSubmitRealisasi} lastCumulative={lastCumulative} />
                <HistoryTable history={history} />
             </div>
             <div className="lg:col-span-2">
                <WhatsAppGenerator history={history} totalTarget={TOTAL_TARGET} />
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
