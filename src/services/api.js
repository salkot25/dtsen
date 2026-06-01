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

export async function saveSettingsToSpreadsheet(settings) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    return new Promise((resolve) => setTimeout(() => resolve({ status: 'success' }), 500));
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'save_settings', settings }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function saveOfficersToSpreadsheet(officers, type) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    return new Promise((resolve) => setTimeout(() => resolve({ status: 'success' }), 500));
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'save_officers', officers, type }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving officers:', error);
    throw error;
  }
}

export async function fetchHistory() {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    // Return mock data for local development if not connected
    return {
      history: [
        { id: 4, date: new Date().toISOString(), value: 125000 },
        { id: 3, date: new Date(Date.now() - 86400000).toISOString(), value: 121500 },
        { id: 2, date: new Date(Date.now() - 86400000 * 2).toISOString(), value: 119000 },
        { id: 1, date: new Date(Date.now() - 86400000 * 3).toISOString(), value: 116200 },
        { id: 0, date: new Date(Date.now() - 86400000 * 4).toISOString(), value: 114000 },
      ],
      settings: null
    };
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
    });
    const result = await response.json();
    if (result.status === 'success') {
      return {
        history: result.data || [],
        settings: result.settings || null,
        officers: result.officers || null
      };
    }
    throw new Error(result.message);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export async function saveAiSummaryToSpreadsheet(summary) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    return new Promise((resolve) => setTimeout(() => resolve({ status: 'success' }), 500));
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'save_ai_summary', summary }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving AI summary:', error);
    throw error;
  }
}

export const fetchAiHistory = async () => {
  if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    throw new Error("URL Google Apps Script belum diatur");
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "get_ai_history" }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const result = await response.json();
    if (result.status === "success") {
      return result.data || [];
    }
    throw new Error(result.message || "Failed to load AI history");
  } catch (error) {
    console.error("Error fetching AI history:", error);
    throw error;
  }
};

export const saveChatMessage = async (role, message, sessionId = null) => {
  if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') return;

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ 
        action: "save_chat", 
        role: role,
        message: message,
        session_id: sessionId 
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
  }
};

export const fetchChatHistory = async () => {
  if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') return [];

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "get_chat" }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const result = await response.json();
    if (result.status === "success") {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
};
