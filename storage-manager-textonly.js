/**
 * CashHub PH Storage Manager - TEXT ONLY
 * Ultra-fast, ultra-reliable transaction recording
 * NO images, NO signatures, NO bloat
 * 
 * 1 text transaction = ~500 bytes
 * 1000 transactions = ~500KB (fits easily in localStorage)
 * 
 * Guaranteed reliability for merchants
 */

// ════════════════════════════════════════════════════════════════
// SIMPLE, FAST, RELIABLE SAVE
// ════════════════════════════════════════════════════════════════

/**
 * Save database to localStorage - SYNC (instant, no delays)
 * Text-only data = no compression needed
 * 
 * @returns {boolean} - true if successful
 */
function saveDBReliable() {
  try {
    const serialized = JSON.stringify(DB);
    const sizeKB = new Blob([serialized]).size / 1024;

    // Check size before saving (text-only is tiny)
    if (sizeKB > 4000) {
      // 4MB warning - text data shouldn't be this large
      console.warn('[Storage] Large data detected:', sizeKB + 'KB');
    }

    localStorage.setItem('cashhub_ph_v3', serialized);
    console.log(`[Storage] ✓ Saved ${sizeKB.toFixed(1)}KB`);
    return true;
  } catch (e) {
    // Handle errors explicitly
    if (e.name === 'QuotaExceededError') {
      console.error('[Storage] QUOTA EXCEEDED - Delete old transactions!', e);
      showToast('❌ STORAGE FULL! Delete transactions to save new ones.');
      return false;
    }
    if (e.name === 'SecurityError') {
      console.error('[Storage] Private mode or permission denied', e);
      showToast('⚠️ Cannot save - Private mode detected. Use normal mode.');
      return false;
    }
    console.error('[Storage] Unexpected error:', e);
    showToast('❌ Save failed: ' + e.message);
    return false;
  }
}

/**
 * Save transaction with instant, synchronous save
 * No compression, no images, no delays
 * 
 * @param {object} tx - Transaction object
 * @returns {boolean} - true if saved
 */
