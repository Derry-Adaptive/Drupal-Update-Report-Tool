if (!window._excludedModules) window._excludedModules = new Set();

const excludedModules = window._excludedModules;

function extractUpdates() {
    const rows = Array.from(document.querySelectorAll('table#update-report tbody tr'));
    const updates = rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null; // Skip invalid rows

        const machineName = cells[0].innerText.trim().toLowerCase();
        const moduleName = cells[1].innerText.trim();
        const installedVersion = cells[2].innerText.trim();
        const recommendedVersion = cells[3].innerText.trim();
        
        if (!machineName || !moduleName || !installedVersion || !recommendedVersion) return null;

        return [machineName, moduleName, installedVersion, recommendedVersion];
    }).filter(Boolean); // Remove null entries

    return updates;
}

function generateASCII(all) {
    const headers = ["Module Name", "Installed Version", "Recommended Version"];
    
    const moduleNameWidth = 60;
    const versionWidth = 30;
    const securityLabel = " (Security update)";
    const extraSpaces = "  ";
    
    const formattedRows = all.map(r => {
        let moduleName = r[1];
        let isSecurity = moduleName.toLowerCase().includes("security");

        if (isSecurity) {
            moduleName += securityLabel;
        }

        if (moduleName.length > moduleNameWidth) {
            moduleName = moduleName.slice(0, moduleNameWidth - 3) + '...';
        } else {
            moduleName = moduleName.padEnd(moduleNameWidth, " ");
        }

        let installedVersion = r[2].padEnd(versionWidth, " ");
        let recommendedVersion = r[3].padEnd(versionWidth, " ");

        if (isSecurity) {
            installedVersion += extraSpaces;
            recommendedVersion += extraSpaces;
        }

        return [moduleName, installedVersion, recommendedVersion];
    });

    const widths = [moduleNameWidth, versionWidth + 2, versionWidth + 2];
    const row = r => `| ${r.join(" | ")} |`;
    const bar = ch => `+${widths.map(w => ch.repeat(w)).join("+")}+`;

    console.log(`\n${bar("-")}\n${row(headers)}\n${bar("=")}\n${formattedRows.map(row => row.join(" | ")).join("\n")}\n${bar("-")}\n`);
}

function filterData(all, filter) {
    if (filter === "security") {
        return all.filter(row => row[1].toLowerCase().includes("security"));
    }
    if (filter === "excluded") {
        return all.filter(row => excludedModules.has(row[0].toLowerCase()));
    }
    return all;
}

function generateUpdateReport(action = "help", filter = "all") {
    const all = extractUpdates();
    const filteredData = filterData(all, filter);

    if (action === "help") {
        console.log(`
🔧 generateUpdateReport([type], [scope]) — Drupal Module Update Helper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 TYPE (output format)
  "csv"         → Download a CSV file of available updates
  "ascii"       → Output a clean table to the console
  "commit"      → Print commit message summary
  "composer"    → Output a 'composer require' command

🎯 SCOPE (optional filter)
  "all"         → Include all available updates (default)
  "security"    → Limit output to security updates only
  "excluded"    → Only show modules marked as excluded

📌 USAGE
  generateUpdateReport("ascii")                  → All updates
  generateUpdateReport("csv", "security")        → Security-only CSV
  generateUpdateReport("composer")               → Composer command for all

🚫 EXCLUDE MODULES
  generateUpdateReport("add_exclude", "token")      → Exclude modules matching "token"
  generateUpdateReport("remove_exclude", "token")   → Remove exclusion
  generateUpdateReport("exclude_list")              → View current exclude filters

💡 TIPS
  • Filters are stored only in memory (browser tab session)
  • Use "all", "security", or "excluded" as filter options
  • Run after exclusions: generateUpdateReport("ascii") or ("composer")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        return;
    }

    if (action === "exclude_list") {
        console.log("Excluded Modules:", Array.from(excludedModules));
        return;
    }

    if (action === "add_exclude") {
        excludedModules.add(filter.toLowerCase());
        console.log(`✅ Module "${filter}" has been added to the exclusion list.`);
        return;
    }

    if (action === "remove_exclude") {
        excludedModules.delete(filter.toLowerCase());
        console.log(`✅ Module "${filter}" has been removed from the exclusion list.`);
        return;
    }

    if (action === "ascii") {
        generateASCII(filteredData);
        return;
    }

    console.log("❌ Invalid action. Use generateUpdateReport('help') to see available commands.");
}

// Automatically show help when the script is loaded
generateUpdateReport("help");
