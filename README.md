# Drupal Update Report Tool (DURT)

The **Drupal Update Report Tool (DURT)** generates Drupal update reports directly from the Drupal `/admin/reports/updates` page without installing anything on your site.

It parses the update status table in the browser and produces structured output such as Composer commands, commit messages, CSV exports, JSON data, and module status reports.

The tool runs entirely **client-side** as a bookmarklet.

---

# Project Files

| File | Purpose |
|-----|-----|
| `full_report_tool.js` | Main readable version of the script |
| `bookmarklet.js` | Compiled bookmarklet version ready for use |

`bookmarklet.js` is automatically generated from `full_report_tool.js` using the watcher defined in `package.json`.

Most users only need the **bookmarklet.js** file.

---

# Installation

1. Open the file:

```
bookmarklet.js
```

2. Copy the entire contents of the file.

3. Create a new browser bookmark.

4. Paste the copied code into the **bookmark URL field**.

5. Navigate to the Drupal update report page:

```
/admin/reports/updates
```

6. Click the bookmark to launch DURT.

---

# Using DURT

When the bookmarklet runs, a **DURT control panel** appears on the page.

Use the panel buttons to generate output.

Available outputs include:

- Composer command
- Commit message
- ASCII report
- JSON data
- Composer JSON
- CSV report
- Module lists
- Module status reports

---

# Scope Filters

You can filter which updates are included:

- security
- update
- updatable
- unsupported
- current
- all

---

# Overrides

You can override versions manually.

Example:

```
drupal/webform=6.3.0
```

or JSON format:

```json
{
  "drupal/webform": "6.3.0"
}
```

Overrides replace the recommended version in generated output.

---

# Output Panel

Results appear in the DURT output panel and can be copied directly.

| Button | Function |
|------|------|
| Clear | Clears the output window |
| Copy | Copies the output to the clipboard |

---

# Requirements

- Modern browser with JavaScript enabled
- Access to the Drupal update report page

```
/admin/reports/updates
```

Compatible with:

- Drupal 8
- Drupal 9
- Drupal 10
- Drupal 11