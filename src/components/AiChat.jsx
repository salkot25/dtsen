import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, RefreshCw, MessageSquare, Plus, PanelLeftClose, PanelLeftOpen, X, Sparkles, BarChart2, Clock, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchChatHistory, saveChatMessage } from '../services/api';
import { sendChatMessage } from '../services/geminiService';
import { getRemainingWorkingDays, calculateDailyTarget } from '../utils/dateUtils';

const AiChat = ({ history, settings, isMobileSheet = false, onClose }) => {
  const [allMessages, setAllMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default tertutup di mobile
  
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

  // Buka sidebar secara default jika di desktop layar lebar
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

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
      
      const uniqueSessions = [];
      const sessionMap = new Map();
      
      data.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
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
    // Vibrasi taktil
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setInput('');
    
    let currentSession = activeSessionId;
    if (!currentSession) {
      currentSession = Date.now().toString();
      setActiveSessionId(currentSession);
    }
    
    // Update judul sesi obrolan jika ini pesan pertama
    const sessionMessages = allMessages.filter(m => m.session_id === currentSession);
    if (sessionMessages.length === 0) {
      let title = userMessage.substring(0, 25);
      if (userMessage.length > 25) title += '...';
      
      setSessions(prev => {
        const exists = prev.some(s => s.id === currentSession);
        if (exists) {
          return prev.map(s => s.id === currentSession ? { ...s, title } : s);
        } else {
          return [{ id: currentSession, title, date: new Date().toISOString() }, ...prev];
        }
      });
    }
    
    const newMsgObj = { id: Date.now(), role: 'user', text: userMessage, session_id: currentSession };
    setAllMessages(prev => [...prev, newMsgObj]);
    setIsLoading(true);

    // Simpan ke database spreadsheet secara asinkron
    saveChatMessage('user', userMessage, currentSession);

    try {
      // Ambil riwayat obrolan sesi saat ini untuk dikirim sebagai context
      const currentActiveMsgs = allMessages.filter(m => m.session_id === currentSession);
      const replyText = await sendChatMessage(settings.geminiApiKey, [...currentActiveMsgs, newMsgObj], userMessage, contextData);
      
      const aiMsgObj = { id: Date.now(), role: 'model', text: replyText, session_id: currentSession };
      setAllMessages(prev => [...prev, aiMsgObj]);
      
      // Simpan balasan AI ke database spreadsheet secara asinkron
      saveChatMessage('model', replyText, currentSession);

      // Getaran halus setelah balasan AI masuk
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch (error) {
      const errorMsg = { id: Date.now(), role: 'model', text: `**Error:** ${error.message}`, session_id: currentSession };
      setAllMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (queryText) => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    sendMessage(queryText);
  };

  if (isMobileSheet) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end select-none">
        
        {/* Dark Overlay Backdrop with Fade In */}
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 animate-fade-in"
          onClick={onClose}
        />
        
        {/* Bottom Modal Sheet with Slide Up */}
        <div 
          className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl shadow-2xl z-40 flex flex-col border-t border-slate-200/60 overflow-hidden animate-slide-up"
          style={{ height: '82dvh' }}
        >
          {/* Drag Handle Bar & Header */}
          <div className="flex flex-col items-center pt-2 px-4 pb-2 bg-slate-50 border-b border-slate-200/50 rounded-t-3xl shrink-0">
            {/* Swiper drag indicator */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mb-2.5" />
            
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-blue-600 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 tracking-tight">Asisten AI (DTSEN)</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={loadChatHistory}
                  disabled={isFetchingHistory}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Muat ulang riwayat"
                >
                  <RefreshCw size={15} className={isFetchingHistory ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* The Inner Chat Content Area */}
          <div className="flex-1 flex flex-row min-w-0 h-full overflow-hidden relative">
             {/* Sidebar Drawer (Sessions List) inside Modal Sheet */}
             {isSidebarOpen && (
               <div 
                 className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] z-[45] transition-opacity duration-300" 
                 onClick={() => setIsSidebarOpen(false)}
               />
             )}
             
             <div className={`absolute top-0 bottom-0 left-0 h-full w-60 bg-slate-50 border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-out z-50 ${isSidebarOpen ? 'translate-x-0 shadow-xl border-r border-slate-200/30' : '-translate-x-full'}`}>
               <div className="p-3 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
                 <button 
                   onClick={startNewChat}
                   className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2.5 rounded-xl transition-all shadow-sm font-bold text-[10px] active:scale-95 cursor-pointer"
                 >
                   <Plus size={14} /> Obrolan Baru
                 </button>
                 <button
                   type="button"
                   onClick={() => setIsSidebarOpen(false)}
                   className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                   aria-label="Tutup laci"
                 >
                   <X size={16} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {sessions.length === 0 && !isFetchingHistory && (
                   <p className="text-center text-[10px] text-slate-400 mt-4 px-2">Belum ada riwayat.</p>
                 )}
                 
                 {sessions.map(session => (
                   <button
                     key={session.id}
                     onClick={() => {
                       setActiveSessionId(session.id);
                       setIsSidebarOpen(false);
                     }}
                     className={`w-full text-left flex items-start gap-2 p-2.5 rounded-xl transition-all ${activeSessionId === session.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50 shadow-sm' : 'hover:bg-slate-100 text-slate-600 border border-transparent'}`}
                   >
                     <MessageSquare size={14} className={`mt-0.5 shrink-0 ${activeSessionId === session.id ? 'text-blue-600' : 'text-slate-400'}`} />
                     <div className="flex-1 min-w-0">
                       <p className="text-[11px] font-semibold truncate leading-tight">{session.title}</p>
                     </div>
                   </button>
                 ))}
               </div>
             </div>

             {/* Chat viewport area */}
             <div className="flex-1 flex flex-col min-w-0 h-full bg-white z-0">
               {/* Messages Area */}
               <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40 space-y-5">
                 {isFetchingHistory ? (
                   <div className="flex justify-center items-center h-full text-blue-500">
                     <Loader2 className="animate-spin" size={20} />
                   </div>
                 ) : activeMessages.length === 0 ? (
                   /* Welcome Screen inside Bottom Sheet */
                   <div className="flex flex-col items-center justify-center min-h-full py-4 px-2 text-center select-none max-w-sm mx-auto space-y-4 animate-in fade-in duration-300">
                     <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                       <Bot size={24} className="text-white" />
                     </div>
                     
                     <div>
                       <h3 className="text-xs font-black text-slate-800 tracking-tight">Halo, saya Asisten AI</h3>
                       <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                         Bagaimana saya bisa membantu memantau operasional DTSEN ULP Salatiga Kota hari ini?
                       </p>
                     </div>

                     {/* Quick Actions inside Sheet */}
                     <div className="grid grid-cols-1 gap-2 w-full text-left pt-1">
                       {[
                         {
                           title: "Analisis Tren Kinerja",
                           icon: <BarChart2 size={13} className="text-blue-600" />,
                           bg: "bg-blue-50/60 border-blue-100 hover:bg-blue-100/40",
                           query: "Bagaimana analisis tren pencapaian kumulatif realisasi kita saat ini dibandingkan dengan target harian dinamis?"
                         },
                         {
                           title: "Petugas Submitted Tertinggi",
                           icon: <Award size={13} className="text-amber-600" />,
                           bg: "bg-amber-50/60 border-amber-100 hover:bg-amber-100/40",
                           query: "Siapa saja 3 petugas dengan performa submitted tertinggi dan bagaimana kontribusi mereka terhadap target?"
                         },
                         {
                           title: "Rekomendasi Strategis",
                           icon: <Sparkles size={13} className="text-emerald-600" />,
                           bg: "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/40",
                           query: "Berikan 3 rekomendasi taktis operasional untuk ULP Salatiga Kota agar target pencapaian akhir periode dapat tercapai sukses."
                         }
                       ].map((item, idx) => (
                         <button
                           key={idx}
                           type="button"
                           onClick={() => handleQuickPrompt(item.query)}
                           className={`p-2.5 border rounded-xl flex items-center gap-2.5 text-slate-700 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.98] ${item.bg}`}
                         >
                           <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 shrink-0">
                             {item.icon}
                           </div>
                           <span className="text-[11px] font-bold leading-none tracking-tight">{item.title}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 ) : (
                   activeMessages.map((msg, idx) => (
                     <div key={msg.id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}>
                       <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                         {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                       </div>
                       <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed text-xs ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200/70 text-slate-700 rounded-tl-sm'}`}>
                         <div className={`prose prose-sm max-w-none text-[11px] md:text-xs ${msg.role === 'user' ? 'prose-invert font-semibold' : 'prose-blue'}`}>
                           <ReactMarkdown>{msg.text}</ReactMarkdown>
                         </div>
                       </div>
                     </div>
                   ))
                 )}
                 {isLoading && (
                   <div className="flex gap-3 flex-row animate-pulse">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                       <Bot size={13} />
                     </div>
                     <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl rounded-tl-sm p-3.5 flex items-center">
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

               {/* Input form */}
               <div className="p-3 border-t border-slate-200/80 bg-white shrink-0">
                 <form 
                   onSubmit={(e) => {
                     e.preventDefault();
                     sendMessage(input);
                   }} 
                   className="flex gap-2"
                 >
                   {/* Button to open sessions list inside bottom sheet */}
                   <button
                     type="button"
                     onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                     className={`p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200/80 transition-all shrink-0 cursor-pointer ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : ''}`}
                     aria-label="Riwayat"
                   >
                     <MessageSquare size={16} />
                   </button>
                   
                   <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder={settings.geminiApiKey ? "Tanya asisten..." : "API Key Kosong"}
                     disabled={isLoading || !settings.geminiApiKey}
                     className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-xs disabled:opacity-50 font-medium"
                   />
                   <button
                     type="submit"
                     disabled={isLoading || !input.trim() || !settings.geminiApiKey}
                     className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-md shadow-blue-500/10"
                     aria-label="Kirim"
                   >
                     <Send size={16} />
                   </button>
                 </form>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-146px)] md:h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative w-full">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 transition-opacity duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Drawer (Sessions List) */}
      <div className={`absolute md:static top-0 left-0 h-full w-68 bg-slate-50 border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-out z-40 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:w-0 md:border-0 md:shadow-none'}`}>
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl transition-all shadow-sm font-bold text-xs active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Obrolan Baru
          </button>
          
          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Tutup laci"
          >
            <X size={18} />
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
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${activeSessionId === session.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/50 shadow-sm' : 'hover:bg-slate-100 text-slate-600 border border-transparent'}`}
            >
              <MessageSquare size={16} className={`mt-0.5 shrink-0 ${activeSessionId === session.id ? 'text-blue-600' : 'text-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{session.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white z-0">
        
        {/* Chat Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all md:hidden shrink-0 ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : ''}`}
              aria-label="Toggle sessions menu"
            >
              <MessageSquare size={18} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hidden md:block shrink-0"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div>
              <h2 className="font-extrabold text-slate-800 flex items-center gap-2 text-xs md:text-sm">
                <Bot className="text-blue-600" size={18} /> Asisten AI
              </h2>
            </div>
          </div>
          <button 
            onClick={loadChatHistory}
            disabled={isFetchingHistory}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
            title="Muat ulang riwayat"
          >
            <RefreshCw size={16} className={isFetchingHistory ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Chat Messages viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/40 space-y-6">
          {isFetchingHistory ? (
            <div className="flex justify-center items-center h-full text-blue-500">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : activeMessages.length === 0 ? (
            /* Premium Native Landing Welcome Grid for Empty Sate */
            <div className="flex flex-col items-center justify-center min-h-full py-6 px-3 text-center select-none max-w-lg mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Bot size={28} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Asisten AI Pemantauan DTSEN</h3>
                <p className="text-[11px] text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed font-medium">
                  Tanyakan analisis operasional program, peringkat kinerja petugas, atau rekomendasi strategis secara langsung.
                </p>
              </div>

              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left pt-2">
                {[
                  {
                    title: "Tren Kinerja & Target",
                    desc: "Analisis tren pencapaian kumulatif & target harian saat ini.",
                    icon: <BarChart2 size={15} className="text-blue-600" />,
                    bg: "bg-blue-50/60 border-blue-100 hover:bg-blue-100/40 hover:border-blue-200",
                    query: "Bagaimana analisis tren pencapaian kumulatif realisasi kita saat ini dibandingkan dengan target harian dinamis?"
                  },
                  {
                    title: "Performa Petugas Terbaik",
                    desc: "Tampilkan 3 petugas dengan performa submitted tertinggi.",
                    icon: <Award size={15} className="text-amber-600" />,
                    bg: "bg-amber-50/60 border-amber-100 hover:bg-amber-100/40 hover:border-amber-200",
                    query: "Siapa saja 3 petugas dengan performa submitted tertinggi dan bagaimana kontribusi mereka terhadap target?"
                  },
                  {
                    title: "Estimasi Sisa Target",
                    desc: "Berapa sisa waktu kerja dan prognosa target sisa?",
                    icon: <Clock size={15} className="text-violet-600" />,
                    bg: "bg-violet-50/60 border-violet-100 hover:bg-violet-100/40 hover:border-violet-200",
                    query: "Berapa sisa waktu kerja, sisa target kumulatif, dan berapa target rata-rata harian baru untuk mencapai 100%?"
                  },
                  {
                    title: "Rekomendasi Operasional",
                    desc: "Minta 3 rekomendasi taktis peningkatan pencapaian.",
                    icon: <Sparkles size={15} className="text-emerald-600" />,
                    bg: "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/40 hover:border-emerald-200",
                    query: "Berikan 3 rekomendasi taktis operasional untuk ULP Salatiga Kota agar target pencapaian akhir periode dapat tercapai sukses."
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(item.query)}
                    className={`p-3 border.5 rounded-xl flex flex-col justify-between text-slate-700 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.01] hover:shadow-md active:scale-[0.98] ${item.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 shrink-0">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold leading-none tracking-tight">{item.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeMessages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-350`}>
                <div className={`flex-shrink-0 w-8.5 h-8.5 rounded-full flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3.5 shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-blue-600/5' : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-sm'}`}>
                  <div className={`prose prose-sm max-w-none text-xs md:text-sm ${msg.role === 'user' ? 'prose-invert font-semibold' : 'prose-blue'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3.5 flex-row animate-pulse">
              <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                <Bot size={15} />
              </div>
              <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5">
                <span className="flex gap-1">
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-slate-200/80 bg-white shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={settings.geminiApiKey ? "Ketik pesan Anda..." : "Masukkan API Key Gemini di Pengaturan"}
              disabled={isLoading || !settings.geminiApiKey}
              className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-xs md:text-sm disabled:opacity-50 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !settings.geminiApiKey}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-md shadow-blue-500/10"
              aria-label="Kirim pesan"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
