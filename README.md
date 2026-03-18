# Drupal Update Report Tool (DURT)

The **Drupal Update Report Tool (DURT)** generates Drupal update reports directly from the `/admin/reports/updates` page without installing anything on your site.

It parses the Drupal update status table in the browser and produces structured output such as Composer commands, commit messages, and update reports.

The tool runs entirely **client-side** as a **bookmarklet** and requires no modules, APIs, or server access.

---

# Features

## Automatic Update Detection

Scans the Drupal Update Status report and detects:

- current modules
- available updates
- security updates
- unsupported modules

## Composer Command Generation

Generates ready-to-run commands such as:

    composer require -W "drupal/module:version"

## Commit Message Generator

Creates formatted commit messages suitable for Git commits.

## Multiple Output Formats

| Output | Description |
|------|------|
| Composer | Ready-to-paste composer command |
| Commit msg | Git commit message |
| ASCII | Table formatted report |
| JSON | Raw structured data |
| Composer JSON | `require` block for composer.json |
| CSV | Downloadable update report |
| Modules | List of enabled modules |
| Modules CSV | CSV export of modules |
| Modules Status | Table of module update status |
| Modules Status CSV | CSV status export |

## Scope Filtering

Filter results by update type:

- security
- update
- updatable
- unsupported
- current
- all

## Version Overrides

Force specific versions for modules.

Example:

    drupal/webform=6.3.0

or JSON format:

    {
      "drupal/webform": "6.3.0"
    }

## Copy-Ready Output

All results appear in the DURT output panel and can be copied directly.

---

# Requirements

- Modern browser with JavaScript enabled
- Access to the Drupal update report page

  /admin/reports/updates

Compatible with:

- Drupal 8
- Drupal 9
- Drupal 10
- Drupal 11

---

# Installation

## Bookmarklet

1. Minify the DURT script.
2. Create a new browser bookmark.
3. Paste the minified script into the bookmark URL field.
4. Navigate to:

       /admin/reports/updates

5. Click the bookmark to launch DURT.

---

# Using DURT

When launched, DURT opens a floating control panel.

## Select Scope

Choose which updates should be included:

- Security updates
- Available updates
- Unsupported modules
- All modules

## Optional Settings

### Wrap JSON

Wrap Composer JSON output inside:

    {
      "require": {}
    }

### Overrides

Override specific versions.

Example:

    drupal/pathauto=1.13

---

# Run Outputs

Use the panel buttons to generate output.

| Button | Output |
|------|------|
| Composer | Composer require command |
| Commit msg | Git commit message |
| ASCII | Table report |
| JSON | Raw data |
| Composer JSON | JSON require block |
| CSV download | CSV report |
| Modules | List of modules |
| Modules CSV | CSV module list |
| Modules Status | Module status table |
| Modules Status CSV | CSV status export |

---

# Output Panel

Results appear in the **Output** area.

| Button | Function |
|------|------|
| Clear | Clear output |
| Copy | Copy output to clipboard |

The output contains only the generated result, ready for direct paste into:

- terminal commands
- commit messages
- documentation
- spreadsheets

---

# Security

This tool:

- runs entirely in the browser
- does not send data externally
- does not modify your Drupal site
- requires no installation

It only reads the contents of the update report page.

---

# Tips

- Use **Composer output** for quick updates.
- Use **Commit output** for consistent Git commits.
- Use **CSV export** to track updates across multiple sites.
