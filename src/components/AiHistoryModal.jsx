import React, { useState, useEffect } from 'react';
import { X, Clock, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchAiHistory } from '../services/api';

const AiHistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500" /> Riwayat AI Insights
            </h2>
            <p className="text-sm text-slate-500 mt-1">Laporan terdahulu yang pernah digenerate oleh AI</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex justify-center text-blue-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-rose-500 text-center">{error}</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-sm text-slate-500 text-center">Belum ada riwayat laporan AI.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSummary(item)}
                    className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${selectedSummary?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="font-semibold text-slate-800 text-sm">Laporan #{item.id}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.date))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="w-2/3 p-6 overflow-y-auto bg-white">
            {selectedSummary ? (
              <div className="prose prose-blue max-w-none text-slate-700 text-sm">
                <div className="mb-6 pb-4 border-b border-slate-100 flex items-center gap-2 text-indigo-600 font-semibold">
                  <Sparkles size={18} /> Laporan AI: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedSummary.date))}
                </div>
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-900 mt-6 mb-3 flex items-center gap-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                  }}
                >
                  {selectedSummary.summary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
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