function saveTransactionReliable(tx) {
  try {
    if (!tx) return false;

    // Ensure no image data exists
    tx.imageData = null;
    tx.signature = null;
    tx.status = 'completed';
    tx.savedAt = new Date().toISOString();

    // Add to DB
    if (!DB.transactions.find((t) => t.id === tx.id)) {
      DB.transactions.unshift(tx);
    }

    // SAVE IMMEDIATELY
    const success = saveDBReliable();

    if (success) {
      console.log('[Storage] ✓ Transaction saved:', tx.txId);
      showToast('✓ Transaction saved securely');
      return true;
    } else {
      // Remove from DB if save failed
      DB.transactions = DB.transactions.filter((t) => t.id !== tx.id);
      console.error('[Storage] ✗ Transaction NOT saved');
      return false;
    }
  } catch (e) {
    console.error('[Storage] Save error:', e);
    showToast('❌ Error: ' + e.message);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
// STORAGE DIAGNOSTICS
// ════════════════════════════════════════════════════════════════

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check current storage usage
 */
function checkStorageUsage() {
  try {
    const stored = localStorage.getItem('cashhub_ph_v3');
    if (!stored) {
      return { size: '0 Bytes', count: 0, healthy: true };
    }

    const sizeBytes = new Blob([stored]).size;
    const parsed = JSON.parse(stored);

    return {
      size: formatBytes(sizeBytes),
      count: parsed.transactions ? parsed.transactions.length : 0,
      healthy: true,
      percent: (sizeBytes / (5 * 1024 * 1024)) * 100 // 5MB limit
    };
  } catch (e) {
    console.error('[Storage] Check failed:', e);
    return { size: 'Unknown', count: 0, healthy: false, error: e.message };
  }
}

/**
 * Show storage health in alert
 */
function showStorageHealth() {
  const usage = checkStorageUsage();
  let msg = '📊 Storage Status\n\n';
  msg += `Size: ${usage.size}\n`;
  msg += `Transactions: ${usage.count}\n`;
  msg += `Usage: ${usage.percent ? usage.percent.toFixed(1) + '%' : 'Unknown'}\n`;
  msg += usage.healthy ? '\n✅ All good!' : '\n⚠️ Check console for errors';
  alert(msg);
}

// ════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Delete transactions older than X days
 */
function deleteOldTransactions(daysOld = 90) {
  const before = DB.transactions.length;
  const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  DB.transactions = DB.transactions.filter((t) => {
    try {
      const txDate = new Date(t.date).getTime();
      return txDate > cutoffDate;
    } catch (e) {
      return true; // keep on error
    }
  });

  const deleted = before - DB.transactions.length;
  if (deleted > 0) {
    saveDBReliable();
    showToast(`🗑️ Deleted ${deleted} old transactions`);
    console.log(`[Storage] Deleted ${deleted} transactions older than ${daysOld} days`);
  }
  return deleted;
}

/**
 * Export all transactions as CSV (for backup/analysis)
 */
function exportCSV() {
  try {
    if (!DB.transactions || DB.transactions.length === 0) {
      showToast('No transactions to export');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Type',
      'Customer Name',
      'Phone',
      'Amount',
      'Fee',
      'Reference',
      'Status',
      'Notes'
    ];

    const rows = DB.transactions.map((t) => [
      new Date(t.date).toLocaleDateString('en-PH'),
      new Date(t.date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      t.type || '',
      t.name || '',
      t.phone || '',
      t.amount || '',
      t.fee || '',
      t.ref || '',
      t.status || 'completed',
      t.note || ''
    ]);

    // Create CSV content
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const str = String(cell || '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashhub_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`✓ Exported ${DB.transactions.length} transactions`);
    console.log('[Storage] CSV exported');
  } catch (e) {
    console.error('[Storage] Export error:', e);
    showToast('❌ Export failed: ' + e.message);
  }
}

/**
 * Export as JSON backup
 */
function exportJSON() {
  try {
    const backup = {
      version: 4, // Text-only version
      timestamp: new Date().toISOString(),
      transactions: DB.transactions,
      stats: {
        count: DB.transactions.length,
        total: DB.transactions.reduce((a, t) => a + (parseFloat(t.amount) || 0), 0),
        fees: DB.transactions.reduce((a, t) => a + (parseFloat(t.fee) || 0), 0)
      }
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashhub_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('✓ Backup exported');
    console.log('[Storage] JSON backup created');
  } catch (e) {
    console.error('[Storage] Backup error:', e);
    showToast('❌ Backup failed: ' + e.message);
  }
}

/**
 * Import backup
 */
function importBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);

        if (!backup.transactions || !Array.isArray(backup.transactions)) {
          showToast('Invalid backup file');
          return;
        }

        // Merge transactions
        const existingIds = new Set(DB.transactions.map((t) => t.txId));
        let imported = 0;

        backup.transactions.forEach((t) => {
          // Remove images from imported data
          t.imageData = null;
          t.signature = null;

          if (!existingIds.has(t.txId)) {
            DB.transactions.push(t);
            imported++;
          }
        });

        saveDBReliable();
        showToast(`✓ Imported ${imported} transactions`);
        console.log('[Storage] Import successful:', imported);
      } catch (err) {
        console.error('[Storage] Import error:', err);
        showToast('❌ Import failed: ' + err.message);
      }
    };
    reader.onerror = () => {
      showToast('❌ Could not read file');
    };
    reader.readAsText(file);
  };
  input.click();
}

// ════════════════════════════════════════════════════════════════
// EXPORT FOR GLOBAL USE
// ════════════════════════════════════════════════════════════════

window.StorageManager = {
  saveDBReliable,
  saveTransactionReliable,
  formatBytes,
  checkStorageUsage,
  showStorageHealth,
  deleteOldTransactions,
  exportCSV,
  exportJSON,
  importBackup
};
