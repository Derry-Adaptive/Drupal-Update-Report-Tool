// Main function to generate update reports
window.generateUpdateReport = function(type = "help", name = null, options = null) {
  // Handle different option formats
  let moduleName = null;
  let ticketId = null;
  let filterScopes = [];
  
  // For backwards compatibility
  if (typeof name === 'string' && name) {
    if (type === "add_exclude" || type === "remove_exclude") {
      moduleName = name;
    } else if (name !== "all" && name !== "security" && name !== "unsupported") {
      // If it's not a known scope, treat as module name for backward compatibility
      moduleName = name;
    }
  }

  // Process options parameter
  if (options !== null) {
    if (typeof options === 'string') {
      // Backward compatibility - string in third position was a ticket ID
      ticketId = options;
    } else if (Array.isArray(options)) {
      // New format - array of filter scopes
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
    console.log('generateUpdateReport("composer")');
    console.log('generateUpdateReport("csv", null, ["security"])');
    console.log('generateUpdateReport("table")');
    console.log('generateUpdateReport("git", null, ["security", "unsupported"])');
    console.log('generateUpdateReport("pantheon", null, "d1234")');
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
  else if (type === "all") {
    generateUpdateReport("composer", name, options);
    generateUpdateReport("csv", name, options);
    generateUpdateReport("table", name, options);
    generateUpdateReport("git", name, options);
    generateUpdateReport("help");
  } 
  else {
    console.log(`⚠️ Unknown report type: "${type}"`);
    console.log('Run generateUpdateReport("help") for available options');
  }
};