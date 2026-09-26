import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createApi} from './api.mjs';
try{process.loadEnvFile(fileURLToPath(new URL('./.env',import.meta.url)));}catch(error){if(error.code!=='ENOENT')throw error;}
export function startServer({localPreview=false}={}){
 const port=Number(process.env.PORT||4173),production=process.env.NODE_ENV==='production';
 const host=localPreview?'127.0.0.1':process.env.HOST||'127.0.0.1';
 const origin=process.env.LEMOA_ORIGIN||`http://127.0.0.1:${port}`;
 const root=fileURLToPath(new URL('../mobile/dist/',import.meta.url));
 const api=createApi({dbPath:fileURLToPath(new URL('./data/lemoa.sqlite',import.meta.url)),origin,production,allowAdmin:localPreview&&!production,kakaoKey:process.env.KAKAO_REST_API_KEY||'',providers:{google:{clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET},naver:{clientId:process.env.NAVER_CLIENT_ID,clientSecret:process.env.NAVER_CLIENT_SECRET}}});
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.ttf':'font/ttf','.jpg':'image/jpeg'};
 const server=createServer(async(req,res)=>{
 if(await api.handle(req,res))return;
 try{
 const pathname=decodeURIComponent(new URL(req.url,origin).pathname),target=path.resolve(root,'.'+pathname);
 if(target!==path.resolve(root)&&!target.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
 let file=target;
 try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{if(path.extname(file)){res.writeHead(404);res.end('Not found');return;}file=path.join(root,'index.html');}
 const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
 });
 server.on('close',()=>api.close());server.on('error',error=>{console.error('Le Moa server:',error.message);process.exitCode=1;});
 server.listen(port,host,()=>console.log(`Le Moa: ${origin} (local test admin: ${localPreview&&!production?'enabled':'disabled'})`));
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startServer();
