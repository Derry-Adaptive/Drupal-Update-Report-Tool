(() => {
  console.log("✨ Drupal Update Report Tool (v7.6) initialized.");

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
      version = "recommended"
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
        let machine = (rawMachine === "drupal" && name.toLowerCase().includes("core")) ? "core" : rawMachine;

        let recommended = cleanVersion(
            row.querySelector(".project-update__version--recommended a")?.textContent.trim() || "N/A"
        );
        let latest = cleanVersion(
            row.querySelector(".version-latest.project-update__version a")?.textContent.trim() || recommended
        );

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

        const fullMachine = `drupal/${machine}`.toLowerCase();
        const overrideVersion = override[fullMachine];
        const isOverridden = !!overrideVersion;
        const effectiveRecommended = overrideVersion || recommended;

        let effectiveStatus = status;
        if (
            isOverridden &&
            status !== "unsupported" &&
            installed !== overrideVersion
        ) {
          effectiveStatus =
              status === "security" ? "security (overridden)" : "overridden";
        }

        projects.push({
          name,
          machine,
          status: effectiveStatus,
          installed,
          recommended: effectiveRecommended,
          latest,
          isOverridden
        });
      });
      return projects;
    }

    if (action === "help") {
      console.log('✅ "generateUpdateReport(action, options)" is ready to use');
      console.log('📦 Actions: "ascii", "csv", "json", "commit", "composer"');
      console.log("🧰 Options: { scope, override, version }");
      console.log('🔹 Example: generateUpdateReport("composer", { scope: ["all"], override: { "drupal/core": "10.4.8" } })');
      return;
    }

    if (!action) {
      console.warn("⚠️ No action specified. Use generateUpdateReport('help') for usage.");
      return;
    }

    const rows =
        scope.includes("all") ? getProjects() : getProjects().filter((p) => scope.includes(p.status));

    if (!rows.length) {
      console.log("✅ No updates found for selected scope.");
      return;
    }

    if (action === "ascii") {
      const widths = headers.map((h) => Math.max(h.length, ...rows.map((r) => (r[h.toLowerCase()] || "").length)));
      const sep = (c) => "+" + widths.map((w) => c.repeat(w + 2)).join("+") + "+";
      const rowStr = (r) =>
          "| " +
          headers
              .map((h, i) => (r[h.toLowerCase()] || "").padEnd(widths[i]))
              .join(" | ") +
          " |";

      console.log("```\n" + [sep("-"), rowStr(Object.fromEntries(headers.map((h) => [h.toLowerCase(), h]))), sep("="), ...rows.map(rowStr), sep("-")].join("\n") + "\n```");
    } else if (action === "commit") {
      let output = "Drupal updates - " + today();
      const sections = { core: [], modules: [], themes: [] };

      rows.forEach((p) => {
        const entry = `${p.name} [${p.status}] (${p.installed} → ${p.recommended})`;
        const lower = p.name.toLowerCase();
        if (lower.includes("core")) sections.core.push(entry);
        else if (lower.includes("theme")) sections.themes.push(entry);
        else sections.modules.push(entry);
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
        const versionString = p.isOverridden ? version : `^${version}`;

        // ✅ Now include overrides even if already installed
        if (p.status !== "unsupported" && (p.installed !== version || p.isOverridden)) {
          if (fullMachine === "drupal/core") {
            output.push(`drupal/core-recommended:${versionString}`);
            output.push(`drupal/core-composer-scaffold:${versionString}`);
            output.push(`drupal/core-project-message:${versionString}`);
            output.push(`drupal/core:${versionString}`);
          } else {
            output.push(`${fullMachine}:${versionString}`);
          }
        }
      });

      output.length
          ? console.log("composer require -W " + output.join(" "))
          : console.log("✅ No composer updates required.");
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

  // Show help on load
  generateUpdateReport("help");
})();
