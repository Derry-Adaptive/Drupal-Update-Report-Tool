javascript:(() => {
    const H = ["Name", "Status", "Installed", "Recommended"];

    const ds = () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const cv = (v) => String(v || "").replace(/^8\.x-/, "").trim();

    const esc = (v) => {
        v = String(v ?? "").replace(/"/g, '""');
        return /[",\n\r]/.test(v) ? `"${v}"` : v;
    };

    const pv = (v) => {
        const m = String(v || "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
        return m
            ? [parseInt(m[1] || "0", 10), parseInt(m[2] || "0", 10), parseInt(m[3] || "0", 10)]
            : [0, 0, 0];
    };

    const cmp = (a, b) => {
        const [a1, a2, a3] = pv(a);
        const [b1, b2, b3] = pv(b);
        if (a1 !== b1) return a1 - b1;
        if (a2 !== b2) return a2 - b2;
        return a3 - b3;
    };

    const pick = (installed, candidates) => {
        const [maj] = pv(installed);
        const ok = candidates.filter((x) => x && x.isCompatible && x.v && x.v !== "N/A");
        if (!ok.length) return null;

        const same = ok.filter((x) => pv(x.v)[0] === maj);
        if (same.length) {
            same.sort((a, b) => cmp(a.v, b.v));
            return { ...same[same.length - 1], forcedMajor: false };
        }

        const higher = ok.filter((x) => pv(x.v)[0] > maj);
        if (higher.length) {
            higher.sort((a, b) => cmp(a.v, b.v));
            return { ...higher[0], forcedMajor: true };
        }

        return null;
    };

    const collect = (overrides) => {
        const out = [];

        document.querySelectorAll("table.update tbody tr").forEach((row) => {
            const title = row.querySelector(".project-update__title");
            const parts = (title?.textContent || "").trim().split(/\s{2,}/);

            let name = parts[0] || "N/A";
            let installed = cv(parts[1] || "N/A");

            const a = title?.querySelector("a");
            if (a?.textContent?.trim()) name = a.textContent.trim();

            let machine =
                a?.href?.match(/project\/([^/]+)/)?.[1] ||
                name.toLowerCase().replace(/\s+/g, "_");

            if (machine === "drupal" && /^drupal(?: core)?$/i.test(name.trim())) {
                machine = "core";
            }

            const pack = ("drupal/" + (machine === "core" ? "core" : machine)).toLowerCase();

            let st = row.querySelector(".project-update__status")?.textContent?.toLowerCase() || "";
            const sh = row.querySelector(".project-update__status")?.innerHTML?.toLowerCase() || "";

            let status = "update";

            if (st.includes("up to date")) {
                status = "current";
            } else if (st.includes("security update required")) {
                status = "security";
            } else if (st.includes("invalid version")) {
                status = "unsupported";
            } else if (st.includes("not supported")) {
                status = row.querySelector(".project-update__compatibility-details .compatible") ? "updatable" : "unsupported";
            } else if (sh.includes("no available releases")) {
                status = "unsupported";
            }

            const releases = [
                row.querySelector(".project-update__version--recommended"),
                ...row.querySelectorAll(".version-also-available"),
            ]
                .filter(Boolean)
                .map((node) => {
                    const v = cv(node.querySelector("a")?.textContent?.trim() || "N/A");
                    if (v === "N/A") return null;
                    const hasNotCompatible = !!node.querySelector("details.not-compatible");
                    return {
                        v,
                        isCompatible: !!node.querySelector(".compatible") || !hasNotCompatible,
                    };
                })
                .filter(Boolean);

            const chosen = pick(installed, releases);
            const latest = chosen ? chosen.v : "N/A";
            const forcedMajor = !!chosen?.forcedMajor;
            const noCompatible = !chosen;

            let recommended = latest;
            const isOverridden = Object.prototype.hasOwnProperty.call(overrides, pack);
            if (isOverridden) recommended = overrides[pack];

            if (status === "security" && noCompatible) {
                status = "security (no compatible release)";
            } else if (!String(status).startsWith("security") && noCompatible && status !== "current") {
                status = "unsupported";
            }

            if (forcedMajor) {
                if (String(status).startsWith("security")) {
                    status = "security (major upgrade)";
                } else if (status !== "current" && status !== "unsupported") {
                    status = "update (major)";
                }
            }

            if (
                (status === "update" || status === "updatable") &&
                latest !== "N/A" &&
                installed !== "N/A" &&
                cmp(latest, installed) > 0
            ) {
                const [rm] = pv(latest);
                const [im] = pv(installed);
                status = rm > im ? "update (major)" : "update";
            }

            if (isOverridden && !String(status).includes("unsupported")) {
                status = String(status).startsWith("security") ? "security (overridden)" : "overridden";
            }

            out.push({
                name,
                machine,
                status,
                installed,
                recommended,
                latest,
                pack,
                isOverridden,
                forcedMajor,
                noCompatible,
            });
        });

        return out;
    };

    const runReport = (action = "composer", options = {}) => {
        const scope = options.scope ?? ["security", "updatable", "update"];
        const wrap = !!options.wrap;

        const overrides = Object.fromEntries(
            Object.entries(options.override ?? {}).map(([k, v]) => [String(k).toLowerCase(), v])
        );

        const all = collect(overrides);

        const filtered = all.filter((item) => {
            if (scope.includes("all")) return true;
            if (item.status === "current") return scope.includes("current");
            if (String(item.status).startsWith("security")) return scope.includes("security");
            if (item.status === "overridden") return scope.includes("update");
            return scope.includes(item.status);
        });

        if (["ascii", "csv", "json", "commit", "composer", "composer-json"].includes(action) && !filtered.length) {
            return "✅ No items found for selected scope.";
        }

        if (action === "ascii") {
            const keys = H.map((x) => x.toLowerCase());
            const widths = H.map((head, i) => Math.max(head.length, ...filtered.map((r) => String(r[keys[i]] || "").length)));
            const line = (ch) => "+" + widths.map((w) => ch.repeat(w + 2)).join("+") + "+";
            const row = (obj) =>
                "| " +
                H.map((head, i) => String(obj[head.toLowerCase()] ?? "").padEnd(widths[i])).join(" | ") +
                " |";
            const headRow = Object.fromEntries(H.map((x) => [x.toLowerCase(), x]));
            return [line("-"), row(headRow), line("="), ...filtered.map(row), line("-")].join("\n");
        }

        if (action === "commit") {

            const groups = { core: [], modules: [], themes: [] };

            filtered.forEach((item) => {
                const line = `${item.name} [${item.status}] (${item.installed} → ${item.recommended})`;

                if (item.machine === "core") {
                    groups.core.push(line);
                } else if (String(item.machine).includes("theme")) {
                    groups.themes.push(line);
                } else {
                    groups.modules.push(line);
                }
            });

            let sections = [`Drupal updates - ${ds()}`];

            if (groups.core.length) {
                sections.push(
                    "Core updates:",
                    groups.core.map(v => `- ${v}`).join("\n")
                );
            }

            if (groups.modules.length) {
                sections.push(
                    "Module updates:",
                    groups.modules.map(v => `- ${v}`).join("\n")
                );
            }

            if (groups.themes.length) {
                sections.push(
                    "Theme updates:",
                    groups.themes.map(v => `- ${v}`).join("\n")
                );
            }

            return sections.join("\n\n");
        }

        if (action === "json") {
            return JSON.stringify(filtered, null, 2);
        }

        if (action === "csv") {
            const csv = [H, ...filtered.map((r) => [r.name, r.status, r.installed, r.recommended])]
                .map((row) => row.map(esc).join(","))
                .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const file = `drupal_updates_${location.hostname}_${ds().replace(/\//g, "-")}.csv`;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            document.body.removeChild(link);
            return `✅ CSV downloaded: ${file}`;
        }

        if (action === "composer-json") {
            const req = {};
            const warns = [];

            filtered.forEach((item) => {
                const pack = item.pack;
                const ver = item.recommended;

                if ((ver && ver !== "N/A") || item.isOverridden) {
                    if (String(item.status).includes("unsupported") && !item.isOverridden) return;
                    if (item.installed === ver && !item.isOverridden) return;

                    if (pack === "drupal/core") {
                        req["drupal/core"] = ver;
                        req["drupal/core-recommended"] = ver;
                        req["drupal/core-composer-scaffold"] = ver;
                        req["drupal/core-project-message"] = ver;
                    } else {
                        req[pack] = ver;
                    }
                } else if (String(item.status).startsWith("security")) {
                    warns.push(`${item.name} — ${item.status}`);
                }
            });

            let out = wrap ? JSON.stringify({ require: req }, null, 2) : JSON.stringify(req, null, 2);

            if (warns.length) {
                out += `\n\n⚠️ Security updates exist with no compatible release for your current core line:\n`;
                out += warns.map((w) => `- ${w}`).join("\n");
            }

            return out;
        }

        if (action === "composer") {
            const pkgs = [];
            const warns = [];

            filtered.forEach((item) => {
                const pack = item.pack;
                const ver = item.recommended;

                if ((ver && ver !== "N/A") || item.isOverridden) {
                    if (String(item.status).includes("unsupported") && !item.isOverridden) return;
                    if (item.installed === ver && !item.isOverridden) return;

                    if (pack === "drupal/core") {
                        pkgs.push(`"drupal/core-recommended:${ver}"`);
                        pkgs.push(`"drupal/core-composer-scaffold:${ver}"`);
                        pkgs.push(`"drupal/core-project-message:${ver}"`);
                        pkgs.push(`"drupal/core:${ver}"`);
                    } else {
                        pkgs.push(`"${pack}:${ver}"`);
                    }
                } else if (String(item.status).startsWith("security")) {
                    warns.push(`${item.name} — ${item.status}`);
                }
            });

            let out = pkgs.length
                ? "composer require -W \\\n  " + pkgs.join(" \\\n  ")
                : "✅ No composer updates required.";

            if (warns.length) {
                out += `\n\n⚠️ Security updates exist with no compatible release for your current core line:\n`;
                out += warns.map((w) => `- ${w}`).join("\n");
                out += `\n\n✅ Action: upgrade Drupal core to a compatible line, replace/remove the module, or apply an official fix if provided.`;
            }

            return out;
        }

        if (action === "modules") {
            const mods = all
                .filter((r) => !!r.machine)
                .map((r) => String(r.machine).toLowerCase())
                .sort((a, b) => a.localeCompare(b));

            return mods.length ? mods.join("\n") : "✅ No modules detected.";
        }

        if (action === "modules-csv") {
            const csv = [["Machine", "Human", "Installed"], ...all
                .filter((r) => !!r.machine)
                .map((r) => [r.machine, r.name, r.installed])
                .sort((a, b) => String(a[0]).localeCompare(String(b[0])))]
                .map((row) => row.map(esc).join(","))
                .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const file = `enabled_modules_${location.hostname}_${new Date().toISOString().slice(0, 10)}.csv`;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            document.body.removeChild(link);
            return `✅ CSV downloaded: ${file}`;
        }

        if (action === "modules-status") {
            const rows = all
                .filter((r) => !!r.machine)
                .map((r) => {
                    const hasUpdate =
                        r.recommended !== "N/A" &&
                        !!r.installed &&
                        r.installed !== r.recommended &&
                        !String(r.status).includes("unsupported");

                    return {
                        Machine: r.machine,
                        Human: r.name,
                        Installed: r.installed,
                        Recommended: r.recommended,
                        Status: r.status,
                        "Has update": hasUpdate ? "Yes" : "No",
                    };
                })
                .sort((a, b) => String(a.Machine).localeCompare(String(b.Machine)));

            const heads = ["Machine", "Human", "Installed", "Recommended", "Status", "Has update"];
            const widths = heads.map((h) => Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)));
            const line = (ch) => "+" + widths.map((w) => ch.repeat(w + 2)).join("+") + "+";
            const row = (r) => "| " + heads.map((h, i) => String(r[h] ?? "").padEnd(widths[i])).join(" | ") + " |";
            const headRow = Object.fromEntries(heads.map((h) => [h, h]));
            return [line("-"), row(headRow), line("="), ...rows.map(row), line("-")].join("\n");
        }

        if (action === "modules-status-csv") {
            const csv = [["Machine", "Human", "Installed", "Recommended", "Status", "Has update"], ...all
                .filter((r) => !!r.machine)
                .map((r) => {
                    const hasUpdate =
                        r.recommended !== "N/A" &&
                        !!r.installed &&
                        r.installed !== r.recommended &&
                        !String(r.status).includes("unsupported");

                    return [r.machine, r.name, r.installed, r.recommended, r.status, hasUpdate ? "Yes" : "No"];
                })
                .sort((a, b) => String(a[0]).localeCompare(String(b[0])))]
                .map((row) => row.map(esc).join(","))
                .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const file = `modules_status_${location.hostname}_${new Date().toISOString().slice(0, 10)}.csv`;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            document.body.removeChild(link);
            return `✅ CSV downloaded: ${file}`;
        }

        return "❓ Unknown action.";
    };

    const buildPanel = () => {
        const key = "durt_ui_state_v3";

        const saved = (() => {
            try {
                return JSON.parse(localStorage.getItem(key) || "{}");
            } catch {
                return {};
            }
        })();

        const state = Object.assign(
            {
                scope: ["security", "updatable", "update"],
                wrap: false,
                overridesText: "",
                helpOpen: false,
            },
            saved
        );

        document.getElementById("durt-panel")?.remove();

        const panel = document.createElement("div");
        panel.id = "durt-panel";
        panel.style.cssText = [
            "position:fixed",
            "right:16px",
            "bottom:16px",
            "width:460px",
            "max-width:calc(100vw - 32px)",
            "max-height:80vh",
            "overflow:auto",
            "z-index:2147483647",
            "background:#111",
            "color:#fff",
            "padding:12px",
            "border-radius:10px",
            "box-shadow:0 10px 30px rgba(0,0,0,.35)",
            "font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
        ].join(";");

        const header = document.createElement("div");
        header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;";
        header.innerHTML = `
      <strong style="font-size:13px">DURT</strong>
      <div style="display:flex;gap:8px;align-items:center;">
        <button data-x="help" style="cursor:pointer">?</button>
        <button data-x="min" style="cursor:pointer">–</button>
        <button data-x="close" style="cursor:pointer">✕</button>
      </div>
    `;
        panel.appendChild(header);

        const body = document.createElement("div");
        body.id = "durt-body";
        panel.appendChild(body);

        const section = (html) => {
            const div = document.createElement("div");
            div.style.cssText = "margin:8px 0;";
            div.innerHTML = html;
            body.appendChild(div);
            return div;
        };

        section(`
      <div id="durt-help" style="display:${state.helpOpen ? "block" : "none"};padding:10px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:#161616;">
        <div style="font-weight:700;margin-bottom:6px;">Info</div>
        <div>• Same-major compatible releases are preferred.</div>
        <div>• If none exist, the lowest compatible higher major is chosen.</div>
        <div>• Overrides accept JSON or <span style="font-family:ui-monospace;">drupal/module=1.2.3</span>.</div>
        <div>• Scope filters what gets included in the output.</div>
      </div>
    `);

        section(`
      <div style="opacity:.85;margin-bottom:6px;">Scope</div>
      <div>
        ${["security", "updatable", "update", "unsupported", "current", "all"].map((name) => `
          <label style="display:inline-flex;align-items:center;gap:6px;margin-right:10px;margin-bottom:6px;">
            <input type="checkbox" data-scope="${name}" ${(state.scope || []).includes(name) ? "checked" : ""}>
            ${name}
          </label>
        `).join("")}
      </div>
    `);

        section(`
      <label style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="durt-wrap" ${state.wrap ? "checked" : ""}>
        Wrap JSON as { require: ... } (composer-json)
      </label>
    `);

        section(`
      <div style="opacity:.85;margin-bottom:6px;">Overrides (JSON or key=value per line)</div>
      <textarea
        id="durt-overrides"
        spellcheck="false"
        style="width:100%;height:92px;resize:vertical;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;"
      >${state.overridesText || ""}</textarea>
      <div style="opacity:.7;margin-top:6px;">
        Example:<br>
        <span style="font-family:ui-monospace">drupal/some_module=2.0.1</span><br>
        <span style="font-family:ui-monospace">{"drupal/some_module":"2.0.1"}</span>
      </div>
    `);

        const btn = (label, action) => `
      <button
        data-action="${action}"
        style="cursor:pointer;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#1b1b1b;color:#fff;margin:4px 6px 0 0;"
      >${label}</button>
    `;

        section(`
      <div style="opacity:.85;margin-bottom:6px;">Run</div>
      <div>
        ${btn("Composer", "composer")}
        ${btn("Commit msg", "commit")}
        ${btn("ASCII", "ascii")}
        ${btn("JSON", "json")}
        ${btn("Composer JSON", "composer-json")}
        ${btn("CSV download", "csv")}
        ${btn("Modules", "modules")}
        ${btn("Modules CSV", "modules-csv")}
        ${btn("Modules Status", "modules-status")}
        ${btn("Modules Status CSV", "modules-status-csv")}
      </div>
    `);

        section(`
      <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div style="opacity:.85;">Output</div>
        <div style="display:flex;gap:8px;">
          <button
            id="durt-out-clear"
            style="cursor:pointer;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#1b1b1b;color:#fff;"
          >Clear</button>
          <button
            id="durt-out-copy"
            style="cursor:pointer;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#1b1b1b;color:#fff;"
          >Copy</button>
        </div>
      </div>
      <textarea
        id="durt-output"
        readonly
        spellcheck="false"
        style="margin-top:8px;width:100%;height:240px;overflow:auto;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#0b0b0b;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;white-space:pre;resize:vertical;box-sizing:border-box;"
      ></textarea>
    `);

        const output = body.querySelector("#durt-output");
        const helpBox = body.querySelector("#durt-help");

        const parseOverrides = (text) => {
            text = (text || "").trim();
            if (!text) return {};

            try {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === "object") return parsed;
            } catch {}

            const map = {};
            text.split(/\r?\n/).forEach((line) => {
                line = line.trim();
                if (!line || line.startsWith("#")) return;
                const m = line.match(/^([^=:\s]+)\s*[:=]\s*(.+)$/);
                if (m) map[m[1].trim()] = m[2].trim();
            });
            return map;
        };

        const getScope = () => {
            const scope = [];
            body.querySelectorAll('input[type="checkbox"][data-scope]').forEach((el) => {
                if (el.checked) scope.push(el.getAttribute("data-scope"));
            });
            return scope.length ? scope : ["security", "updatable", "update"];
        };

        const saveState = () => {
            localStorage.setItem(
                key,
                JSON.stringify({
                    scope: getScope(),
                    wrap: !!body.querySelector("#durt-wrap")?.checked,
                    overridesText: body.querySelector("#durt-overrides")?.value || "",
                    helpOpen: helpBox?.style.display !== "none",
                })
            );
        };

        const runAction = (action) => {
            const result = runReport(action, {
                scope: getScope(),
                wrap: !!body.querySelector("#durt-wrap")?.checked,
                override: parseOverrides(body.querySelector("#durt-overrides")?.value || ""),
            });

            saveState();
            output.value = typeof result === "string" ? result : JSON.stringify(result, null, 2);
            output.scrollTop = 0;
        };

        body.querySelector("#durt-out-clear")?.addEventListener("click", () => {
            output.value = "";
        });

        body.querySelector("#durt-out-copy")?.addEventListener("click", async () => {
            const text = (output.value || "").trim();
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                output.focus();
                output.select();
                document.execCommand("copy");
            }
        });

        panel.addEventListener("click", (e) => {
            const t = e.target;
            if (!(t instanceof HTMLElement)) return;

            if (t.matches('button[data-x="close"]')) {
                panel.remove();
                return;
            }

            if (t.matches('button[data-x="min"]')) {
                body.style.display = body.style.display === "none" ? "" : "none";
                return;
            }

            if (t.matches('button[data-x="help"]')) {
                helpBox.style.display = helpBox.style.display === "none" ? "block" : "none";
                saveState();
                return;
            }

            if (t.matches("button[data-action]")) {
                runAction(t.getAttribute("data-action"));
            }
        });

        body.querySelectorAll('input[type="checkbox"], textarea').forEach((el) => {
            el.addEventListener("change", saveState);
            el.addEventListener("input", saveState);
        });

        document.body.appendChild(panel);
    };

    buildPanel();
})();