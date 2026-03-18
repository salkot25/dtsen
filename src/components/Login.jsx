import React, { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react';
import { loginUser } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await loginUser(username, password);
      // Wait for 200ms to allow smooth animation
      setTimeout(() => onLogin(response.user), 200);
    } catch (err) {
      setError(err.message || 'Gagal login. Periksa koneksi atau kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Aplikasi Monitoring DTSEN</h2>
          <p className="text-sm text-slate-500 mt-2">ULP Salatiga Kota</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-colors"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-colors"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
