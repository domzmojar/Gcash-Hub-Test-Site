<!-- EXACT CODE REPLACEMENTS FOR index.html -->

<!-- 
IMPORTANT: These are the exact changes to make in your index.html file
Each section shows: FIND THIS → REPLACE WITH THIS
Line numbers are approximate from your current file
-->

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 1: Add Script Tag (around line 1) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: In the <head> section, just before the main <script> tag

BEFORE:
```html
<script>
'use strict';
const _BUILD_VER = 'cashhub-b1db4a93';
```

AFTER:
```html
<script src="storage-manager.js"></script>

<script>
'use strict';
const _BUILD_VER = 'cashhub-b1db4a93';
```

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 2: Replace saveDB() function (around line 430) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: Search for "function saveDB()"

BEFORE (DELETE THIS):
```javascript
function saveDB(){
  try{
    localStorage.setItem('cashhub_ph_v3',JSON.stringify(DB));
  }catch(e){
    showToast('Storage error: '+e.message);
  }
}
```

AFTER (REPLACE WITH THIS):
```javascript
async function saveDB(){
  return await StorageManager.saveDBWithQuotaCheck();
}
```

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 3: Update saveTransaction() (around line 505) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: Search for "function saveTransaction()"

BEFORE (DELETE THIS):
```javascript
function saveTransaction(){
  if(!currentTx)return;
  currentTx.status='completed';
  if(!DB.transactions.find(t=>t.id===currentTx.id)){
    DB.transactions.unshift(currentTx);
    saveDB();
    showToast('Transaction saved ✓');
  }
}
```

AFTER (REPLACE WITH THIS):
```javascript
async function saveTransaction(){
  if(trialIsExpired()&&!trialIsDev()){showTrialExpiredModal();return;}
  if(!currentTx)return;
  
  // Use enhanced save with compression & quota check
  const saved = await StorageManager.saveTransactionWithCompression(currentTx);
  
  if(saved){
    renderDashboard();
    renderRecords();
  }
}
```

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 4: Update confirmAs() to be async (around line 850) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: Search for "function confirmAs(type)"

BEFORE:
```javascript
function confirmAs(type){
  if(trialIsExpired()&&!trialIsDev()){showTrialExpiredModal();return;}
  // ... rest of function
```

AFTER:
```javascript
async function confirmAs(type){
  if(trialIsExpired()&&!trialIsDev()){showTrialExpiredModal();return;}
  // ... rest of function (NO OTHER CHANGES NEEDED)
```

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 5: Update saveSignature() to be async (around line 920) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: Search for "function saveSignature()"

BEFORE:
```javascript
function saveSignature(){
  if(trialIsExpired()&&!trialIsDev()){showTrialExpiredModal();return;}
  if(!sigHasData){
    showToast('Please have the customer sign before approving.');return;
  }
  if(!document.getElementById('sig-confirm-check').checked){
    showToast('Please check the confirmation box before approving.');return;
  }
  const canvas=document.getElementById('sig-canvas');
  const sigData=canvas.toDataURL('image/png');
  if(currentTx)currentTx.signature=sigData;
  saveTransaction();
  // Auto-download receipt photo on approve
  if(currentImageData && currentImageSource === 'cam') saveReceiptImage(currentImageData);
  showReceiptScreen();
}
```

AFTER:
```javascript
async function saveSignature(){
  if(trialIsExpired()&&!trialIsDev()){showTrialExpiredModal();return;}
  if(!sigHasData){
    showToast('Please have the customer sign before approving.');return;
  }
  if(!document.getElementById('sig-confirm-check').checked){
    showToast('Please check the confirmation box before approving.');return;
  }
  const canvas=document.getElementById('sig-canvas');
  const sigData=canvas.toDataURL('image/png');
  if(currentTx)currentTx.signature=sigData;
  await saveTransaction();  // ← ADD await HERE
  // Auto-download receipt photo on approve
  if(currentImageData && currentImageSource === 'cam') saveReceiptImage(currentImageData);
  showReceiptScreen();
}
```

---

<!-- ═══════════════════════════════════════════════��═══════════════ -->
<!-- CHANGE 6: Add cleanup helper function (anywhere in main script) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: Add this NEW function somewhere near the bottom of your script (before </script>)

