# Drupal Update Report Tool

This tool helps you generate a comprehensive report of Drupal module updates, including the status of each module (updatable, security, update, unsupported, etc.). It also provides options for exporting this data in various formats like **JSON**, **CSV**, **ASCII**, and generating **Composer** commands for module updates.

## Features

- **Display Drupal Updates**: Shows updatable modules, security updates, and current core versions.
- **Export Options**: Supports exporting the report in multiple formats.
    - **JSON**: Outputs the updates as a JSON object.
    - **CSV**: Exports the report to a CSV file, with domain and date in the filename.
    - **ASCII**: Prints the updates in a console-friendly ASCII table.
    - **Composer**: Generates a `composer require` command for updating modules.
- **Exclusion**: Allows you to exclude specific modules from the report.
- **Commit Message**: Generates a commit message listing the updates.

## Requirements

This tool works in any modern web browser with JavaScript enabled. It can be used directly from your browser without requiring any installation on your Drupal site.

## Setup

To set up the tool as a **bookmarklet** in your browser, follow these steps:

### 1. **Bookmarklet Setup**:

1. **Download `bookmarklet.js`**:
    - [Download the `bookmarklet.js` file](#) or simply **copy the content** of the script from `bookmarklet.js`.

2. **Create a new bookmark** in your browser.
3. **Name the bookmark** (e.g., "Drupal Update Report").
4. In the **URL field**, paste the script copied from `bookmarklet.js` and save the bookmark.

5. Now, you can click the bookmark from any page on your Drupal site to run the tool directly.

### 2. **Injecting the Tool into Your Site**:

Alternatively, you can inject the script into your site using browser developer tools. If you want to add the script manually, follow these steps:

- Open the **Developer Tools** (`F12` or `Ctrl+Shift+I`).
- Navigate to the **Console** tab.
- Paste the full script (from the file you have) into the console and press **Enter**.

### 3. **Best Place to Use**:

For best results, **use this tool on the Drupal update report page**:
- Navigate to **`/admin/reports/updates`** on your Drupal site, where module update information is displayed.
- This tool will extract and process the update information from this page.

### 4. **Available Commands**:

You can interact with the tool by calling `generateUpdateReport()` with different arguments. Here are the available commands:

#### Export CSV

This will download a CSV file with the module updates, including the domain and date in the filename.

```javascript
generateUpdateReport("csv");
