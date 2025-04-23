## ✅ Available Commands

### 📦 Output Reports (Syntax)

```js
generateUpdateReport(type = "{type}", scope = "{scope}", exclude = []);
```

### ⚙️ Report Types

```js
type =
  "csv"       // Comma-separated values
  "table"     // ASCII table
  "jira"      // JIRA table format
  "composer"  // Composer require commands
  "modules"   // Drush commands to enable/uninstall modules
  "git"       // Git commit messages
  "json"      // JSON format (useful for scripting)
  "pantheon"  // Generates a Pantheon URL
```

### 🔎 Filter Options

```js
scope =
  "all"         // All updates (default)
  "security"    // Security updates only
  "unsupported" // Unsupported updates only
```

### 🚫 Exclude Modules (Optional)

```js
generateUpdateReport("add_exclude", "module_name");
// Adds "module_name" to the exclusion list

generateUpdateReport("remove_exclude", "module_name");
// Removes "module_name" from the exclusion list

generateUpdateReport("exclude_list");
// Displays all currently excluded modules
```

### 📌 Examples

```js
generateUpdateReport("csv", "security", ["module_name1", "module_name2"]);
// Generates a CSV report of security updates only, excluding module_name1 and module_name2.

generateUpdateReport("table", "all", ["module_name1"]);
// Generates an ASCII table report of all available updates, excluding module_name1.

generateUpdateReport("jira", "security");
// Generates a JIRA table report of security updates only.

generateUpdateReport("composer", "all");
// Generates composer require commands for all available updates.

generateUpdateReport("modules", "all");
// Generates drush commands to enable/uninstall modules.

generateUpdateReport("git", "security");
// Generates git commit messages for security updates only.

generateUpdateReport("pantheon");
// Generates a Pantheon URL for the dev environment.

generateUpdateReport("pantheon", "test");
// Generates a Pantheon URL for the test environment.