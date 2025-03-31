🧰 Drupal Update Report Helper (generateUpdateReport)

This script helps Drupal developers generate clean, copy-pasteable reports of available module updates directly from the Drupal admin update status page (/admin/reports/updates).

It supports:
🧰 Drupal Update Report Helper (generateUpdateReport)

This script helps Drupal developers generate clean, copy-pasteable reports of available module updates directly from the Drupal admin update status page (/admin/reports/updates).

It supports:

✅ CSV exports

✅ ASCII tables for easy pasting into issues or documentation

✅ Composer require commands

✅ Git commit messages

✅ Bookmarklet for fast, on-the-fly access

✅ Exclusion of modules from reports (valid during current session only)

✅ Security-only filtering

✅ Drupal Core detection even when missing links

📦 Files

File

Description

full_report_tool.js

Full readable script (load manually in DevTools or embed)

bookmarklet.js

Bookmarklet version (paste into browser bookmarks)

🛠 How to Use

🖥 Full Script

Copy the contents of full_report_tool_in_memory_excludes.js

Paste into your browser’s DevTools console while on /admin/reports/updates

Use the generateUpdateReport(...) commands below

🔖 Bookmarklet

Open bookmarklet_in_memory_excludes.js

Copy the full javascript:(function(){...})(); code
Script .

Create a new bookmark in your browser

Paste the code into the URL field

Visit /admin/reports/updates and click the bookmark

✅ Available Commands

📦 Output Reports (Syntax)

generateUpdateReport(type = "csv", scope = "all");

🔍 Type Options:

"csv" (default): Download a CSV of all updates

"ascii": Print table of updates to console

"commit": Output Git-style commit message

"composer": Output a composer require command

🎯 Scope Options:

"all" (default): Include all updates

"security": Limit to security updates only

"excluded": Only show excluded modules

🔧 Exclude Modules (Session-only)

generateUpdateReport("add_exclude", "module_name");     // Add to exclusion list
generateUpdateReport("remove_exclude", "module_name");  // Remove from exclusion list
generateUpdateReport("exclude_list");                   // Show current exclusions

🧹 Help

generateUpdateReport("help");

💡 Notes

Exclusion list is reset on page reload — perfect for testing across multiple sites.

CSV export triggers automatic download with site name and date.

Composer output uses machine names from drupal.org project links.

8.x- version prefixes are cleaned for Composer compatibility.

Special characters in module names are safely quoted.

📅 Changelog

[v2.0.0] - Updated

Default output is now CSV instead of ASCII.

Added support for "excluded" filter.

Removed composer command generation for excluded modules.

Improved handling of exclusion lists.

[v1.0.0] - Initial Release

ASCII and CSV reports.

Security filtering.

Module exclusion handling.


✅ CSV exports

✅ ASCII tables for easy pasting into issues or documentation

✅ Composer require commands

✅ Git commit messages

✅ Bookmarklet for fast, on-the-fly access

✅ Exclusion of modules from reports (valid during current session only)

✅ Security-only filtering

✅ Drupal Core detection even when missing links

📦 Files

File

Description

full_report_tool.js

Full readable script (load manually in DevTools or embed)

bookmarklet.js

Bookmarklet version (paste into browser bookmarks)

🛠 How to Use

🖥 Full Script

Copy the contents of full_report_tool_in_memory_excludes.js

Paste into your browser’s DevTools console while on /admin/reports/updates

Use the generateUpdateReport(...) commands below

🔖 Bookmarklet

Open bookmarklet_in_memory_excludes.js

Copy the full javascript:(function(){...})(); code
Script .

Create a new bookmark in your browser

Paste the code into the URL field

Visit /admin/reports/updates and click the bookmark

✅ Available Commands

📦 Output Reports (Syntax)

generateUpdateReport(type = "csv", scope = "all");

🔍 Type Options:

"csv" (default): Download a CSV of all updates

"ascii": Print table of updates to console

"commit": Output Git-style commit message

"composer": Output a composer require command

🎯 Scope Options:

"all" (default): Include all updates

"security": Limit to security updates only

"excluded": Only show excluded modules

🔧 Exclude Modules (Session-only)

generateUpdateReport("add_exclude", "module_name");     // Add to exclusion list
generateUpdateReport("remove_exclude", "module_name");  // Remove from exclusion list
generateUpdateReport("exclude_list");                   // Show current exclusions

🧹 Help

generateUpdateReport("help");

💡 Notes

Exclusion list is reset on page reload — perfect for testing across multiple sites.

CSV export triggers automatic download with site name and date.

Composer output uses machine names from drupal.org project links.

8.x- version prefixes are cleaned for Composer compatibility.

Special characters in module names are safely quoted.

📅 Changelog

[v2.0.0] - Updated

Default output is now CSV instead of ASCII.

Added support for "excluded" filter.

Removed composer command generation for excluded modules.

Improved handling of exclusion lists.

[v1.0.0] - Initial Release

ASCII and CSV reports.

Security filtering.

Module exclusion handling.

