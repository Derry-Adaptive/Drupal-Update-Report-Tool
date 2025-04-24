// Define table headers for reports
const COLUMN_HEADERS = ["Module Name", "Installed Version", "Recommended Version"];

// Set up excluded modules
if (window._excludedModules === undefined) {
  window._excludedModules = new Set();
}
const excludedModules = window._excludedModules;

// Utility functions
function cleanText(text) {
  return text
    .replace(/<a[^>]*>|<\/a>/g, '')  // Remove links
    .replace(/\(Release notes\)/gi, '') // Remove "Release notes" text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
}

function getPantheonUrl(ticketId) {
  const link = document.querySelector('a.environment-link');
  if (!link) {
    console.warn("No link with class 'environment-link' found.");
    return null;
  }
  
  let url = link.href;
  if (ticketId) {
    // Limit ticket ID length and replace the domain
    ticketId = ticketId.substring(0, 11);
    return url.replace(/^(https?:\/\/)([^.-]+)(.*)/, `$1${ticketId}$3`);
  }
  return url;
}

function normalizeVersion(version) {
  return version.replace(/^8\.x-/, '');
}

function getCleanTextFromCell(cell) {
  if (!cell) return "";
  
  // Clone to avoid modifying the actual DOM
  const cellClone = cell.cloneNode(true);
  
  // Remove divs and warning messages
  cellClone.querySelectorAll('div, .update-major-version-warning').forEach(el => el.remove());
  
  return cleanText(cellClone.textContent);
}

function extractVersion(cell) {
  if (!cell) return "";
  
  // Clone to avoid modifying the actual DOM
  const cellClone = cell.cloneNode(true);
  
  // Remove divs that might contain extra information
  cellClone.querySelectorAll('div').forEach(el => el.remove());
  
  // Get the text content and clean it
  let text = cleanText(cellClone.textContent);
  
  // Try to extract version number
  const versionMatch = text.match(/\d+(\.\d+)(\.\d+)?/);
  if (versionMatch) {
    text = versionMatch[0];
  }
  
  return normalizeVersion(text);
}

