/**
 * Drupal Update Report Tool (v6.0)
 * --------------------------------
 * This script is compiled and minified into a bookmarklet
 * and intended to be run client-side only, directly in the browser
 * on a Drupal site's /admin/reports/updates page.
 *
 * ✅ DO NOT:
 * - Use ES modules or imports
 * - Add async/await or network fetches
 * - Add third-party dependencies
 * - Suggest server-side logic or CSP fixes
 *
 * ✅ FOCUS ON:
 * - DOM scraping improvements
 * - Bookmarklet-safe JavaScript logic
 * - Extensible, clean options-based interface
 */

javascript:(()=>{
  console.log("✨ Drupal Update Report Tool (v6.2) initialized.");
  let c=["Name","Status","Installed","Recommended"],u=window._excludedModules||new Set;
  function d(){let e=new Date;return String(e.getDate()).padStart(2,"0")+"/"+String(e.getMonth()+1).padStart(2,"0")+"/"+e.getFullYear()}
  function i(e){return e.replace(/^8\.x-/,"").trim()}
  function m(e){return e=String(e).replace(/"/g,'""'),/["\n\r,]/.test(e)?`"${e}"`:e}

  window._excludedModules=u;
  window.generateUpdateReport=function(t="help",l={}){
    let {
      name:e = "",
      scope:o = ["security","updatable","update"],
      version:n = "recommended",
      override:overrideMap = {}
    } = l;

    overrideMap = Object.fromEntries(
      Object.entries(overrideMap).map(([k,v]) => [k.toLowerCase(), v])
    );

    function p(){
      let d=[];
      document.querySelectorAll("table.update tbody tr").forEach(e=>{
        let t=e.querySelector(".project-update__title"),
          o=(t?.textContent.trim()||"").split(/\s{2,}/),
          n=o[0]||"N/A",
          a=i(o[1]||"N/A");
        t=t?.querySelector("a");
        if(t)n=t.innerText.trim();
        let s=(t?.href||"").match(/project\/([^\/]+)/),
          r=s?s[1]:n.toLowerCase().replace(/\s+/g,"_"),
          l=e.querySelector(".project-update__version--recommended a")?.innerText.trim()||"N/A",
          mVer=i(l),
          f=i(e.querySelector(".version-latest.project-update__version a")?.innerText.trim()||l),
          h=e.querySelector(".project-update__status")?.textContent.trim().toLowerCase()||"",
          g=e.querySelector(".project-update__status")?.innerHTML.toLowerCase()||"",
          b="update";
        h.includes("up to date")?b="current":
          h.includes("security update required")?b="security":
            h.includes("not supported")?(h=e.querySelector(".project-update__compatibility-details .compatible"),b=h?"updatable":"unsupported"):
              g.includes("no available releases found")&&(b="unsupported");

        let fullMachine = `drupal/${r}`.toLowerCase();
        let overrideVersion = overrideMap[fullMachine];

        if (!u.has(r.toLowerCase())) {
          d.push({
            name: n,
            machine: r,
            status: b,
            installed: a,
            recommended: overrideVersion || mVer,
            latest: f
          });
        }
      });
      return d;
    }

    if("help"!==t&&t){
      if("add_exclude"===t)u.add(e.toLowerCase()),console.log("🛑 Excluded: "+e);
      else if("remove_exclude"===t)u.delete(e.toLowerCase()),console.log("✅ Removed from exclude: "+e);
      else if("exclude_list"===t)console.log([...u].sort().join("\n")||"No exclusions");
      else{
        let r = o.includes("excluded") ? p().filter(e=>u.has(e.machine.toLowerCase())) :
          o.includes("all") ? p() :
            p().filter(e=>o.includes(e.status));
        if(!r.length)return console.log("✅ No updates found for selected scope.");
        if("ascii"===t){
          let n=c.map(t=>Math.max(t.length,...r.map(e=>(e[t.toLowerCase()]||"").length))),
            s=t=>"+"+n.map(e=>"-".repeat(e+2)).join("+")+"+",
            a=e=>"| "+c.map((t,i)=>(e[t.toLowerCase()]||"").padEnd(n[i])).join(" | ")+" |",
            o=[s("-"),a(Object.fromEntries(c.map(e=>[e.toLowerCase(),e]))),s("=")];
          r.forEach(e=>o.push(a(e)));o.push(s("-"));
          console.log("```\n"+o.join("\n")+"\n```");
        } else if("commit"===t){
          let e="Drupal updates - "+d(),o={core:[],modules:[],themes:[]};
          r.forEach(e=>{
            let t="update"!==e.status?` [${e.status}]`:"",
              a=e.name+t+` (${e.installed} → ${e.recommended})`;
            e.name.toLowerCase().includes("core")?o.core.push(a):
              e.name.toLowerCase().includes("theme")?o.themes.push(a):o.modules.push(a);
          });
          o.core.length&&(e+="\n\nCore updates:\n- "+o.core.join("\n- "));
          o.modules.length&&(e+="\n\nModule updates:\n- "+o.modules.join("\n- "));
          o.themes.length&&(e+="\n\nTheme updates:\n- "+o.themes.join("\n- "));
          console.log(e);
        } else if("composer"===t){
          let a="latest"===n, o=[];
          r.forEach(e=>{
            const machine = `drupal/${e.machine}`.toLowerCase();
            const targetVersion = e.recommended;
            if("unsupported"!==e.status && e.installed!==targetVersion){
              if(e.name.toLowerCase().includes("core")){
                o.push("drupal/core-recommended:^"+targetVersion);
                o.push("drupal/core-composer-scaffold:^"+targetVersion);
                o.push("drupal/core-project-message:^"+targetVersion);
                o.push("drupal/core:^"+targetVersion);
              } else {
                o.push(`${machine}:^${targetVersion}`);
              }
            }
          });
          o.length?console.log("composer require -W "+o.join(" ")):console.log("✅ No composer updates required.");
        } else if("json"===t){
          console.log(JSON.stringify(r,null,2));
        } else if("csv"===t){
          let a=[c,...r.map(e=>[e.name,e.status,e.installed,e.recommended])]
              .map(e=>e.map(m).join(",")).join("\n"),
            f=new Blob([a],{type:"text/csv"}),
            s=`drupal_updates_${window.location.hostname}_${d().replace(/\//g,"-")}.csv`,
            v=document.createElement("a");
          v.href=URL.createObjectURL(f);
          v.download=s;
          v.addEventListener("click",()=>setTimeout(()=>URL.revokeObjectURL(v.href),1e3));
          document.body.appendChild(v),v.click(),document.body.removeChild(v);
        } else console.log("❓ Unknown report type.");
      }
    } else {
      console.log('✅ "generateUpdateReport(action, options)" is ready to use');
      console.log('📦 Actions: "ascii", "csv", "json", "commit", "composer", "add_exclude", "remove_exclude", "exclude_list"');
      console.log("🧰 Options: { name, scope, version, override }");
      console.log('🔹 Example: generateUpdateReport("composer", { scope: ["all"], override: { "drupal/core": "10.4.8" } })');
    }
  };
  generateUpdateReport("help");
})();
