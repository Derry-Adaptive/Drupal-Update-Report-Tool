## ✅ Available Commands

### 📦 Output Reports (Syntax)

```js
generateUpdateReport(type = "{type}", scope = "{scope}", ticket = "{ticket}");
```

### ⚙️ Report Types

```js
type =
  "csv"       // Comma-separated values
  "table"     // ASCII table
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

### 🎫 Pantheon Ticket (Optional)

```js
ticket = "d1234" // Pantheon ticket number (max 11 chars)
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
generateUpdateReport("csv", "security");
// Generates a CSV report of security updates only.

generateUpdateReport("table", "all");
// Generates an ASCII table report of all available updates.

generateUpdateReport("composer", "all");
// Generates composer require commands for all available updates.

generateUpdateReport("modules", "all");
// Generates drush commands to enable/uninstall modules.

generateUpdateReport("git", "security");
// Generates git commit messages for security updates only.

generateUpdateReport("pantheon", "", "d1234");
// Generates a Pantheon URL for the dev environment with ticket number d1234.
```