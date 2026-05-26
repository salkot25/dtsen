import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchChatHistory, saveChatMessage } from '../services/api';
import { sendChatMessage } from '../services/geminiService';
import { getRemainingWorkingDays, calculateDailyTarget } from '../utils/dateUtils';

const AiChat = ({ history, settings }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);

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
  }, [messages]);

  const loadChatHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const data = await fetchChatHistory();
      // Data is oldest to newest if we don't reverse, wait fetchChatHistory doesn't reverse it, which is correct for chat.
      setMessages(data);
    } catch (err) {
      console.error("Gagal memuat riwayat chat", err);
    } finally {
      setIsFetchingHistory(false);
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
    
    // Optimistic UI update
    const newMsgObj = { id: Date.now(), role: 'user', text: userMessage };
    setMessages(prev => [...prev, newMsgObj]);
    setIsLoading(true);

    // Save to DB asynchronously
    saveChatMessage('user', userMessage);

    try {
      // Send to Gemini
      // Pass the current messages for context
      const replyText = await sendChatMessage(settings.geminiApiKey, messages, userMessage, contextData);
      
      const aiMsgObj = { id: Date.now(), role: 'model', text: replyText };
      setMessages(prev => [...prev, aiMsgObj]);
      
      // Save AI reply to DB
      saveChatMessage('model', replyText);
    } catch (error) {
      const errorMsg = { id: Date.now(), role: 'model', text: `**Error:** ${error.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Bot className="text-blue-500" /> Asisten AI
          </h2>
          <p className="text-xs text-slate-500">Tanya seputar data operasional dan draf pesan</p>
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
        {isFetchingHistory ? (
          <div className="flex justify-center items-center h-full text-blue-500">
            <Loader2 className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot size={32} className="text-blue-500" />
            </div>
            <p className="text-sm">Mulai percakapan dengan AI. Riwayat akan tersimpan otomatis.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
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
      <div className="p-4 border-t border-slate-200 bg-white">
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
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
