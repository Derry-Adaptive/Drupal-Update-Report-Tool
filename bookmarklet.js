javascript:(function(){
  const HEADERS = ["Module Name","Installed Version","Recommended Version"];
  const excludedModules = window._excludedModules || new Set();
  window._excludedModules = excludedModules;

  function cleanText(text){
    return text.replace(/<a[^>]*>|<\/a>/g,"").replace(/\(Release notes\)/gi,"").replace(/\s+/g," ").trim();
  }

  function cleanVersion(version){
    return version.replace(/^8\.x-/,"");
  }

  function extractModuleNames(cell){
    if(!cell) return {machine: "", human: ""};
    const link = cell.querySelector("a[href*='drupal.org/project/']");
    let machine = "";
    if(link){
      const match = link.getAttribute("href").match(/project\/([^/]+)/);
      if(match) machine = match[1].toLowerCase();
    }
    let tempCell = cell.cloneNode(true);
    tempCell.querySelectorAll("div").forEach(div => div.remove());
    let human = cleanText(tempCell.textContent);
    return {machine, human};
  }

  function getCurrentDate(){
    return new Date().toISOString().split("T")[0];
  }

  function quoteCSV(val){
    val = String(val);
    val = val.replace(/"/g, '""');
    if (/["\n\r,]/.test(val)) {
      return `"${val}"`;
    }
    return val;
  }

  function exportCSV(core, contrib){
    let rows = [["Module Name", "Installed Version", "Recommended Version"], ...core.map(r => [r[1], r[2], r[3]]), ...contrib.map(r => [r[1], r[2], r[3]])];
    let csv = rows.map(r => r.map(quoteCSV).join(",")).join("\n");
    let blob = new Blob([csv], {type: "text/csv"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `drupal updates - ${window.location.hostname} - ${getCurrentDate()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function generateComposerCommand(core, contrib){
    let lines = [];
    let coreDetected = false;

    core.forEach(([m, h, f, t]) => {
      if (m === "core" || h.toLowerCase().includes("drupal core")) {
        coreDetected = true;
        lines.push(
          `drupal/core-recommended:^${t}`,
          `drupal/core-composer-scaffold:^${t}`,
          `drupal/core-project-message:^${t}`,
          `drupal/core:^${t}`
        );
      }
    });

    contrib.forEach(([m, h, f, t]) => {
      lines.push(/[^a-z0-9_]/.test(m) ? `"drupal/${m}:^${t}"` : `drupal/${m}:^${t}`);
    });

    if(lines.length){
      console.log("📦 Composer command:");
      console.log("composer require -W " + lines.join(" "));
    } else {
      console.log("⚠️ No matching modules found.");
    }
  }

  function generateUpdateReport(action = "help", filter = "all"){
    if(action === "help"){
      console.log('✅ "generateUpdateReport" is ready to use');
      console.log('📦 REPORT OUTPUT OPTIONS:');
      console.log('🔹 generateUpdateReport(); → CSV of all updates (default)');
      console.log('🔹 generateUpdateReport("csv", "security"); → CSV of security updates only');
      console.log('🔹 generateUpdateReport("ascii"); → Display updates in an ASCII table');
      console.log('🔹 generateUpdateReport("commit"); → Generate commit message');
      console.log('🔹 generateUpdateReport("composer"); → Generate composer require command');
      console.log('🔹 generateUpdateReport("all"); → Test all output formats');
      
      console.log('🧰 EXCLUDE / UNLOAD OPTIONS:');
      console.log('🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list');
      console.log('🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from the exclude list');
      console.log('🔹 generateUpdateReport("exclude_list"); → Display all excluded modules');
      return;
    }

    let core = [], contrib = [];
    
    function extractTableData(table, targetArray, isCore = false){
      if(!table) return;
      table.querySelectorAll("tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if(!cells.length) return;

        if(isCore) {
          let from = cleanVersion(cleanText(cells[1]?.textContent || ""));
          let to = cleanVersion(cleanText(cells[2]?.textContent || ""));
          if(from && to && from !== to) targetArray.push(["core", "Drupal Core", from, to]);
        } else {
          let {machine, human} = extractModuleNames(cells[1]);
          let from = cleanVersion(cleanText(cells[2]?.textContent || ""));
          let to = cleanVersion(cleanText(cells[3]?.textContent || ""));
          if(excludedModules.has(machine.toLowerCase())) return;
          if(machine && human && from && to && from !== to) targetArray.push([machine, human, from, to]);
        }
      });
    }

    extractTableData(document.querySelector("table#edit-manual-updates"), core, true);
    extractTableData(document.querySelector("table#edit-projects") || document.querySelector("table.update"), contrib, false);

    if(action === "composer") generateComposerCommand(core, contrib);
    else if(action === "csv") exportCSV(core, contrib);
    else if(action === "all"){
      generateUpdateReport("composer");
      generateUpdateReport("csv");
      generateUpdateReport("help");
    }
  }

  window.generateUpdateReport = generateUpdateReport;
  generateUpdateReport("help");
})();
