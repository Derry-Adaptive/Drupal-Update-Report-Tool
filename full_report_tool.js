/**
 * TOOL CONTEXT FOR CHATGPT AND OTHER REVIEW TOOLS
 * -----------------------------------------------
 * This script is:
 * - A SELF-CONTAINED TOOL intended for browser BOOKMARKLET use only.
 * - Post-processed (minified and URI-encoded) by a separate script.
 * - Meant to run on a CLIENT-SIDE Drupal admin page (no server).
 *
 * DO NOT RECOMMEND:
 * - Module systems (ESM/CommonJS)
 * - Security headers (CSP, etc.)
 * - Async loading or server-side fetching
 * - External JS libraries or CDNs
 * - Framework use (React, Vue, etc.)
 *
 * FOCUS ONLY ON:
 * - JavaScript logic bugs
 * - DOM scraping improvements
 * - Output formatting issues
 * - Optional console UX or debug helpers
 *
 * ✅ Bookmarklet-safe by design. No external dependencies. No persistence.
 */
(function () {
    const TOOL_VERSION = "v5.6";
    console.log(`🚀 Drupal Update Report Tool (${TOOL_VERSION}) initialized.`);

    const HEADERS = ["Name", "Status", "Installed", "Recommended"];
    const excludedModules = window._excludedModules || new Set();
    window._excludedModules = excludedModules;

    function getCurrentDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function getCurrentCoreVersion() {
        const coreText = document.querySelector('.update-status')?.innerText || '';
        const match = coreText.match(/Drupal\s+(\d+\.\d+\.\d+)/i);
        return match ? match[1] : "0.0.0";
    }

    const currentCore = getCurrentCoreVersion();
    console.log("Current Core Version: ", currentCore);

    function sanitizeVersion(version) {
        return version.replace(/^8\.x-/, "").trim();
    }

    function fetchUpdateData() {
        const updates = [];

        document.querySelectorAll("table.update tbody tr").forEach(row => {
            const titleCell = row.querySelector(".project-update__title");
            const rawTitle = titleCell?.textContent.trim() || '';
            const titleParts = rawTitle.split(/\s{2,}/);

            let name = titleParts[0] || "N/A";
            const installed = sanitizeVersion(titleParts[1] || "N/A");

            const link = titleCell?.querySelector("a");
            if (link) {
                name = link.innerText.trim();
            }

            const projectLink = link?.href || '';
            const machineMatch = projectLink.match(/project\/([^\/]+)/);
            const machine = machineMatch ? machineMatch[1] : name.toLowerCase().replace(/\s+/g, '_');

            const recommendedRaw = row.querySelector(".project-update__version--recommended a")?.innerText.trim() || "N/A";
            const recommended = sanitizeVersion(recommendedRaw);

            const latestRaw = row.querySelector(".version-latest.project-update__version a")?.innerText.trim() || recommendedRaw;
            const latest = sanitizeVersion(latestRaw);

            const statusText = row.querySelector(".project-update__status")?.textContent.trim().toLowerCase() || '';
            const statusHtml = row.querySelector(".project-update__status")?.innerHTML.toLowerCase() || '';
            const compatibilityText = row.querySelector('.project-update__compatibility-details')?.innerText || '';

            let status = "update";

            if (statusText.includes("up to date")) {
                status = "current";
            } else if (statusText.includes("security update required")) {
                status = "security";
            } else if (statusText.includes("not supported")) {
                const isCompatible = row.querySelector('.project-update__compatibility-details .compatible');
                status = isCompatible ? "updatable" : "unsupported";
            } else if (statusHtml.includes("no available releases found")) {
                status = "unsupported";
            }

            if (!excludedModules.has(machine.toLowerCase())) {
                updates.push({ name, machine, status, installed, recommended, latest, compatibilityText });
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
            let statusLabel = u.status !== "update" ? ` [${u.status}]` : "";
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

    function generateComposerCommand(data, useLatest = false) {
        const lines = [];
        data.forEach(u => {
            const targetVersion = useLatest ? u.latest : u.recommended;
            if (
                u.status === "unsupported" ||
                u.installed === targetVersion
            ) {
                return;
            }

            if (u.name.toLowerCase().includes("core")) {
                lines.push(`drupal/core-recommended:^${targetVersion}`);
                lines.push(`drupal/core-composer-scaffold:^${targetVersion}`);
                lines.push(`drupal/core-project-message:^${targetVersion}`);
                lines.push(`drupal/core:^${targetVersion}`);
            } else {
                lines.push(`drupal/${u.machine}:^${targetVersion}`);
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

        const domain = window.location.hostname;
        const date = getCurrentDate().replace(/\//g, '-');
        const fileName = `drupal_updates_${domain}_${date}.csv`;

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;

        a.addEventListener('click', () => {
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function quoteCSV(val) {
        val = String(val).replace(/"/g, '""');
        return /["\n\r,]/.test(val) ? `"${val}"` : val;
    }

    window.generateUpdateReport = function (action = "help", name = "", scope = ["security", "updatable", "update"], version = "recommended") {
        if (action === "help" || !action) {
            console.log('✅ "generateUpdateReport" is ready to use');
            console.log('📦 REPORT OUTPUT OPTIONS:\n');
            console.log('🔹 generateUpdateReport("ascii"); → Display updates in an ASCII table');
            console.log('🔹 generateUpdateReport("commit"); → Generate commit message');
            console.log('🔹 generateUpdateReport("json"); → Output updates as JSON');
            console.log('🔹 generateUpdateReport("composer"); → Generate composer require command');
            console.log('🔹 generateUpdateReport("composer", "", ["all"], "latest"); → Use latest available versions (e.g. beta/dev)');
            console.log('🔹 generateUpdateReport("csv"); → Export CSV of updates');
            console.log('\n🧰 EXCLUDE OPTIONS:\n');
            console.log('🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list');
            console.log('🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from the exclude list');
            console.log('🔹 generateUpdateReport("exclude_list"); → List all currently excluded modules');
            return;
        }

        if (action === "add_exclude") {
            excludedModules.add(name.toLowerCase());
            console.log(`🛑 Excluded: ${name}`);
            return;
        }
        if (action === "remove_exclude") {
            excludedModules.delete(name.toLowerCase());
            console.log(`✅ Removed from exclude: ${name}`);
            return;
        }
        if (action === "exclude_list") {
            console.log([...excludedModules].sort().join("\n") || "No exclusions");
            return;
        }

        let updates;
        if (scope.includes("excluded")) {
            updates = fetchUpdateData().filter(u => excludedModules.has(u.machine.toLowerCase()));
        } else if (scope.includes("all")) {
            updates = fetchUpdateData();
        } else {
            updates = fetchUpdateData().filter(u => scope.includes(u.status));
        }

        if (!updates.length) return console.log("✅ No updates found for selected scope.");

        if (action === "ascii") generateAsciiTable(updates);
        else if (action === "commit") generateCommitMessage(updates);
        else if (action === "composer") generateComposerCommand(updates, version === "latest");
        else if (action === "json") console.log(JSON.stringify(updates, null, 2));
        else if (action === "csv") exportCSV(updates);
        else console.log("❓ Unknown report type.");
    };

    generateUpdateReport("help");
})();
