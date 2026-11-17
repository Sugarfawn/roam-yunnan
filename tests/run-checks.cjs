/* No dependency installation, credentials or external API calls required. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
for(const file of fs.readdirSync(root).filter(name=>/\.(?:js|cjs)$/.test(name)&&name!=='map-config.local.js')){
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
for(const file of ['route-rules.cjs','personal-places.cjs','traffic-feasibility.cjs','selection-migration.cjs','ai-contract.cjs']){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',cwd:root});
  if(result.status!==0)process.exit(result.status||1);
}
console.log('Source syntax and all offline suites passed. No paid model or live map calls.');
