import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import catalog from '../mobile/src/catalog.json' with {type:'json'};
const scrypt=promisify(scryptCallback);
const hash=value=>createHash('sha256').update(value).digest('hex');
const random=()=>randomBytes(32).toString('base64url');
const loopback=address=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address);
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function validateCoordinates(input){
 const {latitude,longitude,accuracy}=input;
 if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180||!Number.isFinite(accuracy)||accuracy<0||accuracy>100000)throw fail(400,'위치 정보를 다시 확인해 주세요.');
 return {latitude,longitude,accuracy};
}
export function mapPlaces(documents,merchant){
 return documents.filter(place=>typeof place.place_name==='string'&&place.place_name.toLowerCase().replace(/\s/g,'').startsWith(merchant.name.toLowerCase().replace(/\s/g,''))).map(place=>({id:String(place.id),merchantId:merchant.id,name:place.place_name,address:place.road_address_name||place.address_name||'주소 정보 없음',distance:Math.max(0,Number(place.distance)||0),floor:'층 정보는 제공되지 않을 수 있어요'}));
}
export function createApi({dbPath='server/data/lemoa.sqlite',origin='http://127.0.0.1:4173',allowAdmin=false,production=false,kakaoKey='',providers={},fetchImpl=fetch}={}){
 const base=new URL(origin);
 if(production&&(allowAdmin||base.protocol!=='https:'))throw Error('공개 서버는 HTTPS가 필요하며 테스트 관리자를 활성화할 수 없습니다.');
 if(allowAdmin&&!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error('테스트 관리자는 로컬 서버에서만 허용됩니다.');
 if(dbPath!==':memory:')mkdirSync(path.dirname(dbPath),{recursive:true});
 const db=new DatabaseSync(dbPath);
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT,password TEXT,provider TEXT NOT NULL,subject TEXT NOT NULL,consent_version TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(provider,subject));
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS exchanges(code_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL);`);
 const states=new Map(),limits=new Map();
 const safeCookie=(name,value,maxAge=604800)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${base.protocol==='https:'?'; Secure':''}`;
 function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
 function redirect(res,url){res.writeHead(302,{Location:url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();}
 function throttle(key,max){const time=Date.now();for(const [k,v]of limits)if(v.until<time)limits.delete(k);let v=limits.get(key);if(!v){v={count:0,until:time+60000};limits.set(key,v);}if(++v.count>max)throw fail(429,'요청이 많습니다. 잠시 후 다시 시도해 주세요.');}
 async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'JSON 요청이 필요합니다.');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw fail(413,'입력 내용이 너무 깁니다.');}try{const value=JSON.parse(text||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('object required');return value;}catch{throw fail(400,'입력 형식을 확인해 주세요.');}}
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')));
 function user(id){if(id==='dev-admin')return allowAdmin?{id,role:'admin',email:null,provider:'local-test'}:null;const row=db.prepare('SELECT id,email,provider FROM accounts WHERE id=?').get(id);return row?{...row,role:'member'}:null;}
 function token(req){return req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):cookies(req).lemoa_session;}
 function current(req){const value=token(req);if(!value)return null;const row=db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires>?').get(hash(value),Date.now());const result=row?user(row.user_id):null;if(result?.role==='admin'&&!loopback(req.socket.remoteAddress))return null;return result;}
 function issue(res,id,native=false){const value=random();db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(value),id,Date.now()+7*86400000);if(!native)res.setHeader('Set-Cookie',safeCookie('lemoa_session',value));return {user:user(id),...(native?{token:value}:{})};}
 async function upstream(url,options={}){const response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(12000)});if(!response.ok)throw fail(502,'외부 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');return response.json();}
 async function oauth(req,res,url,provider,action){
 const config=providers[provider];if(!['google','naver'].includes(provider)||!config?.clientId||!config?.clientSecret)throw fail(503,'소셜 로그인 서비스 등록이 필요합니다. 직접 가입 또는 로컬 관리자 로그인을 이용해 주세요.');
 const callback=`${base.origin}/api/auth/oauth/${provider}/callback`;
 if(action==='start'){
 throttle(`oauth:${req.socket.remoteAddress}`,15);
 if(url.searchParams.get('consent')!=='minimal-v1')throw fail(400,'필수 정보 처리 안내를 먼저 확인해 주세요.');
 const native=url.searchParams.get('native')==='1',challenge=url.searchParams.get('challenge')||'';
 if(native&&!/^[A-Za-z0-9_-]{43}$/.test(challenge))throw fail(400,'앱 인증 요청을 다시 시작해 주세요.');
 for(const [key,state]of states)if(state.expires<Date.now())states.delete(key);
 const state=random(),binding=random(),verifier=random();states.set(state,{provider,binding:hash(binding),native,challenge,verifier,expires:Date.now()+600000});
 res.setHeader('Set-Cookie',safeCookie('lemoa_oauth',binding,600));
 const destination=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://nid.naver.com/oauth2.0/authorize');
 for(const [key,value]of Object.entries({client_id:config.clientId,redirect_uri:callback,response_type:'code',state}))destination.searchParams.set(key,value);
 if(provider==='google'){destination.searchParams.set('scope','openid');destination.searchParams.set('code_challenge',createHash('sha256').update(verifier).digest('base64url'));destination.searchParams.set('code_challenge_method','S256');}
 return redirect(res,destination.href);
 }
 if(action!=='callback')throw fail(404,'잘못된 인증 경로입니다.');
 const stateKey=url.searchParams.get('state'),state=states.get(stateKey);states.delete(stateKey);
 if(!state||state.provider!==provider||state.expires<Date.now()||hash(cookies(req).lemoa_oauth||'')!==state.binding)throw fail(400,'인증 요청이 만료되었거나 일치하지 않습니다. 앱에서 다시 시작해 주세요.');
 res.setHeader('Set-Cookie',safeCookie('lemoa_oauth','',0));
 if(url.searchParams.has('error'))return redirect(res,state.native?'lemoa://auth/callback?error=cancelled':'/?authError=cancelled');
 const code=url.searchParams.get('code');if(!code)throw fail(400,'인증 코드가 없습니다.');
 const fields={grant_type:'authorization_code',client_id:config.clientId,client_secret:config.clientSecret,code,redirect_uri:callback,...(provider==='google'?{code_verifier:state.verifier}:{state:stateKey})};
 const data=await upstream(provider==='google'?'https://oauth2.googleapis.com/token':'https://nid.naver.com/oauth2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString()});
 if(typeof data.access_token!=='string')throw fail(502,'인증을 완료하지 못했습니다.');
 const profile=await upstream(provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://openapi.naver.com/v1/nid/me',{headers:{Authorization:`Bearer ${data.access_token}`}});
 const subject=provider==='google'?profile.sub:profile.response?.id;
 if(typeof subject!=='string'||!subject)throw fail(502,'로그인 식별자를 확인하지 못했습니다.');
 // Only persist provider + opaque identifier, never optional profile details or provider tokens.
 let account=db.prepare('SELECT id FROM accounts WHERE provider=? AND subject=?').get(provider,subject);
 if(!account){account={id:randomUUID()};db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run(account.id,null,null,provider,subject,'minimal-v1',Date.now());}
 if(state.native){const exchange=random();db.prepare('DELETE FROM exchanges WHERE expires<?').run(Date.now());db.prepare('INSERT INTO exchanges VALUES(?,?,?,?)').run(hash(exchange),account.id,state.challenge,Date.now()+60000);return redirect(res,`lemoa://auth/callback?code=${encodeURIComponent(exchange)}`);}
 issue(res,account.id);return redirect(res,'/');
 }
 async function handle(req,res){
 const url=new URL(req.url,base);if(!url.pathname.startsWith('/api/'))return false;
 try{
 if(req.headers.host!==base.host&&!(allowAdmin&&loopback(req.socket.remoteAddress)&&req.headers.host===`10.0.2.2:${base.port}`))throw fail(403,'허용되지 않은 서버 주소입니다.');
 if(req.headers.origin&&req.headers.origin!==base.origin)throw fail(403,'허용되지 않은 출처입니다.');
 const route=url.pathname;
 if(req.method==='GET'&&route==='/api/config')return json(res,200,{providers:{google:!!providers.google?.clientId&&!!providers.google?.clientSecret,naver:!!providers.naver?.clientId&&!!providers.naver?.clientSecret},places:!!kakaoKey,localAdmin:allowAdmin&&loopback(req.socket.remoteAddress)}),true;
 const match=route.match(/^\/api\/auth\/oauth\/(google|naver)\/(start|callback)$/);
 if(req.method==='GET'&&match){await oauth(req,res,url,match[1],match[2]);return true;}
 if(req.method==='GET'&&route==='/api/auth/me')return json(res,200,{user:current(req)}),true;
 if(req.method!=='POST')throw fail(405,'지원하지 않는 요청입니다.');
 const input=await body(req);
 if(route==='/api/auth/signup'||route==='/api/auth/login'){
 throttle(`auth:${req.socket.remoteAddress}`,15);
 const login=typeof input.email==='string'?input.email.trim().toLowerCase():'';const password=typeof input.password==='string'?input.password:'';
 const native=input.native===true;
 if(route.endsWith('login')&&login==='admin'){
 if(!allowAdmin||!loopback(req.socket.remoteAddress)||password!=='admin')throw fail(401,'로그인 정보를 확인해 주세요.');
 return json(res,200,issue(res,'dev-admin',native)),true;
 }
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)||login.length>254||password.length>128)throw fail(400,'이메일과 비밀번호를 확인해 주세요.');
 if(route.endsWith('signup')){
 if(input.consent!=='minimal-v1')throw fail(400,'필수 정보 처리 안내를 확인해 주세요.');
 if(password.length<10)throw fail(400,'비밀번호는 10자 이상으로 입력해 주세요.');
 const salt=randomBytes(16).toString('hex');const derived=await scrypt(password,salt,64);const id=randomUUID();
 try{db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?,?)').run(id,login,`${salt}:${derived.toString('hex')}`,'password',login,'minimal-v1',Date.now());}catch{throw fail(409,'가입을 완료하지 못했습니다. 이미 가입했다면 로그인해 주세요.');}
 return json(res,201,issue(res,id,native)),true;
 }
 const account=db.prepare("SELECT id,password FROM accounts WHERE provider='password' AND subject=?").get(login);
 const [salt,stored]=(account?.password||`${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');const derived=await scrypt(password,salt,64);
 if(!account||!timingSafeEqual(derived,Buffer.from(stored,'hex')))throw fail(401,'로그인 정보를 확인해 주세요.');
 return json(res,200,issue(res,account.id,native)),true;
 }
 if(route==='/api/auth/exchange'){
 throttle(`exchange:${req.socket.remoteAddress}`,15);
 if(typeof input.code!=='string'||typeof input.verifier!=='string'||input.verifier.length>128)throw fail(400,'인증을 다시 시작해 주세요.');
 const key=hash(input.code),exchange=db.prepare('SELECT * FROM exchanges WHERE code_hash=?').get(key);
 if(!exchange||exchange.expires<Date.now()||createHash('sha256').update(input.verifier).digest('base64url')!==exchange.challenge)throw fail(401,'앱 인증 요청이 만료되었거나 일치하지 않습니다.');
 db.prepare('DELETE FROM exchanges WHERE code_hash=?').run(key);return json(res,200,issue(res,exchange.user_id,true)),true;
 }
 const member=current(req);if(!member)throw fail(401,'다시 로그인해 주세요.');
 if(route==='/api/auth/logout'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token(req)));res.setHeader('Set-Cookie',safeCookie('lemoa_session','',0));return json(res,200,{ok:true}),true;}
 if(route==='/api/auth/delete'){
 if(input.confirm!=='DELETE')throw fail(400,'회원탈퇴 확인이 필요합니다.');
 db.prepare('DELETE FROM sessions WHERE user_id=?').run(member.id);db.prepare('DELETE FROM exchanges WHERE user_id=?').run(member.id);db.prepare('DELETE FROM accounts WHERE id=?').run(member.id);res.setHeader('Set-Cookie',safeCookie('lemoa_session','',0));return json(res,200,{ok:true}),true;
 }
 if(route==='/api/places/nearby'){
 throttle(`places:${member.id}`,8);const coords=validateCoordinates(input);
 if(!kakaoKey)throw fail(503,'주변 가게 검색 서비스가 아직 연결되지 않았습니다. 가게를 직접 선택해 주세요.');
 const radius=Math.min(1000,Math.max(150,Math.ceil(coords.accuracy*2)));
 const results=await Promise.all(catalog.merchants.map(async merchant=>{
 const query=new URLSearchParams({query:merchant.name,x:String(coords.longitude),y:String(coords.latitude),radius:String(radius),sort:'distance',size:'15'});
 const data=await upstream(`https://dapi.kakao.com/v2/local/search/keyword.json?${query}`,{headers:{Authorization:`KakaoAK ${kakaoKey}`}});
 if(!Array.isArray(data.documents))throw fail(502,'가게 검색 결과를 확인하지 못했습니다.');return mapPlaces(data.documents,merchant);
 }));
 const unique=new Map(results.flat().map(place=>[place.id,place]));
 // Coordinates stay in request memory only; never stored in accounts, DB or logs.
 return json(res,200,{places:[...unique.values()].sort((a,b)=>a.distance-b.distance).slice(0,40),accuracy:coords.accuracy,radius,source:'kakao'}),true;
 }
 throw fail(404,'요청한 기능을 찾을 수 없습니다.');
 }catch(error){json(res,error.status||500,{error:error.status?error.message:'처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'});return true;}
 }
 return {handle,close:()=>db.close()};
}
