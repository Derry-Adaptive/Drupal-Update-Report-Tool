// Drupal Update Report Tool v8.1 (always show overridden status)
(() => {
  console.log("✨ Drupal Update Report Tool (v8.2) initialized.");

  const headers = ["Name", "Status", "Installed", "Recommended"];

  function today() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  }

  function cleanVersion(v) {
    return v.replace(/^8\.x-/, "").trim();
  }

  function escapeCSV(str) {
    str = String(str).replace(/"/g, '""');
    return /["\n\r,]/.test(str) ? `"${str}"` : str;
  }

  window.generateUpdateReport = function (action = "help", options = {}) {
    let {
      scope = ["security", "updatable", "update"],
      override = {},
      version = "recommended",
      wrap = false
    } = options;

    override = Object.fromEntries(
        Object.entries(override).map(([k, v]) => [k.toLowerCase(), v])
    );

    function getProjects() {
      const projects = [];
      document.querySelectorAll("table.update tbody tr").forEach((row) => {
        let titleEl = row.querySelector(".project-update__title");
        let parts = (titleEl?.textContent.trim() || "").split(/\s{2,}/);
        let name = parts[0] || "N/A";
        let installed = cleanVersion(parts[1] || "N/A");

        const anchor = titleEl?.querySelector("a");
        if (anchor) name = anchor.textContent.trim();
        let rawMachine = anchor?.href?.match(/project\/([^\/]+)/)?.[1] || name.toLowerCase().replace(/\s+/g, "_");
        let isDrupalCore = rawMachine === "drupal" && /^drupal(?: core)?$/i.test(name.trim());
        let machine = isDrupalCore ? "core" : rawMachine;

        const fullMachine = `drupal/${machine}`.toLowerCase();
        const overrideVersion = override[fullMachine];
        const isOverridden = !!overrideVersion;

        const recommendedCell = row.querySelector(".project-update__version--recommended");
        const isIncompatible = !!recommendedCell?.querySelector("details.not-compatible");
        let recommendedVersion = cleanVersion(
            recommendedCell?.querySelector("a")?.textContent.trim() || "N/A"
        );

        if (isIncompatible) {
          recommendedVersion = installed;
        }

        let statusText = row.querySelector(".project-update__status")?.textContent.toLowerCase() || "";
        let statusHTML = row.querySelector(".project-update__status")?.innerHTML.toLowerCase() || "";
        let status = "update";

        if (statusText.includes("up to date")) status = "current";
        else if (statusText.includes("security update required")) status = "security";
        else if (statusText.includes("not supported")) {
          const compat = row.querySelector(".project-update__compatibility-details .compatible");
          status = compat ? "updatable" : "unsupported";
        } else if (statusHTML.includes("no available releases")) {
          status = "unsupported";
        }

        if (isIncompatible) {
          status = "unsupported";
        }

        // ✅ Updated override logic — always mark overridden
        if (isOverridden && status !== "unsupported") {
          status = status === "security" ? "security (overridden)" : "overridden";
        }

        projects.push({
          name,
          machine,
          status,
          installed,
          recommended: overrideVersion || recommendedVersion,
          latest: recommendedVersion,
          isOverridden
        });
      });
      return projects;
    }

    const rows = getProjects().filter((p) => {
      return (
          scope.includes("all") ||
          scope.includes(p.status) ||
          (p.isOverridden && p.installed !== p.recommended)
      );
    });

    if (action === "help") {
      console.log('✅ "generateUpdateReport(action, options)" is ready to use');
      console.log('📦 Actions: "ascii", "csv", "json", "commit", "composer", "composer-json"');
      console.log("🧰 Options: { scope, override, version, wrap }");
      console.log('🔹 Example: generateUpdateReport("composer", { override: { "drupal/core": "10.4.8", "drupal/yoast_seo": "2.2" } })');
      return;
    }

    if (!rows.length) {
      console.log("✅ No updates found for selected scope.");
      return;
    }

    if (action === "ascii") {
      const widths = headers.map((h) => Math.max(h.length, ...rows.map((r) => (r[h.toLowerCase()] || "").length)));
      const sep = (c) => "+" + widths.map((w) => c.repeat(w + 2)).join("+") + "+";
      const rowStr = (r) =>
          "| " + headers.map((h, i) => (r[h.toLowerCase()] || "").padEnd(widths[i])).join(" | ") + " |";
      console.log("```\n" + [sep("-"), rowStr(Object.fromEntries(headers.map((h) => [h.toLowerCase(), h]))), sep("="), ...rows.map(rowStr), sep("-")].join("\n") + "\n```");
    } else if (action === "commit") {
      let output = "Drupal updates - " + today();
      const sections = { core: [], modules: [], themes: [] };
      rows.forEach((p) => {
        const entry = `${p.name} [${p.status}] (${p.installed} → ${p.recommended})`;
        if (p.machine === "core") {
          sections.core.push(entry);
        } else if (p.machine.includes("theme")) {
          sections.themes.push(entry);
        } else {
          sections.modules.push(entry);
        }
      });
      if (sections.core.length) output += "\n\nCore updates:\n- " + sections.core.join("\n- ");
      if (sections.modules.length) output += "\n\nModule updates:\n- " + sections.modules.join("\n- ");
      if (sections.themes.length) output += "\n\nTheme updates:\n- " + sections.themes.join("\n- ");
      console.log(output);
    } else if (action === "composer") {
      const output = [];
      rows.forEach((p) => {
        const fullMachine = `drupal/${p.machine}`.toLowerCase();
        const version = override[fullMachine] || p.recommended;
        if ((p.status !== "unsupported" || p.isOverridden) && (p.installed !== version || p.isOverridden)) {
          if (fullMachine === "drupal/core") {
            output.push(`"drupal/core-recommended:${version}"`);
            output.push(`"drupal/core-composer-scaffold:${version}"`);
            output.push(`"drupal/core-project-message:${version}"`);
            output.push(`"drupal/core:${version}"`);
          } else {
            output.push(`"${fullMachine}:${version}"`);
          }
        }
      });
      output.length
          ? console.log("composer require -W " + output.join(" "))
          : console.log("✅ No composer updates required.");
    } else if (action === "composer-json") {
      const jsonOutput = {};
      rows.forEach((p) => {
        const fullMachine = `drupal/${p.machine}`.toLowerCase();
        const version = override[fullMachine] || p.recommended;
        if ((p.status !== "unsupported" || p.isOverridden) && (p.installed !== version || p.isOverridden)) {
          if (fullMachine === "drupal/core") {
            jsonOutput["drupal/core"] = version;
            jsonOutput["drupal/core-recommended"] = version;
            jsonOutput["drupal/core-composer-scaffold"] = version;
            jsonOutput["drupal/core-project-message"] = version;
          } else {
            jsonOutput[fullMachine] = version;
          }
        }
      });
      console.log(wrap ? JSON.stringify({ require: jsonOutput }, null, 2) : JSON.stringify(jsonOutput, null, 2));
    } else if (action === "json") {
      console.log(JSON.stringify(rows, null, 2));
    } else if (action === "csv") {
      const content = [headers, ...rows.map((r) => [r.name, r.status, r.installed, r.recommended])]
          .map((row) => row.map(escapeCSV).join(","))
          .join("\n");
      const blob = new Blob([content], { type: "text/csv" });
      const filename = `drupal_updates_${location.hostname}_${today().replace(/\//g, "-")}.csv`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      document.body.removeChild(a);
    } else {
      console.warn("❓ Unknown report type. Use generateUpdateReport('help') for options.");
    }
  };

  generateUpdateReport("help");
})();
