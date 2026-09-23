import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try {
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target=path.resolve(root,'.'+pathname);
 if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 let file=target;
 try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{file=path.join(root,'index.html');}
 const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',err=>{console.error('Preview server:',err.message);process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('Le Moa PC preview: http://127.0.0.1:4173'));

