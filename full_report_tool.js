const HEADERS = ["Module Name", "Installed Version", "Recommended Version"];

if (!window._excludedModules) {
  window._excludedModules = new Set();
}

const excludedModules = window._excludedModules;

function cleanText(text) {
  return text
    .replace(/<a[^>]*>|<\/a>/g, "")
    .replace(/\(Release notes\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanVersion(version) {
  return version.replace(/^8\.x-/, "");
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

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function quoteCSV(val) {
  const str = String(val).replace(/\r?\n/g, "\n"); // Normalize newlines
  const escaped = str.replace(/"/g, '""');         // Escape quotes
  return `"${escaped}"`;
}

function generateUpdateReport(action = "csv", filter = "all") {
    let core = [], contrib = [], excludedModulesList = [];
    let securityOnly = filter === "security";
    let excludedOnly = filter === "excluded";

    function extractTableData(table, targetArray, isCore = false) {
        if (!table) return;
        table.querySelectorAll("tbody tr").forEach(row => {
            const cells = row.querySelectorAll("td");
            if (!cells.length) return;

            let nameCell = cells[isCore ? 0 : 1];
            let { machine, human } = extractModuleNames(nameCell);

            let from = cleanVersion(cleanText(cells[isCore ? 1 : 2]?.textContent || ""));
            let to = cleanVersion(cleanText(cells[isCore ? 2 : 3]?.textContent || ""));

            const isExcluded = excludedModules.has(machine) || excludedModules.has(human.toLowerCase());
            if (isExcluded && !excludedOnly) return; // Skip excluded if not specifically requesting them

            if (machine && human && from && to && from !== to) {
                if (isExcluded) {
                    excludedModulesList.push([human, from, to]);
                } else {
                    targetArray.push([machine, human, from, to]);
                }
            }
        });
    }

    extractTableData(document.querySelector("table#edit-manual-updates"), core, true);
    extractTableData(document.querySelector("table#edit-projects") || document.querySelector("table.update"), contrib, false);

    if (excludedOnly && excludedModulesList.length === 0) {
        console.log("⚠️ No excluded modules found.");
        return;
    }

    const HEADERS = ["Module Name", "Installed Version", "Recommended Version"];
    let all = [...core, ...contrib];

    if (action === "csv") {
        let rows = [HEADERS, ...all.map(r => [r[1], r[2], r[3]])];
        let csvContent = rows.map(row => row.map(quoteCSV).join(",")).join("\n");
        
        let blob = new Blob([csvContent], { type: "text/csv" });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `drupal-updates-${getCurrentDate()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log("\n✅ CSV report downloaded successfully.");
    } else if (action === "ascii") {
        let widths = HEADERS.map((h, i) => Math.max(h.length, ...all.map(r => r[i].length), ...excludedModulesList.map(r => r[i].length)));
        let row = r => `| ${r.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
        let bar = ch => `+${widths.map(w => ch.repeat(w + 2)).join("+")}+`;

        console.log(`\n${bar("-")}\n${row(HEADERS)}\n${bar("=")}\n${all.map(row).join("\n")}\n${bar("-")}\n`);

        if (excludedModulesList.length) {
            console.log(`\n🚫 Excluded Modules (ASCII):\n`);
            console.log(`${bar("-")}\n${row(HEADERS)}\n${bar("=")}\n${excludedModulesList.map(row).join("\n")}\n${bar("-")}\n`);
        }
    }

    return;
}

// Run once immediately to confirm it's loaded
generateUpdateReport("help");
