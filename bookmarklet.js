javascript:(()=>{let p=["Name","Status","Installed","Recommended"],u=()=>{var e=new Date;return`${String(e.getDate()).padStart(2,"0")}/${String(e.getMonth()+1).padStart(2,"0")}/`+e.getFullYear()},h=e=>String(e||"").replace(/^8\.x-/,"").trim(),m=e=>(e=String(e??"").replace(/"/g,'""'),/[",\n\r]/.test(e)?`"${e}"`:e),y=e=>{e=String(e||"").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);return e?[parseInt(e[1]||"0",10),parseInt(e[2]||"0",10),parseInt(e[3]||"0",10)]:[0,0,0]},b=(e,t)=>{var[e,r,o]=y(e),[t,a,n]=y(t);return e!==t?e-t:r!==a?r-a:o-n},v=(e,t)=>{let[r]=y(e);e=t.filter(e=>e&&e.isCompatible&&e.v&&"N/A"!==e.v);return e.length?(t=e.filter(e=>y(e.v)[0]===r)).length?(t.sort((e,t)=>b(e.v,t.v)),{...t[t.length-1],forcedMajor:!1}):(t=e.filter(e=>y(e.v)[0]>r)).length?(t.sort((e,t)=>b(e.v,t.v)),{...t[0],forcedMajor:!0}):null:null},g=u=>{let m=[];return document.querySelectorAll("table.update tbody tr").forEach(e=>{var t=e.querySelector(".project-update__title"),r=(t?.textContent||"").trim().split(/\s{2,}/);let o=r[0]||"N/A";r=h(r[1]||"N/A"),t=t?.querySelector("a");t?.textContent?.trim()&&(o=t.textContent.trim());let a=t?.href?.match(/project\/([^/]+)/)?.[1]||o.toLowerCase().replace(/\s+/g,"_");var t=("drupal/"+("core"===(a="drupal"===a&&/^drupal(?: core)?$/i.test(o.trim())?"core":a)?"core":a)).toLowerCase(),n=e.querySelector(".project-update__status")?.textContent?.toLowerCase()||"",i=e.querySelector(".project-update__status")?.innerHTML?.toLowerCase()||"";let s="update";n.includes("up to date")?s="current":n.includes("security update required")?s="security":n.includes("invalid version")?s="unsupported":n.includes("not supported")?s=e.querySelector(".project-update__compatibility-details .compatible")?"updatable":"unsupported":i.includes("no available releases")&&(s="unsupported");n=[e.querySelector(".project-update__version--recommended"),...e.querySelectorAll(".version-also-available")].filter(Boolean).map(e=>{var t,r=h(e.querySelector("a")?.textContent?.trim()||"N/A");return"N/A"===r?null:(t=!!e.querySelector("details.not-compatible"),{v:r,isCompatible:!!e.querySelector(".compatible")||!t})}).filter(Boolean),i=v(r,n),e=i?i.v:"N/A",n=!!i?.forcedMajor,i=!i;let d=e;var l,c,p=Object.prototype.hasOwnProperty.call(u,t);p&&(d=u[t]),"security"===s&&i?s="security (no compatible release)":!String(s).startsWith("security")&&i&&"current"!==s&&(s="unsupported"),n&&(String(s).startsWith("security")?s="security (major upgrade)":"current"!==s&&"unsupported"!==s&&(s="update (major)")),("update"===s||"updatable"===s)&&"N/A"!==e&&"N/A"!==r&&0<b(e,r)&&([l]=y(e),[c]=y(r),s=c<l?"update (major)":"update"),p&&!String(s).includes("unsupported")&&(s=String(s).startsWith("security")?"security (overridden)":"overridden"),m.push({name:o,machine:a,status:s,installed:r,recommended:d,latest:e,pack:t,isOverridden:p,forcedMajor:n,noCompatible:i})}),m};(()=>{let e="durt_ui_state_v3";var t=(()=>{try{return JSON.parse(localStorage.getItem(e)||"{}")}catch{return{}}})();let r=Object.assign({scope:["security","updatable","update"],wrap:!1,overridesText:"",helpOpen:!1},t),o=(document.getElementById("durt-panel")?.remove(),document.createElement("div"));o.id="durt-panel",o.style.cssText=["position:fixed","right:16px","bottom:16px","width:460px","max-width:calc(100vw - 32px)","max-height:80vh","overflow:auto","z-index:2147483647","background:#111","color:#fff","padding:12px","border-radius:10px","box-shadow:0 10px 30px rgba(0,0,0,.35)","font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif"].join(";");t=document.createElement("div");t.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;",t.innerHTML=`
      <strong style="font-size:13px">DURT</strong>
      <div style="display:flex;gap:8px;align-items:center;">
        <button data-x="help" style="cursor:pointer">?</button>
        <button data-x="min" style="cursor:pointer">–</button>
        <button data-x="close" style="cursor:pointer">✕</button>
      </div>
    `,o.appendChild(t);let a=document.createElement("div");a.id="durt-body",o.appendChild(a);var t=e=>{var t=document.createElement("div");return t.style.cssText="margin:8px 0;",t.innerHTML=e,a.appendChild(t),t},n=(t(`
      <div id="durt-help" style="display:${r.helpOpen?"block":"none"};padding:10px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:#161616;">
        <div style="font-weight:700;margin-bottom:6px;">Info</div>
        <div>• Same-major compatible releases are preferred.</div>
        <div>• If none exist, the lowest compatible higher major is chosen.</div>
        <div>• Overrides accept JSON or <span style="font-family:ui-monospace;">drupal/module=1.2.3</span>.</div>
        <div>• Scope filters what gets included in the output.</div>
      </div>
    `),t(`
      <div style="opacity:.85;margin-bottom:6px;">Scope</div>
      <div>
        ${["security","updatable","update","unsupported","current","all"].map(e=>`
          <label style="display:inline-flex;align-items:center;gap:6px;margin-right:10px;margin-bottom:6px;">
            <input type="checkbox" data-scope="${e}" ${(r.scope||[]).includes(e)?"checked":""}>
            ${e}
          </label>
        `).join("")}
      </div>
    `),t(`
      <label style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="durt-wrap" ${r.wrap?"checked":""}>
        Wrap JSON as { require: ... } (composer-json)
      </label>
    `),t(`
      <div style="opacity:.85;margin-bottom:6px;">Overrides (JSON or key=value per line)</div>
      <textarea
        id="durt-overrides"
        spellcheck="false"
        style="width:100%;height:92px;resize:vertical;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;"
      >${r.overridesText||""}</textarea>
      <div style="opacity:.7;margin-top:6px;">
        Example:<br>
        <span style="font-family:ui-monospace">drupal/some_module=2.0.1</span><br>
        <span style="font-family:ui-monospace">{"drupal/some_module":"2.0.1"}</span>
      </div>
    `),(e,t)=>`
      <button
        data-action="${t}"
        style="cursor:pointer;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#1b1b1b;color:#fff;margin:4px 6px 0 0;"
      >${e}</button>
    `);t(`
      <div style="opacity:.85;margin-bottom:6px;">Run</div>
      <div>
        ${n("Composer","composer")}
        ${n("Commit msg","commit")}
        ${n("ASCII","ascii")}
        ${n("JSON","json")}
        ${n("Composer JSON","composer-json")}
        ${n("CSV download","csv")}
        ${n("Modules","modules")}
        ${n("Modules CSV","modules-csv")}
        ${n("Modules Status","modules-status")}
        ${n("Modules Status CSV","modules-status-csv")}
      </div>
    `),t(`
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
    `);let i=a.querySelector("#durt-output"),s=a.querySelector("#durt-help"),d=()=>{let t=[];return a.querySelectorAll('input[type="checkbox"][data-scope]').forEach(e=>{e.checked&&t.push(e.getAttribute("data-scope"))}),t.length?t:["security","updatable","update"]},l=()=>{localStorage.setItem(e,JSON.stringify({scope:d(),wrap:!!a.querySelector("#durt-wrap")?.checked,overridesText:a.querySelector("#durt-overrides")?.value||"",helpOpen:"none"!==s?.style.display}))},c=e=>{e=((e="composer",r)=>{let t=r.scope??["security","updatable","update"];var n=!!r.wrap,r=Object.fromEntries(Object.entries(r.override??{}).map(([e,t])=>[String(e).toLowerCase(),t])),r=g(r);let i=r.filter(e=>!!t.includes("all")||("current"===e.status?t.includes("current"):String(e.status).startsWith("security")?t.includes("security"):"overridden"===e.status?t.includes("update"):t.includes(e.status)));if(["ascii","csv","json","commit","composer","composer-json"].includes(e)&&!i.length)return"✅ No items found for selected scope.";if("ascii"===e){let r=p.map(e=>e.toLowerCase()),o=p.map((e,t)=>Math.max(e.length,...i.map(e=>String(e[r[t]]||"").length)));var a=t=>"+"+o.map(e=>t.repeat(e+2)).join("+")+"+",s=r=>"| "+p.map((e,t)=>String(r[e.toLowerCase()]??"").padEnd(o[t])).join(" | ")+" |",d=Object.fromEntries(p.map(e=>[e.toLowerCase(),e]));return[a("-"),s(d),a("="),...i.map(s),a("-")].join("\n")}if("commit"===e){let r={core:[],modules:[],themes:[]};i.forEach(e=>{var t=e.name+` [${e.status}] (${e.installed} → ${e.recommended})`;("core"===e.machine?r.core:String(e.machine).includes("theme")?r.themes:r.modules).push(t)});d=["Drupal updates - "+u()];return r.core.length&&d.push("Core updates:",r.core.map(e=>"- "+e).join("\n")),r.modules.length&&d.push("Module updates:",r.modules.map(e=>"- "+e).join("\n")),r.themes.length&&d.push("Theme updates:",r.themes.map(e=>"- "+e).join("\n")),d.join("\n\n")}if("json"===e)return JSON.stringify(i,null,2);if("csv"===e){var s=[p,...i.map(e=>[e.name,e.status,e.installed,e.recommended])].map(e=>e.map(m).join(",")).join("\n"),a=new Blob([s],{type:"text/csv"}),d=`drupal_updates_${location.hostname}_${u().replace(/\//g,"-")}.csv`;let e=document.createElement("a");return e.href=URL.createObjectURL(a),e.download=d,document.body.appendChild(e),e.click(),setTimeout(()=>URL.revokeObjectURL(e.href),1e3),document.body.removeChild(e),"✅ CSV downloaded: "+d}if("composer-json"===e){let o={},a=[],e=(i.forEach(e=>{var t=e.pack,r=e.recommended;r&&"N/A"!==r||e.isOverridden?String(e.status).includes("unsupported")&&!e.isOverridden||e.installed===r&&!e.isOverridden||("drupal/core"===t?(o["drupal/core"]=r,o["drupal/core-recommended"]=r,o["drupal/core-composer-scaffold"]=r,o["drupal/core-project-message"]=r):o[t]=r):String(e.status).startsWith("security")&&a.push(e.name+" — "+e.status)}),n?JSON.stringify({require:o},null,2):JSON.stringify(o,null,2));return e=a.length?(e+=`

⚠️ Security updates exist with no compatible release for your current core line:
`)+a.map(e=>"- "+e).join("\n"):e}if("composer"===e){let o=[],a=[],e=(i.forEach(e=>{var t=e.pack,r=e.recommended;r&&"N/A"!==r||e.isOverridden?String(e.status).includes("unsupported")&&!e.isOverridden||e.installed===r&&!e.isOverridden||("drupal/core"===t?(o.push(`"drupal/core-recommended:${r}"`),o.push(`"drupal/core-composer-scaffold:${r}"`),o.push(`"drupal/core-project-message:${r}"`),o.push(`"drupal/core:${r}"`)):o.push(`"${t}:${r}"`)):String(e.status).startsWith("security")&&a.push(e.name+" — "+e.status)}),o.length?"composer require -W \\\n  "+o.join(" \\\n  "):"✅ No composer updates required.");return e=a.length?(e+=`

⚠️ Security updates exist with no compatible release for your current core line:
`)+a.map(e=>"- "+e).join("\n")+`

✅ Action: upgrade Drupal core to a compatible line, replace/remove the module, or apply an official fix if provided.`:e}if("modules"===e)return(s=r.filter(e=>!!e.machine).map(e=>String(e.machine).toLowerCase()).sort((e,t)=>e.localeCompare(t))).length?s.join("\n"):"✅ No modules detected.";if("modules-csv"===e){a=[["Machine","Human","Installed"],...r.filter(e=>!!e.machine).map(e=>[e.machine,e.name,e.installed]).sort((e,t)=>String(e[0]).localeCompare(String(t[0])))].map(e=>e.map(m).join(",")).join("\n"),d=new Blob([a],{type:"text/csv"}),n=`enabled_modules_${location.hostname}_${(new Date).toISOString().slice(0,10)}.csv`;let e=document.createElement("a");return e.href=URL.createObjectURL(d),e.download=n,document.body.appendChild(e),e.click(),setTimeout(()=>URL.revokeObjectURL(e.href),1e3),document.body.removeChild(e),"✅ CSV downloaded: "+n}if("modules-status"===e){let e=r.filter(e=>!!e.machine).map(e=>{var t="N/A"!==e.recommended&&!!e.installed&&e.installed!==e.recommended&&!String(e.status).includes("unsupported");return{Machine:e.machine,Human:e.name,Installed:e.installed,Recommended:e.recommended,Status:e.status,"Has update":t?"Yes":"No"}}).sort((e,t)=>String(e.Machine).localeCompare(String(t.Machine))),t=["Machine","Human","Installed","Recommended","Status","Has update"],o=t.map(t=>Math.max(t.length,...e.map(e=>String(e[t]??"").length)));s=t=>"+"+o.map(e=>t.repeat(e+2)).join("+")+"+",a=r=>"| "+t.map((e,t)=>String(r[e]??"").padEnd(o[t])).join(" | ")+" |",d=Object.fromEntries(t.map(e=>[e,e]));return[s("-"),a(d),s("="),...e.map(a),s("-")].join("\n")}if("modules-status-csv"!==e)return"❓ Unknown action.";{n=[["Machine","Human","Installed","Recommended","Status","Has update"],...r.filter(e=>!!e.machine).map(e=>{var t="N/A"!==e.recommended&&!!e.installed&&e.installed!==e.recommended&&!String(e.status).includes("unsupported");return[e.machine,e.name,e.installed,e.recommended,e.status,t?"Yes":"No"]}).sort((e,t)=>String(e[0]).localeCompare(String(t[0])))].map(e=>e.map(m).join(",")).join("\n"),d=new Blob([n],{type:"text/csv"}),a=`modules_status_${location.hostname}_${(new Date).toISOString().slice(0,10)}.csv`;let e=document.createElement("a");return e.href=URL.createObjectURL(d),e.download=a,document.body.appendChild(e),e.click(),setTimeout(()=>URL.revokeObjectURL(e.href),1e3),document.body.removeChild(e),"✅ CSV downloaded: "+a}})(e,{scope:d(),wrap:!!a.querySelector("#durt-wrap")?.checked,override:(e=>{if(!(e=(e||"").trim()))return{};try{var t=JSON.parse(e);if(t&&"object"==typeof t)return t}catch{}let r={};return e.split(/\r?\n/).forEach(e=>{(e=e.trim())&&!e.startsWith("#")&&(e=e.match(/^([^=:\s]+)\s*[:=]\s*(.+)$/))&&(r[e[1].trim()]=e[2].trim())}),r})(a.querySelector("#durt-overrides")?.value||"")});l(),i.value="string"==typeof e?e:JSON.stringify(e,null,2),i.scrollTop=0};a.querySelector("#durt-out-clear")?.addEventListener("click",()=>{i.value=""}),a.querySelector("#durt-out-copy")?.addEventListener("click",async()=>{var e=(i.value||"").trim();try{await navigator.clipboard.writeText(e)}catch{i.focus(),i.select(),document.execCommand("copy")}}),o.addEventListener("click",e=>{e=e.target;e instanceof HTMLElement&&(e.matches('button[data-x="close"]')?o.remove():e.matches('button[data-x="min"]')?a.style.display="none"===a.style.display?"":"none":e.matches('button[data-x="help"]')?(s.style.display="none"===s.style.display?"block":"none",l()):e.matches("button[data-action]")&&c(e.getAttribute("data-action")))}),a.querySelectorAll('input[type="checkbox"], textarea').forEach(e=>{e.addEventListener("change",l),e.addEventListener("input",l)}),document.body.appendChild(o)})()})();