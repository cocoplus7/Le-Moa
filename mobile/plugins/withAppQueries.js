const {withAndroidManifest}=require('expo/config-plugins');
const catalog=require('../src/catalog.json');
module.exports=config=>withAndroidManifest(config,result=>{
 const manifest=result.modResults.manifest;
 manifest.queries=manifest.queries||[];
 const existing=new Set(manifest.queries.flatMap(q=>(q.package||[]).map(p=>p.$['android:name'])));
 const packages=catalog.apps.filter(a=>!existing.has(a.packageName)).map(a=>({$:{'android:name':a.packageName}}));
 if(packages.length) manifest.queries.push({package:packages});
 return result;
});
