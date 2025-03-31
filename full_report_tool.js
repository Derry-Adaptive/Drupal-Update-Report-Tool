const HEADERS = ["Module Name", "Installed Version", "Recommended Version"];

if (!window._excludedModules) {
  window._excludedModules = new Set();
}

const excludedModules = window._excludedModules;

function cleanText(text) {
  if (!text) return "";
  return text.replace(/<a[^>]*>|<\/a>/g, "")
             .replace(/\(Release notes\)/gi, "")
             .replace(/\s+/g, " ")
             .trim();
}

function cleanVersion(version) {
  return version.replace(/^8\.x-/, "").trim();
}

function escapeCSVValue(value) {
  if (!value) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function isModuleExcluded(machine, human) {
    const lowerHuman = human.toLowerCase();

    for (let pattern of excludedModules) {
        if (pattern.includes("*")) {
            const regexPattern = pattern.replace(/\*/g, ".*");
            const regex = new RegExp(regexPattern, "i");
            if (regex.test(machine) || regex.test(lowerHuman)) {
                return true;
            }
        } else {
            if (pattern === machine || pattern === lowerHuman) {
                return true;
            }
        }
    }
    return false;
}

function extractModuleNames(cell) {
  if (!cell) return { machine: "", human: "" };
  const link = cell.querySelector("a[href*='drupal.org/project/']");
  let machine = "";
  if (link) {
    const match = link.getAttribute("href").match(/project\/([^/]+)/);
    if (match) machine = match[1].toLowerCase();
  }
  let tempCell = cell.cloneNode(true);
  tempCell.querySelectorAll("div").forEach(div => div.remove());
  let human = cleanText(tempCell.textContent);
  return { machine, human };
}

function extractTableData(table, targetArray, isCore = false, filter = "all") {
  if (!table) return;
  table.querySelectorAll("tbody tr").forEach(row => {
    const cells = row.querySelectorAll("td");
    if (!cells.length) return;

    let nameCell = cells[isCore ? 0 : 1];
    let { machine, human } = extractModuleNames(nameCell);

    let from = cleanVersion(cleanText(cells[isCore ? 1 : 2]?.textContent || ""));
    let to = cleanVersion(cleanText(cells[isCore ? 2 : 3]?.textContent || ""));

    const isExcluded = isModuleExcluded(machine, human);

    if ((filter === "excluded" && !isExcluded) || (filter !== "excluded" && isExcluded)) return;

    if (machine && human && from && to && from !== to) {
      targetArray.push([machine, human, from, to]);
    }
  });
}

function generateCSV(all) {
  const rows = [["Module Name", "Installed Version", "Recommended Version"], ...all.map(r => [r[1], r[2], r[3]])];
  const csvContent = rows.map(row => row.map(escapeCSVValue).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `drupal-updates-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  console.log("✅ CSV report downloaded successfully.");
}

function generateUpdateReport(action = "csv", filter = "all") {
  let core = [], contrib = [];
  extractTableData(document.querySelector("#edit-manual-updates"), core, true, filter);
  extractTableData(document.querySelector("#edit-projects, .update"), contrib, false, filter);

  const all = [...core, ...contrib];
  if (!all.length) return console.log("⚠️ No updates found.");

  if (action === "csv") generateCSV(all);
}

// Default action to download a CSV report
generateUpdateReport("csv");
