# Drupal Update Report Tool

This tool helps you generate a comprehensive report of Drupal module updates directly from the browser — without installing anything on your site. It parses the `/admin/reports/updates` page and offers flexible output formats and update commands.

Designed to be used as a **bookmarklet**, this script is compiled and minified separately and runs fully client-side in any modern browser.

---

## ✨ Features

- **Display Drupal Updates**: Scans all modules for status: current, update, security, unsupported.
- **Export Options**:
  - `ascii` — Print table-formatted report in console
  - `csv` — Download CSV with domain and date in filename
  - `json` — Output raw data
  - `commit` — Generate commit message format
  - `composer` — Output `composer require` command
- **Version Targeting**: Choose between `recommended` (default) or `latest` versions
- **Exclusion Controls**: Temporarily or persistently exclude modules
- **No Dependencies**: No server-side or API access required

---

## ⚙️ Requirements

- A modern browser with JavaScript enabled
- A Drupal site with accessible `/admin/reports/updates` page
- Works with Drupal 8, 9, 10, and 11

---

## 📎 Setup

### Option 1: Bookmarklet

1. **Compile** the `full_report_tool.js` using your minifier and URI encoder.
2. Create a new **browser bookmark**.
3. Paste the minified, encoded script into the **URL field**.
4. Click the bookmark while on `/admin/reports/updates`.

### Option 2: Manual Console Paste

1. Navigate to your Drupal site's `/admin/reports/updates`.
2. Open **Developer Tools** (F12 or Ctrl+Shift+I).
3. Paste the script into the **Console** tab.
4. Press Enter.

---

## 🔧 Usage Examples

You control the output using the global function `generateUpdateReport()`.

### Basic Outputs

```js
generateUpdateReport("ascii");         // Display ASCII table in console
generateUpdateReport("csv");           // Download CSV file
generateUpdateReport("json");          // Output raw JSON
generateUpdateReport("commit");        // Generate commit message
generateUpdateReport("composer");      // Output composer commands (recommended)
