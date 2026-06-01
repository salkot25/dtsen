import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * PWAInstallBanner – mendeteksi event `beforeinstallprompt` yang dikirim browser
 * dan menampilkan undangan instalasi berformat toast premium untuk meningkatkan
 * konversi instalasi petugas ke layar utama perangkat mereka.
 *
 * Komponen ini hanya muncul satu kali per sesi (dikontrol dengan sessionStorage)
 * dan secara otomatis menghilang setelah aplikasi berhasil diinstal.
 */
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah dismiss/install sebelumnya hari ini
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (dismissed) return;

    // Deteksi apakah sudah diinstal (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Tunda prompt native browser agar kita bisa kustom prompt sendiri
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Tampilkan prompt instalasi browser bawaan
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsVisible(false);
    }

    setDeferredPrompt(null);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Ingat dismiss selama sesi ini sehingga tidak terus muncul
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="pwa-install-banner md:hidden">
      <div className="bg-white rounded-2xl shadow-2xl shadow-blue-500/15 border border-slate-100 p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="p-2.5 bg-blue-600 rounded-xl shrink-0">
          <Smartphone size={18} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">Instal ke Layar Utama</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Akses lebih cepat, bekerja luring, dan terlihat seperti aplikasi native.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Download size={13} />
            Instal
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
