if (!window._excludedModules) window._excludedModules = new Set();

const excludedModules = window._excludedModules;

function cleanText(text) {
    return text.replace(/<a[^>]*>|<\/a>/g, "")
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
        if (match) {
            machine = match[1].toLowerCase();
        }
    }

    let tempCell = cell.cloneNode(true);
    tempCell.querySelectorAll("div").forEach(div => div.remove());
    let human = cleanText(tempCell.textContent);
    return { machine, human };
}

function isSecurityUpdate(row) {
    return row.innerHTML.toLowerCase().includes("security") || row.querySelector(".update-security");
}

function extractTableData(table, targetArray, isCore = false, securityOnly = false) {
    if (!table) return;
    table.querySelectorAll("tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if (!cells.length) return;
        if (securityOnly && !isSecurityUpdate(row)) return;

        let nameCell = cells[isCore ? 0 : 1];
        let { machine, human } = extractModuleNames(nameCell);

        if (!machine || excludedModules.has(machine)) return;

        let installedVersion = cleanVersion(cleanText(cells[isCore ? 1 : 2]?.textContent || ""));
        let recommendedVersion = cleanVersion(cleanText(cells[isCore ? 2 : 3]?.textContent || ""));

        if (installedVersion && recommendedVersion && installedVersion !== recommendedVersion) {
            targetArray.push([machine, human, installedVersion, recommendedVersion]);
        }
    });
}

function generateAsciiTable(coreUpdates, contribUpdates) {
    const headers = ["Module Name", "Installed Version", "Recommended Version"];
    let filteredUpdates = coreUpdates.concat(contribUpdates).filter(([machine]) => !excludedModules.has(machine));

    if (!filteredUpdates.length) {
        console.log("No updates found.");
        return;
    }

    const colWidths = headers.map((header, i) => Math.max(header.length, ...filteredUpdates.map(row => row[i + 1].length)));
    const separator = `+${colWidths.map(w => '-'.repeat(w + 2)).join('+')}+`;

    const formatRow = row => `| ${row.map((cell, i) => cell.padEnd(colWidths[i])).join(" | ")} |`;

    let output = [
        separator,
        formatRow(headers),
        separator,
        ...filteredUpdates.map(row => formatRow(row.slice(1))),
        separator
    ].join('\n');

    console.log(output);
}

function generateCommitMessage(coreUpdates, contribUpdates) {
    let message = `Update Drupal modules\n\n`;

    let filteredCore = coreUpdates.filter(([machine]) => !excludedModules.has(machine));
    let filteredContrib = contribUpdates.filter(([machine]) => !excludedModules.has(machine));

    if (filteredCore.length) {
        message += "Core updates:\n";
        filteredCore.forEach(([machine, human, from, to]) => {
            message += `- ${human} (${from} → ${to})\n`;
        });
        message += "\n";
    }

    if (filteredContrib.length) {
        message += "Contrib module updates:\n";
        filteredContrib.forEach(([machine, human, from, to]) => {
            message += `- ${human} (${from} → ${to})\n`;
        });
    }

    console.log(message.trim());
}

function generateComposerCommand(coreUpdates, contribUpdates) {
    let commands = [];

    coreUpdates.forEach(([machine, human, from, to]) => {
        if (!excludedModules.has(machine) && human.toLowerCase().includes("drupal core")) {
            commands.push(`drupal/core-recommended:^${to}`);
            commands.push(`drupal/core-composer-scaffold:^${to}`);
            commands.push(`drupal/core-project-message:^${to}`);
        }
    });

    contribUpdates.forEach(([machine, human, from, to]) => {
        if (!excludedModules.has(machine)) {
            commands.push(`drupal/${machine}:^${to}`);
        }
    });

    if (!commands.length) {
        console.log("No composer commands to generate.");
        return;
    }

    console.log(`\ncomposer require -W ${commands.join(" ")}`);
}

function runAllTests(coreUpdates, contribUpdates) {
    console.log("Running all tests...\n");
    generateAsciiTable(coreUpdates, contribUpdates);
    generateCommitMessage(coreUpdates, contribUpdates);
    generateComposerCommand(coreUpdates, contribUpdates);
    console.log("\nTesting complete.");
}

function generateUpdateReport(action = "csv", filter = "all") {
    if (action === "help") {
        console.log(`
✅ 'generateUpdateReport' is ready to use

📦 REPORT OUTPUT
🔹 generateUpdateReport();                      → Run all outputs for testing (default)
🔹 generateUpdateReport("ascii");               → ASCII table of all updates
🔹 generateUpdateReport("commit");              → Commit message for all updates
🔹 generateUpdateReport("composer");            → Composer command for all updates
🔹 generateUpdateReport("exclude_list");        → View excluded modules
🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list
🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from the exclude list
`);
        return;
    }

    let coreUpdates = [], contribUpdates = [];
    let securityOnly = filter === "security";

    extractTableData(document.querySelector("table#edit-manual-updates"), coreUpdates, true, securityOnly);
    extractTableData(document.querySelector("table#edit-projects") || document.querySelector("table.update"), contribUpdates, false, securityOnly);

    if (action === "ascii") generateAsciiTable(coreUpdates, contribUpdates);
    else if (action === "commit") generateCommitMessage(coreUpdates, contribUpdates);
    else if (action === "composer") generateComposerCommand(coreUpdates, contribUpdates);
    else if (action === "all") runAllTests(coreUpdates, contribUpdates);
    else console.log("❌ Unknown command. Use generateUpdateReport('help') for usage.");
}

// Automatically run all outputs for testing
generateUpdateReport("help");

