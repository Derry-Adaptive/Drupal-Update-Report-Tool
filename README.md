# 🧰 Drupal Update Report Helper (`generateUpdateReport`)

This script helps Drupal developers generate clean, copy-pasteable reports of available module updates directly from the Drupal admin update status page (`/admin/reports/updates`).

It supports:
- ✅ CSV exports
- ✅ ASCII tables for easy pasting into issues or documentation
- ✅ Composer require commands
- ✅ Git commit messages
- ✅ Bookmarklet for fast, on-the-fly access
- ✅ Exclusion of modules from reports
- ✅ Security-only filtering
- ✅ Drupal Core detection even when missing links

---

## 📦 Files

| File                 | Description                                                |
|----------------------|------------------------------------------------------------|
| `full_report_tool.js` | Full readable script (load manually in DevTools or embed) |
| `bookmarklet.js`      | Bookmarklet version (paste URL into your browser’s bookmarks) |

---

## 🛠 How to Use

### 🖥 Full Script
1. Copy the contents of `full_report_tool.js`
2. Paste into your browser’s DevTools console while on `/admin/reports/updates`
3. Use the `generateUpdateReport(...)` commands below

---

### 🔖 Bookmarklet
1. Open `bookmarklet.js`
2. Copy the full `javascript:(function(){...})();` code
3. Create a new bookmark in your browser
4. Paste the code into the URL field
5. Visit `/admin/reports/updates` and click the bookmark

---

## ✅ Available Commands

### 📦 Output Reports
```js
generateUpdateReport();                        // CSV (default)
generateUpdateReport("csv", "security");       // CSV of security-only updates
generateUpdateReport("ascii");                 // ASCII table of all updates
generateUpdateReport("ascii", "security");     // ASCII table, security only
generateUpdateReport("commit");                // Git commit message
generateUpdateReport("commit", "security");    // Git commit message (security)
generateUpdateReport("composer");              // Composer require command
generateUpdateReport("composer", "security");  // Composer (security only)
