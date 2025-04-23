const MODULE_UPDATE_HEADERS = [
  "Module Name",
  "Installed Version",
  "Recommended Version"
];

if (typeof window._excludedModules === 'undefined') {
  window._excludedModules = new Set();
}
var excludedModules = window._excludedModules;

function cleanText(text) {
  return text.replace(/<a[^>]*>|<\/a>/g, "").replace(/\(Release notes\)/gi, "").replace(/\s+/g, " ").trim();
}

function generatePantheonUrl(ticket) {
    const link = document.querySelector("a.environment-link");

    if (!link) {
        console.warn("No link with class 'environment-link' found.");
        return null;
    }

    const href = link.href;

    if (ticket) {
        const truncatedTicket = ticket.substring(0, 11); // Truncate to 11 characters
        // Simple find and replace for the environment segment
        const envRegex = /^(https?:\/\/)([^.-]+)(.*)/;
        const newHref = href.replace(envRegex, `$1${truncatedTicket}$3`);
        return newHref;
    }
    return href;
}

function cleanVersion(version) {
  return version.replace(/^8\.x-/, "");
}

function getCleanTextFromCell(cell) {
  if (!cell) return "";
  const clone = cell.cloneNode(true);
  clone.querySelectorAll("div").forEach(div => div.remove());
  return cleanText(clone.textContent);
}

function getVersion(cell) {
  return cleanVersion(cleanText(cell?.textContent || ""));
}