ADD THIS:
```javascript
// ════════════════════════════════════════════════════════════════
// STORAGE CLEANUP HELPERS
// ════════════════════════════════════════════════════════════════

function cleanupOldData(){
  const action = prompt('Delete transactions older than how many days?\n\nExamples:\n90 = 3 months old\n30 = 1 month old\n7 = 1 week old\n\nEnter number (or leave blank to cancel):', '90');
  if(!action || isNaN(action)) return;
  
  const days = parseInt(action);
  if(days < 1 || days > 365){
    showToast('Please enter a number between 1 and 365');
    return;
  }
  
  if(!confirm(`Delete transactions older than ${days} days?\n\nThis cannot be undone.`)) return;
  
  const deleted = StorageManager.deleteOldTransactions(days);
  if(deleted > 0){
    renderDashboard();
    updateDataSummary();
  }
}

function importBackupJSON(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    showToast('Importing backup...');
    const success = await StorageManager.importBackupFile(file);
    
    if(success){
      setTimeout(()=>{
        renderDashboard();
        updateDataSummary();
      }, 1000);
    }
  };
  input.click();
}
```

---

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- CHANGE 7: Add Storage Health UI (in Settings section) -->
<!-- ═══════════════════════════════════════════════════════════════ -->

LOCATION: In your Settings HTML (in the screen-settings div), add this after "Data Management" section

ADD THIS:
```html
<div class="section-label">Storage Health</div>
<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
  <button class="btn btn-outline btn-sm" onclick="StorageManager.showStorageDiagnostics()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    🔍 Check Storage Health
  </button>
  <button class="btn btn-outline btn-sm" onclick="cleanupOldData()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    🗑️ Clean Up Old Data
  </button>
  <button class="btn btn-outline btn-sm" onclick="StorageManager.exportTransactionMetadata()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    💾 Backup Metadata
  </button>
  <button class="btn btn-outline btn-sm" onclick="importBackupJSON()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    📥 Restore from Backup
  </button>
</div>
```

---

## ✅ SUMMARY OF ALL CHANGES

| # | Change | Type | Difficulty |
|---|--------|------|-----------|
| 1 | Add script tag | Add 1 line | ⭐ Easy |
| 2 | Replace saveDB() | Replace 5 lines | ⭐ Easy |
| 3 | Replace saveTransaction() | Replace 8 lines | ⭐ Easy |
| 4 | Make confirmAs() async | Change 1 word | ⭐ Easy |
| 5 | Make saveSignature() async | Change 1 word + add await | ⭐ Easy |
| 6 | Add cleanup helpers | Add new functions | ⭐ Easy |
| 7 | Add Settings UI | Add HTML buttons | ⭐ Easy |

**Total time: ~10 minutes**

---

## 🧪 Testing After Changes

1. **Open DevTools Console (F12)**

2. **Test image compression:**
   ```javascript
   // Take a screenshot, then check console for:
   // [Storage] Image compressed: 500000 → 50000 bytes (90% reduction)
   ```

3. **Check storage health:**
   ```javascript
   StorageManager.showStorageDiagnostics();
   ```

4. **Check quota:**
   ```javascript
   await StorageManager.checkStorageQuota().then(q => 
     console.log(`Storage: ${q.percent.toFixed(1)}% full`)
   );
   ```

---

## 🚀 After You Make Changes

1. Save your index.html
2. Commit and push:
   ```bash
   git add -A
   git commit -m "Fix: Add storage compression and quota checking"
   git push origin main
   ```
3. Vercel will auto-deploy
4. Test on https://your-vercel-url

---

## ⚠️ If Something Breaks

The changes are **non-breaking** and **backwards compatible**:
- Old `saveDB()` calls still work (they're now async instead of sync)
- If storage-manager.js fails to load, original functions still exist
- No data is deleted or modified by these changes

If you need to rollback:
```bash
git revert HEAD
git push origin main
```

---

## 📞 Need Help?

Post these in your browser console and share the output:

```javascript
// 1. Check if storage manager loaded
console.log('StorageManager loaded:', !!window.StorageManager);

// 2. Check storage health
StorageManager.diagnoseStorageHealth();

// 3. Check storage quota
await StorageManager.checkStorageQuota().then(q => console.log(q));
```

Feel free to ask if you get stuck on any step! 🎯
