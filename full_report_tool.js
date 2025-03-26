const HEADERS = ["Module Name","Installed Version","Recommended Version"];
if (!window._excludedModules) {
  window._excludedModules = new Set();
}
const excludedModules = window._excludedModules;

function cleanText(text){return text.replace(/<a[^>]*>|<\/a>/g,"").replace(/\(Release notes\)/gi,"").replace(/\s+/g," ").trim();}
function cleanVersion(version){return version.replace(/^8\.x-/,"");}

function extractModuleNames(cell){
  if(!cell)return{machine:"",human:""};
  const link=cell.querySelector("a[href*='drupal.org/project/']");
  let machine="";
  if(link){
    const match=link.getAttribute("href").match(/project\/([^/]+)/);
    if(match)machine=match[1].toLowerCase();
  }
  let tempCell=cell.cloneNode(true);
  tempCell.querySelectorAll("div").forEach(div=>div.remove());
  let human = cleanText(tempCell.textContent);
  return {machine,human};
}

function getCurrentDate(){return new Date().toISOString().split("T")[0];}

function generateUpdateReport(action="help",filter="all"){
  if(action==="help"){
    console.log('✅ "generateUpdateReport" is ready to use');
    console.log('📦 REPORT OUTPUT');
    console.log('🔹 generateUpdateReport(type = "csv", scope = "all");');
    console.log('   • type: "csv" → Download a CSV file of available updates (default)');
    console.log('   • type: "ascii" → Output ASCII table to console');
    console.log('   • type: "commit" → Generate commit message summary');
    console.log('   • type: "composer" → Output Composer require command');
    console.log('   • scope: "all" (default) → Include all available updates');
    console.log('   • scope: "security" → Limit output to security updates only');
    console.log('🧰 EXCLUDE / UNLOAD');
    console.log('🔹 generateUpdateReport("add_exclude", "module_name");');
    console.log('🔹 generateUpdateReport("remove_exclude", "module_name");');
    console.log('🔹 generateUpdateReport("exclude_list");');
    return;
  }

  if(action==="exclude_list"){console.log([...excludedModules].map(name=>`- ${name}`).join("\n")||"None");return;}
  if(action==="add_exclude"){excludedModules.add(filter.toLowerCase());console.log(`✅ Added: ${filter}`);return;}
  if(action==="remove_exclude"){excludedModules.delete(filter.toLowerCase());console.log(`✅ Removed: ${filter}`);return;}

  function extractTableData(table,targetArray,isCore=false,securityOnly=false){
    if(!table)return;
    table.querySelectorAll("tbody tr").forEach(row=>{
      const cells=row.querySelectorAll("td");
      if(!cells.length)return;
      let nameCell=cells[isCore?0:1];
      let{machine,human}=extractModuleNames(nameCell);
      let from=cleanVersion(cleanText(cells[isCore?1:2]?.textContent||""));
      let to=cleanVersion(cleanText(cells[isCore?2:3]?.textContent||""));
      if(excludedModules.has(machine.toLowerCase()))return;
      if(machine&&human&&from&&to&&from!==to)targetArray.push([machine,human,from,to]);
    });
  }

  function quoteCSV(val){return `"${String(val).replace(/"/g,'""')}"`;}
  function exportCSV(core,contrib){
    let rows=[["Module Name","Installed Version","Recommended Version"],...core.map(r=>[r[1],r[2],r[3]]),...contrib.map(r=>[r[1],r[2],r[3]])];
    let csv=rows.map(r=>r.map(quoteCSV).join(",")).join("\n");
    let blob=new Blob([csv],{type:"text/csv"});
    let a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`drupal updates - ${window.location.hostname} - ${getCurrentDate()}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  }

  function formatAsciiTable(core,contrib){
    let all=[...core,...contrib].map(r=>[r[1],r[2],r[3]]);
    if(!all.length){console.log("No updates found.");return;}
    let widths=["Module Name","Installed Version","Recommended Version"].map((h,i)=>Math.max(h.length,...all.map(r=>r[i].length)));
    let row=r=>`| ${r.map((c,i)=>c.padEnd(widths[i])).join(" | ")} |`;
    let bar=ch=>`+${widths.map(w=>ch.repeat(w+2)).join("+")}+`;
    console.log(`\n${bar("-")}\n${row(["Module Name","Installed Version","Recommended Version"])}\n${bar("=")}\n${all.map(row).join("\n")}\n${bar("-")}\n`);
  }

  function formatCommitMessage(core,contrib){
    return `Update Drupal modules (${getCurrentDate()})\n\n`+
        (core.length?"Core updates:\n"+core.map(r=>`- ${r[1]} (${r[2]} → ${r[3]})`).join("\n")+"\n\n":"")+
        (contrib.length?"Contrib module updates:\n"+contrib.map(r=>`- ${r[1]} (${r[2]} → ${r[3]})`).join("\n"):"");
  }

  let core=[],contrib=[],securityOnly=filter==="security";
  extractTableData(document.querySelector("table#edit-manual-updates"),core,true,securityOnly);
  extractTableData(document.querySelector("table#edit-projects")||document.querySelector("table.update"),contrib,false,securityOnly);

  if(action==="composer"){
    let lines=[];
    core.forEach(([m,h,f,t])=>{
      if(m==="core" || h.toLowerCase().includes("drupal core")){
        lines.push(
            `drupal/core-recommended:^${t}`,
            `drupal/core-composer-scaffold:^${t}`,
            `drupal/core-project-message:^${t}`
        );
      }
    });
    contrib.forEach(([m,h,f,t])=>{
      lines.push(/[^a-z0-9_]/.test(m)?`"drupal/${m}:^${t}"`:`drupal/${m}:^${t}`);
    });
    if(lines.length){console.log("📦 Composer command:");console.log("composer require -W "+lines.join(" "));}
    else{console.log("⚠️ No matching modules found.");}
    return;
  }

  if(action==="commit"){console.log("\n=== Commit Message ===\n");console.log(formatCommitMessage(core,contrib));}
  else if(action==="ascii"){console.log("\n=== ASCII Table ===\n");formatAsciiTable(core,contrib);}
  else if(action==="csv"){console.log("\n✅ CSV will be downloaded automatically.");exportCSV(core,contrib);}
  else{console.log("❌ Unknown command. Use generateUpdateReport('help') for usage.");}
}

window.generateUpdateReport = generateUpdateReport;
generateUpdateReport("help");