import fs from 'node:fs';
import path from 'node:path';
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const entries=[];const notices=[];
for(const [dir,meta] of Object.entries(lock.packages)){
 if(!dir)continue;
 const manifest=path.join(dir,'package.json');if(!fs.existsSync(manifest))continue;
 const p=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const license=p.license||meta.license||'REVIEW_REQUIRED';
 entries.push({name:p.name,version:p.version,license,development:!!meta.dev});
 const candidates=fs.readdirSync(dir).filter(f=>/^(license|licence|notice|copying)(\.|$)/i.test(f)&&fs.statSync(path.join(dir,f)).isFile());
 for(const file of candidates)notices.push(`\n===== ${p.name}@${p.version} / ${file} =====\n${fs.readFileSync(path.join(dir,file),'utf8')}`);
}
fs.mkdirSync('../docs',{recursive:true});
fs.writeFileSync('../docs/dependency-licenses.json',JSON.stringify(entries,null,2));
fs.writeFileSync('../docs/THIRD_PARTY_NOTICES.txt',notices.join('\n').replace(/[ \t]+$/gm,''));
const counts={};for(const e of entries)counts[e.license]=(counts[e.license]||0)+1;
console.log(JSON.stringify(counts,null,2));
