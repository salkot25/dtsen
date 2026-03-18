const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6QVLAceyGV1ZZ28dOmjOMHuNOc3tcAA9TmYYuC5_fwUtHT_3yATjtKYf2bGrY2pY9/exec';

export async function saveToSpreadsheet(data) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    console.warn('Backend URL belum di-set. Menggunakan simulasi lokal.');
    return new Promise((resolve) => setTimeout(() => resolve({ status: 'success' }), 800));
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      // Menggunakan text/plain untuk menghindari preflight CORS request pada Google Apps Script
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

export async function loginUser(username, password) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'salkot123') {
          resolve({ status: 'success', user: { username: 'admin', role: 'Mock Admin' } });
        } else {
          reject(new Error('Username atau Password salah'));
        }
      }, 800);
    });
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    const result = await response.json();
    if (result.status === 'success') {
      return result;
    }
    throw new Error(result.message);
  } catch (error) {
    throw error;
  }
}

export async function fetchHistory() {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    // Return mock data for local development if not connected
    return [
      { id: 4, date: new Date().toISOString(), value: 125000 },
      { id: 3, date: new Date(Date.now() - 86400000).toISOString(), value: 121500 },
      { id: 2, date: new Date(Date.now() - 86400000 * 2).toISOString(), value: 119000 },
      { id: 1, date: new Date(Date.now() - 86400000 * 3).toISOString(), value: 116200 },
      { id: 0, date: new Date(Date.now() - 86400000 * 4).toISOString(), value: 114000 },
    ];
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
    });
    const result = await response.json();
    if (result.status === 'success') {
      return result.data; // Ini array riwayat data terbaru di atas
    }
    throw new Error(result.message);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
