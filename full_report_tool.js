let MODULE_UPDATE_HEADERS = ["Module Name", "Installed Version", "Recommended Version"];

if (typeof window._excludedModules === 'undefined') {
  window._excludedModules = new Set();
}
const excludedModules = window._excludedModules;
function cleanText(e) {
  return e.replace(/<a[^>]*>|<\/a>/g, "").replace(/\(Release notes\)/gi, "").replace(/\s+/g, " ").trim();
}
function generatePantheonUrl(e) {
  var o = document.querySelector("a.environment-link");
  return o ? (o = o.href, e ? (e = e.substring(0, 11), o.replace(/^(https?:\/\/)([^.-]+)(.*)/, `$1${e}$3`)) : o) : (console.warn("No link with class 'environment-link' found."), null);
}
function cleanVersion(e) {
  return e.replace(/^8\.x-/, "");
}
function getCleanTextFromCell(e) {
  return e ? ((e = e.cloneNode(!0)).querySelectorAll("div").forEach(e => e.remove()), cleanText(e.textContent)) : "";
}
function getVersion(e) {
  return cleanVersion(cleanText(e?.textContent || ""));
}
function extractModuleNames(e) {
  if (!e) return {
    machine: "",
    human: ""
  };
  var o = e.querySelector("a[href*='drupal.org/project/']");
  let t = "";
  o && (o = o.getAttribute("href").match(/project\/([^\/]+)\//)) && (t = o[1].toLowerCase());
  o = getCleanTextFromCell(e);
  return {
    machine: t,
    human: o
  };
}
function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}
function quoteCSV(e) {
  return e = String(e).replace(/"/g, '""'), /["\n\r,]/.test(e) ? `"${e}"` : e;
}
function exportCSV(e, o) {
  e = [MODULE_UPDATE_HEADERS, ...e.map(e => [e[1], e[2], e[3]]), ...o.map(e => [e[1], e[2], e[3]])].map(e => e.map(quoteCSV).join(",")).join("\n");
  o = new Blob([e], {
    type: "text/csv"
  });
  e = document.createElement("a");
  e.href = URL.createObjectURL(o);
  e.download = `drupal updates - ${window.location.hostname} - ${getCurrentDate()}.csv`;
  document.body.appendChild(e);
  e.click();
  document.body.removeChild(e);
}
function generateComposerCommand(e, o) {
  let l = [];
  e.forEach(([, e, o, t]) => {
    "core" !== e && !o.toLowerCase().includes("drupal core") || l.push(`drupal/core-recommended:^${t}`, `drupal/core-composer-scaffold:^${t}`, `drupal/core-project-message:^${t}`, `drupal/core:^${t}`);
  });
  o.forEach(([, , , o]) => {
    l.push(/[^a-z0-9_]/.test(e) ? `"drupal/${e}:^${o}"` : `drupal/${e}:^` + o);
  });
  l.length ? (console.log("📦 Composer command:"), console.log("composer require -W " + l.join(" "))) : console.log("No matching modules found.");
}
function generateAsciiTable(e, o) {
  e = [...e, ...o];
  if (e.length) {
    o = [MODULE_UPDATE_HEADERS, ...e.map(([, e, o, t]) => [e, o, t])];
    let n = [0, 0, 0];
    o.forEach(e => {
      e.forEach((e, o) => {
        n[o] = Math.max(n[o], e.length);
      });
    });
    var e = l("+", "+", "+", "="),
      t = l("+", "+", "+"),
      e = ["Site: " + window.location.origin, "Date: " + getCurrentDate(), t, r(o[0]), e, ...o.slice(1).map(r), t];
    function l(e, o, t, l = "-") {
      return e + n.map(e => l.repeat(e + 2)).join(o) + t;
    }
    function r(e) {
      return "| " + e.map((e, o) => e.padEnd(n[o])).join(" | ") + " |";
    }
    console.log("📚 ASCII table output:\n"), console.log(e.join("\n"));
  } else console.log("No module updates to display in ASCII table.");
}
function generateCommitMessage(e, o) {
  let l = [`Update Drupal modules (${getCurrentDate()})`];
  e.length && (l.push("\nCore updates:"), e.forEach(([, e, o, t]) => {
    l.push(e + ` (${o} → ${t})`);
  }));
  o.length && (l.push("\nContrib module updates:"), o.forEach(([, e, o, t]) => {
    l.push(e + ` (${o} → ${t})`);
  }));
  1 < l.length ? (console.log("📝 Commit message suggestion:"), console.log(l.join("\n"))) : console.log("No module updates to include in commit message.");
}
function generateUpdateReport(l = "help", n = "all", r = null) {
  if (window._excludedModules.clear(), "help" !== l && l) if ("add_exclude" === l) window._excludedModules.add(n.toLowerCase()), console.log("➕ Excluded module: " + n); else if ("remove_exclude" === l) window._excludedModules.delete(n.toLowerCase()), console.log("✅ Removed from exclude list: " + n); else if ("exclude_list" === l) console.log("🗄️ Currently excluded modules:"), console.log([...window._excludedModules].sort().join("\n") || "None"); else {
    let e = [],
      o = [];
    a(document.querySelector("table#edit-manual-updates"), e, !0);
    a(document.querySelector("table#edit-projects") || document.querySelector("table.update"), o, !1);
    let t = ["all", "security", "unsupported"].includes(n?.toLowerCase()) ? n.toLowerCase() : "all";
    function a(e, n, r = !1) {
      e && e.querySelectorAll("tbody tr").forEach(e => {
        var o, t, l, e = e.querySelectorAll("td");
        e.length && (r ? (o = getCleanTextFromCell(e[0]), t = getVersion(e[1]), l = getVersion(e[2]), t && l && t !== l && n.push(["core", o, t, l])) : ({
          machine: o,
          human: t
        } = extractModuleNames(e[1]), l = getVersion(e[2]), e = getVersion(e[3]), window._excludedModules.has(o.toLowerCase()) || o && t && l && e && l !== e && n.push([o, t, l, e])));
      });
    }
    "all" !== t && (e = e.filter(e => e[1].toLowerCase().includes(t)), o = o.filter(e => e[1].toLowerCase().includes(t)));
    "composer" === l ? generateComposerCommand(e, o) : "csv" === l ? exportCSV(e, o) : "commit" === l ? generateCommitMessage(e, o) : "ascii" === l ? generateAsciiTable(e, o) : "pantheon" === l ? (n = generatePantheonUrl(r), console.log("🚀 Pantheon URL: " + n)) : "all" === l && (generateUpdateReport("composer"), generateUpdateReport("csv"), generateUpdateReport("ascii"), generateUpdateReport("commit"), generateUpdateReport("help"));
  } else console.log('✅ "generateUpdateReport" is ready to use'), console.log("📦 REPORT OUTPUT OPTIONS:\n"), console.log('🔹 generateUpdateReport("csv"); → CSV of all updates'), console.log('🔹 generateUpdateReport("csv", "security"); → CSV of security updates only'), console.log('🔹 generateUpdateReport("ascii"); → Display updates in an ASCII table'), console.log('🔹 generateUpdateReport("commit"); → Generate commit message'), console.log('🔹 generateUpdateReport("composer"); → Generate composer require command'), console.log('🔹 generateUpdateReport("all"); → Test all output formats'), console.log("\n🧰 EXCLUDE / UNLOAD OPTIONS:\n"), console.log('🔹 generateUpdateReport("add_exclude", "module_name"); → Add a module to the exclude list'), console.log('🔹 generateUpdateReport("remove_exclude", "module_name"); → Remove a module from the exclude list'), console.log('🔹 generateUpdateReport("exclude_list"); → Display all excluded modules'), console.log('🔹 generateUpdateReport("pantheon", "", "d1234"); → Output Pantheon URL with ticket number (max 11 chars)');
}
generateUpdateReport("help");