function extractModuleNames(cell) {
  if (!cell) return { machine: "", human: "" };
  const link = cell.querySelector("a[href*='drupal.org/project/']");
  let machine = "";
  if (link) {
    const match = link.getAttribute("href").match(/project\/([^/]+)/);
    if (match) machine = match[1].toLowerCase();
  }
  const human = getCleanTextFromCell(cell);
  return { machine, human };
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function quoteCSV(val) {
  val = String(val).replace(/"/g, '""');
  return /["\n\r,]/.test(val) ? `"${val}"` : val;
}

function exportCSV(core, contrib) {
  const rows = [
    MODULE_UPDATE_HEADERS,
    ...core.map(r => [r[1], r[2], r[3]]),
    ...contrib.map(r => [r[1], r[2], r[3]])
  ];
  const csv = rows.map(r => r.map(quoteCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `drupal updates - ${window.location.hostname} - ${getCurrentDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function generateComposerCommand(core, contrib) {
  const lines = [];

  core.forEach(([m, h, f, t]) => {
    if (m === "core" || h.toLowerCase().includes("drupal core")) {
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

  if (lines.length) {
    console.log("📦 Composer command:");
    console.log("composer require -W " + lines.join(" "));
  } else {
    console.log("⚠️ No matching modules found.");
  }
}

function generateAsciiTable(core, contrib) {
  const all = [...core, ...contrib];
  if (!all.length) {
    console.log("⚠️ No module updates to display in ASCII table.");
    return;
  }

  const rows = [
    MODULE_UPDATE_HEADERS,
    ...all.map(([_, human, from, to]) => [human, from, to])
  ];

  const colWidths = [0, 0, 0];
  rows.forEach(row => {
    row.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i], cell.length);
    });
  });

  function makeLine(sepLeft, sepMid, sepRight, fill = '-') {
    return sepLeft + colWidths.map(w => fill.repeat(w + 2)).join(sepMid) + sepRight;
  }

  function formatRow(row) {
    return '| ' + row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |';
  }

  const headerLine = makeLine('+', '+', '+', '=');
  const borderLine = makeLine('+', '+', '+');
  const site = window.location.origin;
  const date = getCurrentDate();

  const output = [
    `Site: ${site}`,
    `Date: ${date}`,
    borderLine,
    formatRow(rows[0]),
    headerLine,
    ...rows.slice(1).map(formatRow),
    borderLine
  ];

  console.log("📋 ASCII table output:\n");
  console.log(output.join("\n"));
}

function generateCommitMessage(core, contrib) {
  const date = getCurrentDate();
  const lines = [`Update Drupal modules (${date})`];

  if (core.length) {
    lines.push("\nCore updates:");
    core.forEach(([_, human, from, to]) => {
      lines.push(`${human} (${from} → ${to})`);
    });
  }

  if (contrib.length) {
    lines.push("\nContrib module updates:");
    contrib.forEach(([_, human, from, to]) => {
      lines.push(`${human} (${from} → ${to})`);
    });
  }

  if (lines.length > 1) {
    console.log("📝 Commit message suggestion:");
    console.log(lines.join("\n"));
  } else {
    console.log("⚠️ No module updates to include in commit message.");
  }
}

function generateUpdateReport(action = "help", filter = "all", ticket = null) {
  // Clear existing excluded modules before processing.
  excludedModules.clear();

  if (action === "help" || !action) {
    console.log('✅ "generateUpdateReport" is ready to use');
    console.log('📦 REPORT OUTPUT OPTIONS:\n');
    console.log('🔹 generateUpdateReport("csv"); → CSV of all updates');
    console.log('🔹 generateUpdateReport("csv", "security"); → CSV of security updates only');
    console.log('🔹 generateUpdateReport("ascii"); → Display updates in an ASCII table');
    console.log('🔹 generateUpdateReport("commit"); → Generate commit message');
    console.log('🔹 generateUpdateReport("composer"); → Generate composer require command');
    console.log('🔹 generateUpdateReport("all"); → Test all output formats');
    console.log('\n🧰 EXCLUDE / UNLOAD OPTIONS:\n');
    console.log('🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list');
    console.log('🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from the exclude list');
    console.log('🔹 generateUpdateReport("exclude_list"); → Display all excluded modules');
    return;
  }

  if (action === "add_exclude") {
    excludedModules.add(filter.toLowerCase());
    console.log(`🛑 Excluded module: ${filter}`);
    return;
  }

  if (action === "remove_exclude") {
    excludedModules.delete(filter.toLowerCase());
    console.log(`✅ Removed from exclude list: ${filter}`);
    return;
  }

  if (action === "exclude_list") {
    console.log("🔍 Currently excluded modules:");
    console.log([...excludedModules].sort().join("\n") || "None");
    return;
  }

  let core = [], contrib = [];

  function extractTableData(table, targetArray, isCore = false) {
    if (!table) return;

    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (!cells.length) return;

      if (isCore) {
        const label = getCleanTextFromCell(cells[0]);
        const from = getVersion(cells[1]);
        const to = getVersion(cells[2]);
        if (from && to && from !== to) {
          targetArray.push(["core", label, from, to]);
        }
      } else {
        const { machine, human } = extractModuleNames(cells[1]);
        const from = getVersion(cells[2]);
        const to = getVersion(cells[3]);
        if (excludedModules.has(machine.toLowerCase())) return;
        if (machine && human && from && to && from !== to) {
          targetArray.push([machine, human, from, to]);
        }
      }
    });
  }

  extractTableData(document.querySelector("table#edit-manual-updates"), core, true);
  extractTableData(document.querySelector("table#edit-projects") || document.querySelector("table.update"), contrib, false);

  const allowedFilters = ["all", "security", "unsupported"];
  const activeFilter = allowedFilters.includes(filter?.toLowerCase()) ? filter.toLowerCase() : "all";

  if (activeFilter !== "all") {
    core = core.filter(r => r[1].toLowerCase().includes(activeFilter));
    contrib = contrib.filter(r => r[1].toLowerCase().includes(activeFilter));
  }

  if (action === "composer") generateComposerCommand(core, contrib);
  else if (action === "csv") exportCSV(core, contrib);
  else if (action === "commit") generateCommitMessage(core, contrib);
  else if (action === "ascii") generateAsciiTable(core, contrib);
  else if (action === "pantheon") {
    const pantheonUrl = generatePantheonUrl(ticket);
    console.log(`🚀 Pantheon URL: ${pantheonUrl}`);
  }
  else if (action === "all") {
    generateUpdateReport("composer");
    generateUpdateReport("csv");
    generateUpdateReport("ascii");
    generateUpdateReport("commit");
    generateUpdateReport("help");
  }
}

generateUpdateReport("help");