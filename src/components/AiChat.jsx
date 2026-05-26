import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, RefreshCw, MessageSquare, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchChatHistory, saveChatMessage } from '../services/api';
import { sendChatMessage } from '../services/geminiService';
import { getRemainingWorkingDays, calculateDailyTarget } from '../utils/dateUtils';

const AiChat = ({ history, settings }) => {
  const [allMessages, setAllMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef(null);

  const activeMessages = allMessages.filter(m => m.session_id === activeSessionId);

  const contextData = getContextData();

  function getContextData() {
    const currentTotal = history.length > 0 ? history[0].value : 0;
    const remainingWork = settings.totalTarget - currentTotal;
    const remainingDays = getRemainingWorkingDays(settings);
    const dailyTarget = calculateDailyTarget(currentTotal, settings);
    
    const recentHistory = history.slice(0, 7);
    const recentAchieved = recentHistory.map((item, idx, arr) => {
      if (item.dailyAchieved !== undefined) return item.dailyAchieved;
      if (idx < arr.length - 1) return item.value - arr[idx + 1].value;
      return 0; 
    }).filter(val => val > 0);
    
    const avgRecent = recentAchieved.length > 0 
      ? Math.round(recentAchieved.reduce((a, b) => a + b, 0) / recentAchieved.length) 
      : 0;
    const maxRecent = recentAchieved.length > 0 ? Math.max(...recentAchieved) : 0;

    const isOnTrack = avgRecent >= dailyTarget;
    const isSlightlyBehind = avgRecent > 0 && avgRecent < dailyTarget;
    const statusLabel = isOnTrack ? "On Track" : isSlightlyBehind ? "Perlu Peningkatan" : "Perhatian Khusus";
    
    return {
      currentTotal,
      totalTarget: settings.totalTarget,
      remainingWork,
      remainingDays,
      dailyTarget,
      officerCount: settings.officerCount,
      targetPerOfficer: Math.ceil(dailyTarget / settings.officerCount),
      avgRecent,
      maxRecent,
      statusLabel
    };
  }

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const loadChatHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const data = await fetchChatHistory();
      setAllMessages(data);
      
      // Mengelompokkan berdasarkan session_id untuk mendapatkan daftar sesi unik
      const uniqueSessions = [];
      const sessionMap = new Map();
      
      data.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          // Cari pesan pertama (dari user) di sesi ini sebagai judul
          const firstUserMsg = data.find(m => m.session_id === msg.session_id && m.role === 'user');
          const titleMsgText = firstUserMsg ? firstUserMsg.text : (msg.role === 'user' ? msg.text : 'Obrolan AI');
          
          let title = titleMsgText.substring(0, 25);
          if (titleMsgText.length > 25) title += '...';
          if (msg.session_id === 'Riwayat Lama') title = 'Riwayat Chat Lama';
          
          const sessionObj = {
            id: msg.session_id,
            title: title,
            date: msg.date
          };
          sessionMap.set(msg.session_id, sessionObj);
          uniqueSessions.push(sessionObj);
        }
      });
      
      // Urutkan sesi terbaru di atas
      uniqueSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(uniqueSessions);
      
      if (uniqueSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(uniqueSessions[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat chat", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const startNewChat = () => {
    const newSessionId = Date.now().toString();
    setActiveSessionId(newSessionId);
    setSessions(prev => [
      { id: newSessionId, title: 'Obrolan Baru', date: new Date().toISOString() },
      ...prev
    ]);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false); // Tutup sidebar di HP saat buat chat baru
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    let currentSession = activeSessionId;
    if (!currentSession) {
      currentSession = Date.now().toString();
      setActiveSessionId(currentSession);
    }
    
    // Update judul sesi jika ini pesan pertama
    if (activeMessages.length === 0) {
      let title = userMessage.substring(0, 25);
      if (userMessage.length > 25) title += '...';
      setSessions(prev => prev.map(s => s.id === currentSession ? { ...s, title } : s));
    }
    
    const newMsgObj = { id: Date.now(), role: 'user', text: userMessage, session_id: currentSession };
    setAllMessages(prev => [...prev, newMsgObj]);
    setIsLoading(true);

    // Save to DB asynchronously
    saveChatMessage('user', userMessage, currentSession);

    try {
      // Pass the current active messages for context
      const replyText = await sendChatMessage(settings.geminiApiKey, activeMessages, userMessage, contextData);
      
      const aiMsgObj = { id: Date.now(), role: 'model', text: replyText, session_id: currentSession };
      setAllMessages(prev => [...prev, aiMsgObj]);
      
      // Save AI reply to DB
      saveChatMessage('model', replyText, currentSession);
    } catch (error) {
      const errorMsg = { id: Date.now(), role: 'model', text: `**Error:** ${error.message}`, session_id: currentSession };
      setAllMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 z-10" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar (Sessions List) */}
      <div className={`absolute md:static top-0 left-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-0'}`}>
        <div className="p-4 border-b border-slate-200">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 py-2.5 rounded-xl transition-all shadow-sm font-medium"
          >
            <Plus size={18} /> Chat Baru
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && !isFetchingHistory && (
            <p className="text-center text-xs text-slate-400 mt-4 px-2">Belum ada riwayat obrolan.</p>
          )}
          
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${activeSessionId === session.id ? 'bg-blue-100/50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <MessageSquare size={16} className={`mt-0.5 shrink-0 ${activeSessionId === session.id ? 'text-blue-500' : 'text-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white z-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors md:hidden"
            >
              <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hidden md:block"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                <Bot className="text-blue-500" size={20} /> Asisten AI
              </h2>
            </div>
          </div>
          <button 
            onClick={loadChatHistory}
            disabled={isFetchingHistory}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Muat ulang riwayat"
          >
            <RefreshCw size={18} className={isFetchingHistory ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
          {isFetchingHistory ? (
            <div className="flex justify-center items-center h-full text-blue-500">
              <Loader2 className="animate-spin" />
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot size={32} className="text-blue-500" />
              </div>
              <p className="text-sm">Mulai percakapan dengan AI. Riwayat akan tersimpan otomatis.</p>
            </div>
          ) : (
            activeMessages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'}`}>
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-blue'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-slate-200 bg-white shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={settings.geminiApiKey ? "Ketik pesan Anda di sini..." : "Masukkan API Key Gemini di Pengaturan"}
              disabled={isLoading || !settings.geminiApiKey}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !settings.geminiApiKey}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
