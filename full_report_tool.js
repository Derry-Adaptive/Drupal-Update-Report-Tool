(function() {
    'use strict';

    const TOOL_VERSION = "v4.2";
    console.log(`🚀 Initializing Drupal Update Report Tool (${TOOL_VERSION})...`);

    const STANDARD_HEADERS = ["Name", "Site Version", "Recommended Version", "Status", "Required Core Version"];
    let allFilteredUpdates = []; // This will store the updates extracted from the page
    let isDataFetched = false; // Flag to check if the data has been fetched already

    // Example exclusion list (you can modify this logic as needed)
    function getExclusionList() {
        return []; // Modify this list as needed
    }

    // Function to fetch update data from all tables with the class 'update'
    function fetchUpdateData() {
        if (isDataFetched) {
            console.log("✅ Data already fetched.");
            return allFilteredUpdates; // Return already fetched data
        }

        console.log("Fetching update data from the page...");
        const tables = document.querySelectorAll(".update"); // Target all tables with the 'update' class
        const updates = [];

        tables.forEach((table, tableIndex) => {
            const updateRows = table.querySelectorAll("tbody tr"); // Find all rows in the table
            updateRows.forEach((row, rowIndex) => {
                const moduleNameElement = row.querySelector(".project-update__title a");
                const installedVersionElement = row.querySelector(".project-update__title");
                const recommendedVersionElement = row.querySelector(".project-update__version--recommended");
                const releaseNotesLink = row.querySelector(".project-update__release-notes-link a");
                const statusElement = row.querySelector(".project-update__status span");
                const compatibilityElement = row.querySelector(".project-update__compatibility-details .claro-details__wrapper");

                const moduleName = moduleNameElement ? moduleNameElement.textContent.trim() : "N/A";
                const installedVersion = installedVersionElement
                    ? installedVersionElement.textContent.replace(moduleName, "").trim()
                    : "N/A";
                const recommendedVersion = recommendedVersionElement
                    ? recommendedVersionElement.querySelector("a").textContent.trim()
                    : "N/A";
                const releaseNotes = releaseNotesLink ? releaseNotesLink.href : "N/A";
                const status = statusElement ? statusElement.textContent.trim() : "N/A";

                // Extract compatibility range if available
                const requiredCoreVersion = compatibilityElement
                    ? compatibilityElement.textContent.replace("Requires Drupal core:", "").trim()
                    : "N/A";

                // Use a single word for status: "update", "security", "current", or "unsupported"
                let statusType = "current"; // Default to "current"
                let statusMessage = ""; // Initialize the status message

                if (status.includes("Update available")) {
                    statusType = "update";
                } else if (status.includes("Security update required")) {
                    statusType = "security";
                    statusMessage = "(Security Update)"; // Add message for security update
                } else if (status.includes("Unsupported update")) {
                    statusType = "unsupported";
                }

                const update = {
                    tableIndex: tableIndex + 1,
                    rowIndex: rowIndex + 1,
                    humanName: moduleName,
                    installedVersion: installedVersion,
                    recommendedVersion: recommendedVersion,
                    releaseNotes: releaseNotes,
                    status: statusType + statusMessage, // Add the security update message if applicable
                    requiredCoreVersion: requiredCoreVersion, // Compatibility range
                };

                updates.push(update);
            });
        });

        allFilteredUpdates = updates; // Store the fetched updates
        isDataFetched = true; // Mark the data as fetched
        return allFilteredUpdates;
    }

    // Map data to the standard format
    function mapUpdateToStandard(update) {
        return {
            "Name": update.humanName,
            "Site Version": update.installedVersion,
            "Recommended Version": update.recommendedVersion,
            "Status": update.status, // Single word status
            "Required Core Version": update.requiredCoreVersion || "", // If not defined, make it empty
        };
    }

    // Function to generate reports (csv, ascii, etc.)
    window.generateUpdateReport = function(type, name = null, scope = ["update", "security", "unsupported"]) {
        if (type === "help") {
            showHelp();
            return;
        }

        // Clean up and fetch data again on each report generation
        isDataFetched = false; // Reset the data fetch flag to ensure fresh data
        const updates = fetchUpdateData();  // Re-fetch data before generating the report

        // Clean up and sanitize scope (remove extra spaces and ensure it’s an array of strings)
        scope = Array.isArray(scope) ? scope.map(item => item.trim()) : [scope.trim()];

        // Apply exclusion list only when filtering
        const persistentExclusions = getExclusionList();
        const combinedExclusions = new Set(persistentExclusions);

        let dataToReport = [];

        // Apply scope filtering first
        if (Array.isArray(scope)) {
            // If scope is an array, match any scope in the array
            dataToReport = updates.filter(u => scope.includes(u.status));
        } else {
            // If scope is not an array, apply a single filter
            dataToReport = updates.filter(u => matchesScope(u, scope)); // Apply scope filter
        }

        // Apply exclusion list after scope filter
        if (persistentExclusions.length > 0) {
            dataToReport = dataToReport.filter(u => !combinedExclusions.has(u.humanName));
        }

        // Filter out "current" modules (Up to date)
        dataToReport = dataToReport.filter(function(obj) {
            return obj.status !== "current";  // Only keep modules with status other than "current"
        });

        if (dataToReport.length === 0) {
            console.log("✅ No modules match the specified criteria.");
            return;
        }

        // Process data as JSON first
        const jsonData = dataToReport.map(mapUpdateToStandard); // Map to standard format

        // Now, use jsonData to generate reports of different types
        switch (type.toLowerCase()) {
            case "commit":
                console.log(generateCommitMessage(jsonData));
                break;

            case "csv":
                console.log(generateCSV(jsonData));
                break;

            case "ascii":
                console.log(generateASCII(jsonData));
                break;

            case "json":
                console.log(JSON.stringify(jsonData, null, 2));
                break;

            default:
                console.log("❓ Unknown report type: '" + type + "'");
        }
    };

    // Define matchesScope function
    function matchesScope(update, scope) {
        return scope === update.status;
    }

    // Generate Commit Message with Section Headers for Core, Modules, Themes
    function generateCommitMessage(data) {
        const date = new Date().toISOString().split("T")[0];  // Get current date (YYYY-MM-DD)
        let output = `\nUpdate Drupal modules (${date})`;  // Header with date

        // Group updates by type
        let coreUpdates = [];
        let moduleUpdates = [];
        let themeUpdates = [];

        data.forEach(update => {
            if (update["Name"].toLowerCase().includes("core")) {
                coreUpdates.push(update);
            } else if (update["Name"].toLowerCase().includes("theme")) {
                themeUpdates.push(update);
            } else {
                moduleUpdates.push(update);
            }
        });

        // Add Core updates section if there are any
        if (coreUpdates.length > 0) {
            output += `\n\nCore updates:`;
            coreUpdates.forEach(update => {
                output += `\n${update["Name"]} (${update["Site Version"]} → ${update["Recommended Version"]})`;
            });
        }

        // Add Module updates section if there are any
        if (moduleUpdates.length > 0) {
            output += `\n\nModule updates:`;
            moduleUpdates.forEach(update => {
                output += `\n${update["Name"]} (${update["Site Version"]} → ${update["Recommended Version"]})`;
            });
        }

        // Add Theme updates section if there are any
        if (themeUpdates.length > 0) {
            output += `\n\nTheme updates:`;
            themeUpdates.forEach(update => {
                output += `\n${update["Name"]} (${update["Site Version"]} → ${update["Recommended Version"]})`;
            });
        }

        return output;
    }

    // Generate CSV Report
    function generateCSV(data) {
        let output = "\n\"" + STANDARD_HEADERS.join('","') + "\"";
        data.forEach(row => {
            output += `\n"${row["Name"]}","${row["Site Version"]}","${row["Recommended Version"]}","${row["Status"]}","${row["Required Core Version"]}"`;
        });

        return output;
    }

    // Generate ASCII Report Dynamically (Fixing the Layout)
    function generateASCII(data) {
        let output = "+";

        // Calculate max width for each column
        const columnWidths = STANDARD_HEADERS.map(header => {
            return Math.max(...data.map(row => row[header].length), header.length); // Ensure the column width is enough for the longest value
        });

        // Add headers
        output += columnWidths.map((width, i) => `${'-'.repeat(width + 2)}+`).join('') + "\n";

        output += "|";
        STANDARD_HEADERS.forEach((header, i) => {
            output += ` ${header.padEnd(columnWidths[i])} |`;
        });
        output += "\n";

        output += "+";
        columnWidths.forEach(width => {
            output += `${'-'.repeat(width + 2)}+`;
        });
        output += "\n";

        // Data Rows
        data.forEach(row => {
            output += "|";
            STANDARD_HEADERS.forEach((header, i) => {
                output += ` ${row[header].padEnd(columnWidths[i])} |`;
            });
            output += "\n";
        });

        output += "+";
        columnWidths.forEach(width => {
            output += `${'-'.repeat(width + 2)}+`;
        });
        output += "\n";

        return output;
    }

    // Show help with line-by-line console logging
    function showHelp() {
        console.log("✅ Drupal Update Report Tool (" + TOOL_VERSION + ")");
        console.log("");
        console.log("Usage:");
        console.log("generateUpdateReport(type, name, scope);");
        console.log("");
        console.log("Available Types:");
        console.log("- csv        ➜ CSV report");
        console.log("- ascii      ➜ ASCII table report");
        console.log("- json       ➜ JSON formatted output");
        console.log("- composer   ➜ Composer require commands (auto-excludes incompatible updates)");
        console.log("- commit     ➜ Git commit message generator (structured by Core, Modules, Themes)");
        console.log("- pantheon   ➜ Pantheon URL generator");
        console.log("- add_exclude / remove_exclude / exclude_list ➜ Manage exclusion list");
        console.log("");
        console.log("Scopes:");
        console.log("- all             ➜ All modules/themes/core, including up-to-date");
        console.log("- updates         ➜ Only items needing updates (default behavior prior to v4.2)");
        console.log("- security        ➜ Security updates only");
        console.log("- unsupported     ➜ Unsupported updates only");
        console.log("- update available➜ Regular available updates (excluding security/unsupported)");
        console.log("");
        console.log("Report Columns:");
        console.log("\"" + STANDARD_HEADERS.join('", "') + "\"");
        console.log("");
        console.log("Notes:");
        console.log("- Composer & commit commands operate only on updates.");
        console.log("- Core-aware logic ensures safe compatibility filtering.");
    }
})();
