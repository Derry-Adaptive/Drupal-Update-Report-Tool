# 🧰 Drupal Update Report Helper (`generateUpdateReport`)

This script helps Drupal developers generate clean, copy-pasteable reports of available module updates directly from the Drupal admin update status page (`/admin/reports/updates`).

It supports:
- ✅ CSV exports
- ✅ ASCII tables for easy pasting into issues or documentation
- ✅ Composer require commands
- ✅ Git commit messages
- ✅ Bookmarklet for fast, on-the-fly access
- ✅ Exclusion of modules from reports (valid during current session only)
- ✅ Security-only filtering
- ✅ Drupal Core detection even when missing links

---

## 📦 Files

| File                              | Description                                                |
|-----------------------------------|------------------------------------------------------------|
| `full_report_tool.js` | Full readable script (load manually in DevTools or embed) |
| `bookmarklet.js`      | Bookmarklet version (paste into browser bookmarks)        |

---

## 🛠 How to Use

### 🖥 Full Script
1. Copy the contents of `full_report_tool_in_memory_excludes.js`
2. Paste into your browser’s DevTools console while on `/admin/reports/updates`
3. Use the `generateUpdateReport(...)` commands below

---

### 🔖 Bookmarklet
1. Open `bookmarklet_in_memory_excludes.js`
2. Copy the full `javascript:(function(){...})();` code
3. Create a new bookmark in your browser
4. Paste the code into the URL field
5. Visit `/admin/reports/updates` and click the bookmark

---

## ✅ Available Commands

### 📦 Output Reports (Syntax)

```js
generateUpdateReport(type = "csv", scope = "all");
```

### 🔍 Type Options:
- `"csv"` (default): Download a CSV of all updates
- `"ascii"`: Print table of updates to console
- `"commit"`: Output Git-style commit message
- `"composer"`: Output a `composer require` command

### 🎯 Scope Options:
- `"all"` (default): Include all updates
- `"security"`: Limit to security updates only

---

### 🔧 Exclude Modules (Session-only)
```js
generateUpdateReport("add_exclude", "module_name");     // Add to exclusion list
generateUpdateReport("remove_exclude", "module_name");  // Remove from exclusion list
generateUpdateReport("exclude_list");                   // Show current exclusions
```

---

### 🧹 Help
```js
generateUpdateReport("help");
```

---

## 💡 Notes

- Exclusion list is reset on page reload — perfect for testing across multiple sites.
- CSV export triggers automatic download with site name and date.
- Composer output uses machine names from drupal.org project links.
- `8.x-` version prefixes are cleaned for Composer compatibility.
- Special characters in module names are safely quoted.

---

## 👥 Author

Script generated with ❤️ by [Your Name / Team].  
Open to contributions and improvements!
