(function () {
    const TOOL_VERSION = "v5.0";
    console.log(`🚀 Drupal Update Report Tool (${TOOL_VERSION}) initialized.`);

    const HEADERS = ["Name", "Status", "Installed", "Recommended"];
    const excludedModules = window._excludedModules || new Set();
    window._excludedModules = excludedModules;

    // Updated to return the date in DD/MM/YYYY format
    function getCurrentDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');  // Ensure 2 digits for day
        const month = String(date.getMonth() + 1).padStart(2, '0');  // Ensure 2 digits for month
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;  // Return in DD/MM/YYYY format
    }

    function compareVersions(v1, v2) {
        const a = v1.split('.').map(Number);
        const b = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const n1 = a[i] || 0;
            const n2 = b[i] || 0;
            if (n1 > n2) return 1;
            if (n1 < n2) return -1;
        }
        return 0;
    }

    function getCurrentCoreVersion() {
        const coreText = document.querySelector('.update-status')?.innerText || '';
        const match = coreText.match(/Drupal\s+(\d+\.\d+\.\d+)/i);
        return match ? match[1] : "0.0.0";
    }

    const currentCore = getCurrentCoreVersion();
    console.log("Current Core Version: ", currentCore);  // Log to verify core version

    function sanitizeVersion(version) {
        // Remove any invalid parts of the version string like "^8.x-" and ensure it's valid for Composer
        return version.replace(/^8\.x-/, "");
    }

    function fetchUpdateData() {
        const updates = [];

        document.querySelectorAll("table.update tbody tr").forEach(row => {
            const link = row.querySelector(".project-update__title a");
            const name = link?.innerText.trim() || "N/A";

            // Extract machine name from project link
            const projectLink = link?.href || '';
            const machineMatch = projectLink.match(/project\/([^\/]+)/);
            const machine = machineMatch ? machineMatch[1] : name.toLowerCase().replace(/\s+/g, '_');

            const installed = (row.querySelector(".project-update__title")?.innerText.replace(name, "").trim()) || "N/A";
            const recommended = row.querySelector(".project-update__version--recommended a")?.innerText.trim() || "N/A";
            const statusText = row.querySelector(".project-update__status span")?.innerText || '';
            const compatibilityText = row.querySelector('.project-update__compatibility-details')?.innerText || '';

            let status = "update"; // Default to "update" for valid updates

            // Handle if the module is up-to-date
            if (/up to date/i.test(statusText)) {
                status = "current";
            }
            // Handle security updates
            else if (/security update required/i.test(statusText)) {
                status = "security";
            }
            // Handle not supported
            else if (/not supported/i.test(statusText)) {
                if (installed !== recommended) {
                    const match = compatibilityText.match(/Requires Drupal core:\s*([\d\.]+)\s*to\s*([\d\.]+)/i);
                    if (match) {
                        const min = match[1];
                        const max = match[2];
                        // Check if current core version is within the recommended range
                        if (compareVersions(currentCore, min) >= 0 && compareVersions(currentCore, max) <= 0) {
                            status = "updatable"; // Mark as updatable if a new version is available that resolves unsupported issue
                        } else {
                            status = "unsupported"; // No compatible version available
                        }
                    } else {
                        status = "unsupported"; // If no compatibility info, mark as unsupported
                    }
                } else {
                    status = "updatable"; // If installed is not equal to recommended, mark as updatable
                }
            }

            // Add the processed data into the data array
            if (!excludedModules.has(machine.toLowerCase())) {
                updates.push({ name, machine, status, installed, recommended });
            }
        });

        return updates;
    }

    function generateAsciiTable(data) {
        const colWidths = HEADERS.map(h => Math.max(h.length, ...data.map(d => (d[h.toLowerCase()] || '').length)));
        const makeLine = (char) => '+' + colWidths.map(w => char.repeat(w + 2)).join('+') + '+';
        const formatRow = row => '| ' + HEADERS.map((h, i) => (row[h.toLowerCase()] || '').padEnd(colWidths[i])).join(' | ') + ' |';

        const lines = [];
        lines.push(makeLine('-'));
        lines.push(formatRow(Object.fromEntries(HEADERS.map(h => [h.toLowerCase(), h]))));
        lines.push(makeLine('='));
        data.forEach(d => lines.push(formatRow(d)));
        lines.push(makeLine('-'));

        console.log("```\n" + lines.join('\n') + "\n```");
    }

    function generateCommitMessage(data) {
        const date = getCurrentDate();
        let out = `Drupal updates - ${date}`;
        const sections = { core: [], modules: [], themes: [] };

        data.forEach(u => {
            // Skip 'current' and 'unsupported' modules
            if (u.status === "current" || u.status === "unsupported") return;

            let statusLabel = u.status !== "update" ? ` [${u.status}]` : "";  // Add status label if it's not 'update'
            const entry = `${u.name}${statusLabel} (${u.installed} → ${u.recommended})`;

            if (u.name.toLowerCase().includes("core")) {
                sections.core.push(entry);
            } else if (u.name.toLowerCase().includes("theme")) {
                sections.themes.push(entry);
            } else {
                sections.modules.push(entry);
            }
        });

        if (sections.core.length) out += "\n\nCore updates:\n- " + sections.core.join("\n- ");
        if (sections.modules.length) out += "\n\nModule updates:\n- " + sections.modules.join("\n- ");
        if (sections.themes.length) out += "\n\nTheme updates:\n- " + sections.themes.join("\n- ");

        console.log(out);
    }

    function generateComposerCommand(data) {
        const lines = [];
        data.forEach(u => {
            if (["unsupported", "current"].includes(u.status)) return;

            // Sanitize version before adding to composer
            const sanitizedVersion = sanitizeVersion(u.recommended);

            if (u.name.toLowerCase().includes("core")) {
                lines.push(`drupal/core-recommended:^${sanitizedVersion}`);
                lines.push(`drupal/core-composer-scaffold:^${sanitizedVersion}`);
                lines.push(`drupal/core-project-message:^${sanitizedVersion}`);
                lines.push(`drupal/core:^${sanitizedVersion}`);
            } else {
                lines.push(`drupal/${u.machine}:^${sanitizedVersion}`);
            }
        });

        if (lines.length) {
            console.log("composer require -W " + lines.join(" "));
        } else {
            console.log("✅ No composer updates required.");
        }
    }

    function exportCSV(data) {
        const rows = [
            HEADERS,
            ...data.map(u => [u.name, u.status, u.installed, u.recommended])
        ];

        const csv = rows.map(row => row.map(quoteCSV).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });

        // Get the current domain for the filename
        const domain = window.location.hostname;
        // Replace '/' in the date with '-' for a valid filename
        const date = getCurrentDate().replace(/\//g, '-');
        const fileName = `drupal_updates_${domain}_${date}.csv`;

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Helper function to quote CSV values
    function quoteCSV(val) {
        val = String(val).replace(/"/g, '""');
        return /["\n\r,]/.test(val) ? `"${val}"` : val;
    }

    window.generateUpdateReport = function(type = "help") {
        if (type === "help" || !type) {
            console.log('✅ "generateUpdateReport" is ready to use');
            console.log('📦 REPORT OUTPUT OPTIONS:\n');
            console.log('🔹 generateUpdateReport("ascii"); → Display updates in an ASCII table');
            console.log('🔹 generateUpdateReport("commit"); → Generate commit message');
            console.log('🔹 generateUpdateReport("json"); → Output updates as JSON');
            console.log('🔹 generateUpdateReport("composer"); → Generate composer require command');
            console.log('🔹 generateUpdateReport("csv"); → Export CSV of updates');
            console.log('\n🧰 EXCLUDE OPTIONS:\n');
            console.log('🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list');
            console.log('🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from');
            return;
        }

        if (type === "add_exclude") {
            excludedModules.add(arguments[1].toLowerCase());
            console.log(`🛑 Excluded: ${arguments[1]}`);
            return;
        }
        if (type === "remove_exclude") {
            excludedModules.delete(arguments[1].toLowerCase());
            console.log(`✅ Removed from exclude: ${arguments[1]}`);
            return;
        }
        if (type === "exclude_list") {
            console.log([...excludedModules].sort().join("\n") || "No exclusions");
            return;
        }

        const updates = fetchUpdateData().filter(u => u.status !== "current");
        if (!updates.length) return console.log("✅ No updates found.");

        if (type === "ascii") generateAsciiTable(updates);
        else if (type === "commit") generateCommitMessage(updates);
        else if (type === "composer") generateComposerCommand(updates);
        else if (type === "json") console.log(JSON.stringify(updates, null, 2));
        else if (type === "csv") exportCSV(updates);  // CSV export
        else console.log("Unknown type.");
    };

    generateUpdateReport("help");
})();
