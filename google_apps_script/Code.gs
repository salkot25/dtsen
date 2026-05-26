function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // Login Router
    if (data.action === "login") {
      var userSheet = ss.getSheetByName('Users');
      if (!userSheet) {
        // Auto create users sheet for testing
        userSheet = ss.insertSheet('Users');
        userSheet.appendRow(['Username', 'Password', 'Role']);
        userSheet.appendRow(['admin', 'salkot123', 'Administrator']);
      }
      
      var usersData = userSheet.getDataRange().getValues();
      for (var i = 1; i < usersData.length; i++) {
        if (usersData[i][0] == data.username && usersData[i][1] == data.password) {
          return ContentService.createTextOutput(JSON.stringify({ 
            status: "success", 
            user: { username: data.username, role: usersData[i][2] || 'User' } 
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Username atau Password salah." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Simpan Pengaturan Router
    if (data.action === "save_settings") {
      var settingsSheet = ss.getSheetByName('Settings');
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet('Settings');
      } else {
        settingsSheet.clear();
      }
      
      settingsSheet.appendRow(['Key', 'Value']);
      settingsSheet.appendRow(['startDate', data.settings.startDate]);
      settingsSheet.appendRow(['targetDate', data.settings.targetDate]);
      settingsSheet.appendRow(['startDayOfMonth', data.settings.startDayOfMonth]);
      settingsSheet.appendRow(['endDayOfMonth', data.settings.endDayOfMonth]);
      settingsSheet.appendRow(['totalTarget', data.settings.totalTarget]);
      settingsSheet.appendRow(['officerCount', data.settings.officerCount]);
      settingsSheet.appendRow(['excludeWeekends', data.settings.excludeWeekends]);
      settingsSheet.appendRow(['geminiApiKey', data.settings.geminiApiKey || '']);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Simpan Riwayat AI Router
    if (data.action === "save_ai_summary") {
      var aiSheet = ss.getSheetByName('Riwayat_AI');
      if (!aiSheet) {
        aiSheet = ss.insertSheet('Riwayat_AI');
        aiSheet.appendRow(['ID', 'Tanggal', 'Summary']);
      }
      
      var timestamp = new Date().getTime();
      var dateStr = new Date().toISOString();
      
      aiSheet.appendRow([timestamp, dateStr, data.summary]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ambil Riwayat Laporan AI
    if (data.action === "get_ai_history") {
      var aiSheet = ss.getSheetByName('Riwayat_AI');
      var aiHistory = [];
      
      if (aiSheet) {
        var aiData = aiSheet.getDataRange().getValues();
        if (aiData.length > 1) {
          for (var i = 1; i < aiData.length; i++) {
            var row = aiData[i];
            aiHistory.push({
              id: row[0],
              date: row[1],
              summary: row[2]
            });
          }
        }
        aiHistory.reverse(); // Terbaru di atas
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: aiHistory }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Simpan Laporan Router
    var sheet = ss.getSheetByName('Laporan');
    
    // Buat otomatis sheet Laporan jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet('Laporan');
      sheet.appendRow(['ID', 'Tanggal', 'Kumulatif', 'Harian']);
    }
    
    // Asumsi tabel memiliki Header:
    // Kolom A: ID (Timestamp string/number)
    // Kolom B: Tanggal (ISO String)
    // Kolom C: Nilai Realisasi Kumulatif
    sheet.appendRow([data.id, data.date, data.value, data.dailyAchieved]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", recorded: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Fungsi ini dipanggil ketika URL Web App diakses secara GET.
  // Digunakan untuk mengambil riwayat data yang sudah tersimpan.
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Fetch Settings
    var settingsSheet = ss.getSheetByName('Settings');
    var settingsObj = null;
    if (settingsSheet) {
      var sData = settingsSheet.getDataRange().getValues();
      if (sData.length > 1) {
        settingsObj = {};
        for (var j = 1; j < sData.length; j++) {
          settingsObj[sData[j][0]] = sData[j][1];
        }
        if (settingsObj.startDayOfMonth) {
          settingsObj.startDayOfMonth = parseInt(settingsObj.startDayOfMonth, 10);
        }
        if (settingsObj.endDayOfMonth) {
          settingsObj.endDayOfMonth = parseInt(settingsObj.endDayOfMonth, 10);
        }
        if (settingsObj.totalTarget) {
          settingsObj.totalTarget = parseInt(settingsObj.totalTarget, 10);
        }
        if (settingsObj.officerCount) {
          settingsObj.officerCount = parseInt(settingsObj.officerCount, 10);
        }
        if (settingsObj.excludeWeekends !== undefined) {
          settingsObj.excludeWeekends = settingsObj.excludeWeekends === 'true' || settingsObj.excludeWeekends === true;
        }
      }
    }

    // Fetch History
    var sheet = ss.getSheetByName('Laporan');
    var history = [];
    
    if (sheet) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      
      // Melewatkan baris pertama (index 0) yang diasumsikan sebagai Header tabel.
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        // Memeriksa agar baris kosong tidak terambil
        if (row[0] && row[1] && row[2]) {
          history.push({
            id: row[0],
            date: row[1],
            value: row[2],
            dailyAchieved: row[3] || 0
          });
        }
      }
      // Membalik array agar data terbaru berada di indeks pertama (Descending)
      history.reverse();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: history, settings: settingsObj }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