function extractModuleNames(cell) {
  if (!cell) return { machine: "", human: "" };
  
  // Try to find module name from link
  let machineName = "";
  let humanName = "";
  
  // Look for a link to drupal.org project page
  const link = cell.querySelector("a[href*='drupal.org/project/']");
  if (link) {
    const matches = link.getAttribute("href").match(/project\/([^\/]+)\//);
    if (matches) {
      machineName = matches[1].toLowerCase();
      // Use link text for human name
      humanName = cleanText(link.textContent);
    }
  }
  
  // If we didn't get the machine name from the link, check for form inputs
  if (!machineName) {
    // Try to find it in form elements
    const formElement = cell.querySelector('input[name*="projects"]');
    if (formElement) {
      const inputName = formElement.getAttribute("name");
      const matches = inputName.match(/projects\[([^\]]+)\]/);
      if (matches) {
        machineName = matches[1].toLowerCase();
      }
    }
  }
  
  // If we still don't have a human name, use the full cell content
  if (!humanName) {
    humanName = getCleanTextFromCell(cell);
  }
  
  return { machine: machineName, human: humanName };
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function escapeCSV(value) {
  value = String(value).replace(/"/g, '""');
  return /["\n\r,]/.test(value) ? `"${value}"` : value;
}

// Report generators
function generateCSVReport(coreUpdates, moduleUpdates) {
  // Combine all data
  const rows = [
    COLUMN_HEADERS,
    ...coreUpdates.map(update => [update[1], update[2], update[3]]),
    ...moduleUpdates.map(update => [update[1], update[2], update[3]])
  ];
  
  // Convert to CSV
  const csvContent = rows.map(row => 
    row.map(escapeCSV).join(',')
  ).join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `drupal updates - ${window.location.hostname} - ${getCurrentDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function generateComposerCommands(coreUpdates, moduleUpdates) {
  const commands = [];
  
  // Handle core updates
  coreUpdates.forEach(update => {
    const name = update[1];
    const version = update[3];
    
    if (name === "core" || name.toLowerCase().includes("drupal core")) {
      commands.push(
        `drupal/core-recommended:^${version}`,
        `drupal/core-composer-scaffold:^${version}`,
        `drupal/core-project-message:^${version}`,
        `drupal/core:^${version}`
      );
    }
  });
  
  // Handle module updates
  moduleUpdates.forEach(update => {
    const machine = update[0];
    const version = update[3];
    
    // Quote module name if it contains special characters
    if (/[^a-z0-9_]/.test(machine)) {
      commands.push(`"drupal/${machine}:^${version}"`);
    } else {
      commands.push(`drupal/${machine}:^${version}`);
    }
  });
  
  if (commands.length) {
    console.log("📦 Composer command:");
    console.log("composer require -W " + commands.join(" "));
  } else {
    console.log("No matching modules found.");
  }
}

function generateASCIITable(coreUpdates, moduleUpdates) {
  // Combine core and module updates into one array
  const allUpdates = [
    ...coreUpdates.map(update => ({
      name: update[1],
      installed: update[2],
      recommended: update[3]
    })),
    ...moduleUpdates.map(update => ({
      name: update[1],
      installed: update[2],
      recommended: update[3]
    }))
  ];
  
  if (allUpdates.length === 0) {
    console.log("No module updates to display in ASCII table.");
    return;
  }
  
  // Create rows with headers
  const rows = [
    COLUMN_HEADERS,
    ...allUpdates.map(update => [
      update.name,
      update.installed,
      update.recommended
    ])
  ];
  
  // Calculate column widths
  const colWidths = [0, 0, 0];
  rows.forEach(row => {
    row.forEach((cell, i) => {
      // Set max width limit to avoid very wide tables
      const maxWidth = i === 2 ? 20 : 100;
      const cellStr = String(cell);
      colWidths[i] = Math.max(colWidths[i], Math.min(maxWidth, cellStr.length));
    });
  });
  
  // Create horizontal border lines
  const headerSeparator = createBorder('+', '+', '+', '=');
  const rowSeparator = createBorder('+', '+', '+');
  
  // Build the table
  const tableRows = [
    `Site: ${window.location.origin}`,
    `Date: ${getCurrentDate()}`,
    rowSeparator,
    formatRow(rows[0]),
    headerSeparator,
    ...rows.slice(1).map(formatRow),
    rowSeparator
  ];
  
  console.log("📚 ASCII table output:\n");
  console.log(tableRows.join('\n'));
  
  // Helper function to create borders
  function createBorder(start, middle, end, char = '-') {
    return start + colWidths.map(w => char.repeat(w + 2)).join(middle) + end;
  }
  
  // Helper function to format a row
  function formatRow(row) {
    return "| " + row.map((cell, i) => {
      const cellStr = String(cell);
      // Truncate long content
      const cellContent = cellStr.length > colWidths[i] 
        ? cellStr.substring(0, colWidths[i] - 3) + "..."
        : cellStr;
      return cellContent.padEnd(colWidths[i]);
    }).join(" | ") + " |";
  }
}

function generateCommitMessage(coreUpdates, moduleUpdates) {
  const lines = [`Update Drupal modules (${getCurrentDate()})`];
  
  if (coreUpdates.length) {
    lines.push("\nCore updates:");
    coreUpdates.forEach(update => {
      lines.push(`${update[1]} (${update[2]} → ${update[3]})`);
    });
  }
  
  if (moduleUpdates.length) {
    lines.push("\nContrib module updates:");
    moduleUpdates.forEach(update => {
      lines.push(`${update[1]} (${update[2]} → ${update[3]})`);
    });
  }
  
  if (lines.length > 1) {
    console.log("📝 Commit message suggestion:");
    console.log(lines.join("\n"));
  } else {
    console.log("No module updates to include in commit message.");
  }
}

// Table detection and data extraction
function findUpdateTables() {
  const tables = document.querySelectorAll('table');
  
  // Container for our table references
  const result = {
    core: null,
    modules: []
  };
  
  // First look for tables by ID (most reliable)
  tables.forEach(table => {
    if (table.id === 'edit-manual-updates') {
      result.core = table;
    } else if (table.id === 'edit-projects') {
      result.modules.push(table);
    }
  });
  
  // If we didn't find the tables by ID, try to detect them by structure
  if (!result.core || result.modules.length === 0) {
    tables.forEach(table => {
      // Skip tables we've already identified
      if (table === result.core || result.modules.includes(table)) {
        return;
      }
      
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      
      const headerCells = headerRow.querySelectorAll('th');
      if (!headerCells) return;
      
      // Extract header text for analysis
      const headers = Array.from(headerCells).map(th => 
        cleanText(th.textContent).toLowerCase()
      );
      
      // Check if first column is empty or contains 'select' text (checkbox column)
      const hasCheckboxColumn = headers[0] === '' || 
                                headers[0].includes('select') || 
                                headerCells[0].classList.contains('select-all');
      
      // Identify tables based on column structure
      if (headerCells.length === 3 && !hasCheckboxColumn) {
        // Core update table typically has 3 columns without a checkbox
        if (!result.core && table.querySelectorAll('tbody tr').length === 1) {
          result.core = table;
        }
      } else if (headerCells.length === 4 && hasCheckboxColumn) {
        // Module update table has 4 columns with a checkbox
        result.modules.push(table);
      } else if (headerCells.length === 3 && table.querySelectorAll('tbody tr').length > 1) {
        // Alternative module table format with 3 columns
        result.modules.push(table);
      }
    });
  }
  
  return result;
}

// Extract update information
function extractCoreUpdates(coreTable) {
  if (!coreTable) return [];
  
  const updates = [];
  
  // Process each row
  coreTable.querySelectorAll('tbody tr').forEach(row => {
    const className = row.className || '';
    const cells = row.querySelectorAll('td');
    
    if (cells.length >= 3) {
      const nameCell = cells[0];
      const currentVersionCell = cells[1];
      const newVersionCell = cells[2];
      
      const name = getCleanTextFromCell(nameCell);
      const currentVersion = extractVersion(currentVersionCell);
      const newVersion = extractVersion(newVersionCell);
      
      // Only include actual updates
      if (currentVersion && newVersion && currentVersion !== newVersion) {
        updates.push(['core', name, currentVersion, newVersion, className]);
      }
    }
  });
  
  return updates;
}

function extractModuleUpdates(table) {
  const updates = [];
  
  const rows = table.querySelectorAll('tbody tr');
  const headerCells = table.querySelector('thead tr')?.querySelectorAll('th') || [];
  
  // Check if this table has a checkbox column (4 columns)
  const hasCheckboxColumn = headerCells.length === 4 && 
    (headerCells[0].textContent.trim() === '' || headerCells[0].classList.contains('select-all'));
  
  // Process each row
  rows.forEach(row => {
    const className = row.className || '';
    const cells = row.querySelectorAll('td');
    
    // Skip rows with insufficient cells
    if (cells.length < (hasCheckboxColumn ? 4 : 3)) {
      return;
    }
    
    // Extract cells based on table structure
    const nameCell = cells[hasCheckboxColumn ? 1 : 0];
    const currentVersionCell = cells[hasCheckboxColumn ? 2 : 1];
    const newVersionCell = cells[hasCheckboxColumn ? 3 : 2];
    
    // Extract module name and version information
    const { machine, human } = extractModuleNames(nameCell);
    const currentVersion = extractVersion(currentVersionCell);
    const newVersion = extractVersion(newVersionCell);
    
    // Only include actual updates for modules not in the exclusion list
    if (machine && currentVersion && newVersion && 
        currentVersion !== newVersion && 
        !excludedModules.has(machine)) {
      updates.push([machine, human, currentVersion, newVersion, className]);
    }
  });
  
  return updates;
}

// Extract data from table
function extractUpdatesFromTable(table, isCore) {
  if (!table) {
    return [];
  }
  
  const rows = table.querySelectorAll('tbody tr');
  const updates = [];
  
  rows.forEach(row => {
    const className = row.className || '';
    const cells = row.querySelectorAll('td');
    
    // Skip rows with insufficient cells
    if (cells.length < 3) {
      return;
    }
    
    let nameCell, currentVersionCell, newVersionCell;
    let type = 'core';
    let name;
    
    if (isCore) {
      // Core update table structure
      nameCell = cells[0];
      currentVersionCell = cells[1];
      newVersionCell = cells[2];
      name = getCleanTextFromCell(nameCell);
    } else {
      // Module update table structure
      const headerCells = table.querySelector('thead tr')?.querySelectorAll('th') || [];
      const hasCheckboxColumn = headerCells.length === 4 && 
        (headerCells[0].textContent.trim() === '' || headerCells[0].classList.contains('select-all'));
      
      nameCell = cells[hasCheckboxColumn ? 1 : 0];
      currentVersionCell = cells[hasCheckboxColumn ? 2 : 1];
      newVersionCell = cells[hasCheckboxColumn ? 3 : 2];
      
      // Extract module name
      const extractedNames = extractModuleNames(nameCell);
      type = extractedNames.machine;
      name = extractedNames.human;
      
      // Skip excluded modules
      if (excludedModules.has(type)) {
        return;
      }
    }
    
    const currentVersion = extractVersion(currentVersionCell);
    const newVersion = extractVersion(newVersionCell);
    
    // Only include actual updates
    if (currentVersion && newVersion && currentVersion !== newVersion) {
      updates.push([type, name, currentVersion, newVersion, className]);
    }
  });
  
  return updates;
}

// Main function to generate update reports
window.generateUpdateReport = function(type = "help", name = null, options = null) {
  // Name parameter can be a module name, ticket ID, or null depending on command type
  let moduleName = null;
  let ticketId = null;
  let filterScopes = [];
  
  // Determine the meaning of the second parameter based on command type
  if (typeof name === 'string' && name) {
    if (type === "add_exclude" || type === "remove_exclude") {
      moduleName = name;
    } else if (type === "pantheon") {
      ticketId = name;
    }
    // Otherwise it could be ignored or used for backward compatibility
  }

  // Process options parameter - can be array of filter scopes or string for backward compatibility
  if (options !== null) {
    if (typeof options === 'string') {
      // Backward compatibility - string in third position was a ticket ID
      ticketId = options;
    } else if (Array.isArray(options)) {
      filterScopes = options;
    }
  }
  
  if (type === "help" || !type) {
    console.log('✅ "generateUpdateReport" is ready to use');
    console.log("Available report types:");
    console.log("- composer: Output composer require commands");
    console.log("- csv: Export data to a CSV file");
    console.log("- commit: Generate a commit message");
    console.log("- table: Generate an ASCII table in the console");
    console.log("- modules: Drush commands for managing modules");
    console.log("- pantheon: Generate Pantheon URL (requires ticketId)");
    console.log("- all: Generate all reports");
    console.log("\nAdditional commands:");
    console.log("- clear: Clear all module exclusions");
    console.log("- add_exclude <module_name>: Add a module to the exclude list");
    console.log("- remove_exclude <module_name>: Remove a module from the exclude list");
    console.log("- exclude_list: List all excluded modules");
    console.log("\nUsage examples:");
    console.log('generateUpdateReport("composer", null, ["security"])');
    console.log('generateUpdateReport("csv", null, ["security"])');
    console.log('generateUpdateReport("table")');
    console.log('generateUpdateReport("git", null, ["security", "unsupported"])');
    console.log('generateUpdateReport("pantheon", "d1234")');
    console.log('generateUpdateReport("add_exclude", "module_name")');
    return;
  }
  
  // Handle exclusion list commands
  if (type === "clear") {
    window._excludedModules.clear();
    console.log("🧹 Cleared all module exclusions");
    return;
  } else if (type === "add_exclude") {
    if (!moduleName) {
      console.log("⚠️ Please provide a module name to exclude");
      return;
    }
    window._excludedModules.add(moduleName.toLowerCase());
    console.log("➕ Excluded module: " + moduleName);
    return;
  } else if (type === "remove_exclude") {
    if (!moduleName) {
      console.log("⚠️ Please provide a module name to remove from exclusion list");
      return;
    }
    window._excludedModules.delete(moduleName.toLowerCase());
    console.log("✅ Removed from exclude list: " + moduleName);
    return;
  } else if (type === "exclude_list") {
    console.log("🗄️ Currently excluded modules:");
    console.log([...window._excludedModules].sort().join("\n") || "None");
    return;
  }
  
  // Find update tables
  const tables = findUpdateTables();
  
  // Extract update information
  const coreUpdates = extractUpdatesFromTable(tables.core, true);
  let moduleUpdates = [];
  
  // Process all module tables
  tables.modules.forEach(table => {
    const updates = extractUpdatesFromTable(table, false);
    moduleUpdates = moduleUpdates.concat(updates);
  });
  
  // Create copies of update arrays for initial filtering
  let filteredCoreUpdates = [...coreUpdates];
  let filteredModuleUpdates = [...moduleUpdates];
  
  // Apply scope filtering if specified in options
  if (Array.isArray(filterScopes) && filterScopes.length > 0) {
    filteredCoreUpdates = coreUpdates.filter(update => 
      filterScopes.some(scope => (update[4] || "").includes(scope))
    );
    
    filteredModuleUpdates = moduleUpdates.filter(update => 
      filterScopes.some(scope => (update[4] || "").includes(scope))
    );
    
    console.log(`Filtered to scopes [${filterScopes.join(', ')}]: ${filteredCoreUpdates.length} core, ${filteredModuleUpdates.length} modules`);
  }
  
  // Generate the requested report
  if (type === "composer") {
    generateComposerCommands(filteredCoreUpdates, filteredModuleUpdates);
  } 
  else if (type === "csv") {
    generateCSVReport(filteredCoreUpdates, filteredModuleUpdates);
  } 
  else if (type === "commit" || type === "git") {
    generateCommitMessage(filteredCoreUpdates, filteredModuleUpdates);
  } 
  else if (type === "ascii" || type === "table") {
    generateASCIITable(filteredCoreUpdates, filteredModuleUpdates);
  } 
  else if (type === "modules") {
    console.log("Drush commands for managing modules would go here");
  } 
  else if (type === "pantheon") {
    const url = getPantheonUrl(ticketId);
    console.log("🚀 Pantheon URL: " + url);
  }
  else {
    console.log(`⚠️ Unknown report type: "${type}"`);
    console.log('Run generateUpdateReport("help") for available options');
  }
};

// Show help immediately when loaded
generateUpdateReport("help");