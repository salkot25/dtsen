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
      settingsSheet.appendRow(['excludeSaturday', data.settings.excludeSaturday]);
      settingsSheet.appendRow(['excludeSunday', data.settings.excludeSunday]);
      
      // Simpan juga versi lama untuk kompatibilitas jika diperlukan
      var isBothExcluded = (data.settings.excludeSaturday && data.settings.excludeSunday);
      settingsSheet.appendRow(['excludeWeekends', isBothExcluded]);
      settingsSheet.appendRow(['geminiApiKey', data.settings.geminiApiKey || '']);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Simpan Rekap Petugas Router
    if (data.action === "save_officers") {
      var officersSheet = ss.getSheetByName('Rekap_Petugas');
      if (!officersSheet) {
        officersSheet = ss.insertSheet('Rekap_Petugas');
      }
      
      // Ensure we support at least columns up to P (index 15)
      var numColumns = Math.max(officersSheet.getLastColumn(), 16);
      
      var headerRow = [];
      if (officersSheet.getLastRow() > 0) {
        headerRow = officersSheet.getRange(1, 1, 1, numColumns).getValues()[0];
      } else {
        headerRow = ['no', 'nama', 'email', '', '', '', '', '', '', '', '', 'Total Open', 'Total Submitted', 'Total Rejected', 'type', 'realisasi'];
        officersSheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      }
      
      // Read existing rows
      var existingRows = [];
      if (officersSheet.getLastRow() > 1) {
        existingRows = officersSheet.getRange(2, 1, officersSheet.getLastRow() - 1, numColumns).getValues();
      }
      
      var uploadType = data.type || "paskabayar";
      
      // Map existing rows by Nama (index 1) case-insensitively to allow safe merging
      var rowMap = {};
      existingRows.forEach(function(row) {
        var nameKey = row[1] ? row[1].toString().trim().toLowerCase() : '';
        if (nameKey) {
          rowMap[nameKey] = row;
        }
      });
      
      // Process new officers uploaded
      for (var i = 0; i < data.officers.length; i++) {
        var o = data.officers[i];
        var nameKey = o.nama ? o.nama.toString().trim().toLowerCase() : '';
        if (!nameKey) continue;
        
        var row = rowMap[nameKey] || [];
        // Pad row array to match the total column count
        while (row.length < numColumns) {
          row.push('');
        }
        
        row[0] = o.no;
        row[1] = o.nama;
        row[2] = o.email || row[2] || '';
        
        // Open in Column L (index 11)
        row[11] = o.open;
        // Submitted in Column M (index 12)
        row[12] = o.submitted;
        // Rejected in Column N (index 13)
        row[13] = o.rejected;
        
        // Type in Column O (index 14)
        row[14] = uploadType;
        
        // Realisasi in Column P (index 15)
        var total = o.submitted + o.open + o.rejected;
        row[15] = total > 0 ? (o.submitted / total) : 0;
        
        rowMap[nameKey] = row;
      }
      
      // Convert map back to list preserving original rows ordering
      var allRows = [];
      var processedKeys = {};
      existingRows.forEach(function(origRow) {
        var nameKey = origRow[1] ? origRow[1].toString().trim().toLowerCase() : '';
        if (nameKey && rowMap[nameKey]) {
          allRows.push(rowMap[nameKey]);
          processedKeys[nameKey] = true;
        }
      });
      
      Object.keys(rowMap).forEach(function(key) {
        if (!processedKeys[key]) {
          allRows.push(rowMap[key]);
        }
      });
      
      // Sort by No (index 0)
      allRows.sort(function(a, b) {
        return (parseInt(a[0], 10) || 999) - (parseInt(b[0], 10) || 999);
      });
      
      // Write combined rows back to spreadsheet
      if (officersSheet.getLastRow() > 1) {
        officersSheet.getRange(2, 1, officersSheet.getLastRow() - 1, numColumns).clearContent();
      }
      
      if (allRows.length > 0) {
        officersSheet.getRange(2, 1, allRows.length, numColumns).setValues(allRows);
      }
      
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

    // Simpan Chat AI Router
    if (data.action === "save_chat") {
      var chatSheet = ss.getSheetByName('Riwayat_Chat');
      if (!chatSheet) {
        chatSheet = ss.insertSheet('Riwayat_Chat');
        chatSheet.appendRow(['ID', 'Role', 'Message', 'Tanggal', 'SessionID']);
      }
      
      var timestamp = new Date().getTime();
      var dateStr = new Date().toISOString();
      var sessionId = data.session_id || timestamp.toString(); // Gunakan timestamp sebagai fallback session_id
      
      chatSheet.appendRow([timestamp, data.role, data.message, dateStr, sessionId]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", chat_id: timestamp, session_id: sessionId }))
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

    // Ambil Riwayat Chat AI
    if (data.action === "get_chat") {
      var chatSheet = ss.getSheetByName('Riwayat_Chat');
      var chatHistory = [];
      
      if (chatSheet) {
        var chatData = chatSheet.getDataRange().getValues();
        if (chatData.length > 1) {
          // Melewatkan header
          for (var i = 1; i < chatData.length; i++) {
            var row = chatData[i];
            chatHistory.push({
              id: row[0],
              role: row[1],
              text: row[2],
              date: row[3],
              session_id: row[4] || "Riwayat Lama" // Fallback untuk data lama yang belum punya SessionID
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: chatHistory }))
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
          var val = sData[j][1];
          if (Object.prototype.toString.call(val) === '[object Date]') {
            var year = val.getFullYear();
            var month = ('0' + (val.getMonth() + 1)).slice(-2);
            var day = ('0' + val.getDate()).slice(-2);
            val = year + '-' + month + '-' + day;
          }
          settingsObj[sData[j][0]] = val;
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
        if (settingsObj.excludeSaturday !== undefined) {
          settingsObj.excludeSaturday = settingsObj.excludeSaturday === 'true' || settingsObj.excludeSaturday === true;
        }
        if (settingsObj.excludeSunday !== undefined) {
          settingsObj.excludeSunday = settingsObj.excludeSunday === 'true' || settingsObj.excludeSunday === true;
        }
        if (settingsObj.excludeWeekends !== undefined) {
          settingsObj.excludeWeekends = settingsObj.excludeWeekends === 'true' || settingsObj.excludeWeekends === true;
        }
      }
    }

    // Fetch Officers Recap
    var officersSheet = ss.getSheetByName('Rekap_Petugas');
    var officersList = null;
    if (officersSheet) {
      var oData = officersSheet.getDataRange().getValues();
      if (oData.length > 1) {
        officersList = [];
        for (var k = 1; k < oData.length; k++) {
          var row = oData[k];
          var openVal = (row.length > 11 && row[11] !== "") ? parseInt(row[11], 10) : (row.length > 3 ? parseInt(row[3], 10) : 0);
          var submittedVal = (row.length > 12 && row[12] !== "") ? parseInt(row[12], 10) : (row.length > 4 ? parseInt(row[4], 10) : 0);
          var rejectedVal = (row.length > 13 && row[13] !== "") ? parseInt(row[13], 10) : (row.length > 5 ? parseInt(row[5], 10) : 0);
          var typeVal = (row.length > 14 && row[14] !== "") ? row[14] : (row.length > 7 ? row[7] : "paskabayar");
          var realisasiVal = (row.length > 15 && row[15] !== "") ? parseFloat(row[15]) : (row.length > 6 ? parseFloat(row[6]) : 0);

          officersList.push({
            no: parseInt(row[0] || (k).toString(), 10),
            nama: row[1] || "",
            email: row[2] || "",
            open: isNaN(openVal) ? 0 : openVal,
            submitted: isNaN(submittedVal) ? 0 : submittedVal,
            rejected: isNaN(rejectedVal) ? 0 : rejectedVal,
            realisasi: isNaN(realisasiVal) ? 0 : realisasiVal,
            type: typeVal || "paskabayar"
          });
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
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      data: history, 
      settings: settingsObj,
      officers: officersList
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
