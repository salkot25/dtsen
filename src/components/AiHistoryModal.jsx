import React, { useState, useEffect } from 'react';
import { X, Clock, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchAiHistory } from '../services/api';

const AiHistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');
    setSelectedSummary(null);
    try {
      const data = await fetchAiHistory();
      setHistory(data);
    } catch (err) {
      setError('Gagal memuat riwayat. Pastikan Code.gs sudah diperbarui.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4`}>
      <div className="bg-white dark:bg-slate-900 shadow-xl flex flex-col overflow-hidden animate-slide-up transition-all duration-300 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="text-blue-500" /> Riwayat AI Insights
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Laporan terdahulu yang pernah digenerate oleh AI</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className={`border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-y-auto transition-all duration-300 ${isMaximized ? 'hidden' : 'w-1/3'}`}>
            {isLoading ? (
              <div className="p-8 flex justify-center text-blue-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-rose-500 text-center">{error}</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-sm text-slate-500 text-center">Belum ada riwayat laporan AI.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSummary(item)}
                    className={`w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors ${selectedSummary?.id === item.id ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Laporan #{item.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.date))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className={`p-6 overflow-y-auto bg-white dark:bg-slate-900 transition-all duration-300 ${isMaximized ? 'w-full' : 'w-2/3'}`}>
            {selectedSummary ? (
              <div className="prose prose-blue dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 text-sm">
                <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} /> Laporan AI: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedSummary.date))}
                  </div>
                  <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors text-indigo-500 dark:text-indigo-400 cursor-pointer"
                    title={isMaximized ? "Perkecil Detail" : "Perbesar Detail (Full Screen)"}
                  >
                    {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-6 mb-3 flex items-center gap-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-700 dark:text-slate-300" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                  }}
                >
                  {selectedSummary.summary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Clock size={48} className="mb-4 opacity-20" />
                <p>Pilih laporan dari daftar di sebelah kiri untuk melihat detailnya.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiHistoryModal;
