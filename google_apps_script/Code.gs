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
    
    // Simpan Laporan Router
    var sheet = ss.getSheetByName('Laporan');
    
    // Buat otomatis sheet Laporan jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet('Laporan');
      sheet.appendRow(['ID', 'Tanggal', 'Kumulatif', 'Harian']);
    }
    var data = JSON.parse(e.postData.contents);
    
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
    var sheet = ss.getSheetByName('Laporan');
    
    // Jika belum ada sheet Laporan, kembalikan kosong
    if (!sheet) {
       return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    var history = [];
    
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
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: history }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
