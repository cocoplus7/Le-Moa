import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createApi,validateCoordinates,mapPlaces} from '../api.mjs';
async function fixture(t,options={}){
 let api;const server=createServer((req,res)=>{void api.handle(req,res);});server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`;api=createApi({dbPath:':memory:',origin,...options});
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close();});
 const call=(route,data,headers={})=>fetch(origin+route,{method:data===undefined?'GET':'POST',redirect:'manual',headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(data!==undefined?{body:JSON.stringify(data)}:{})});
 return {call,origin};
}
const credentials={email:'member@example.test',password:'a-strong-test-password',consent:'minimal-v1'};
const cookie=response=>response.headers.get('set-cookie').split(';')[0];
test('direct signup, opaque session, login, logout and deletion',async t=>{
 const {call}=await fixture(t);const signup=await call('/api/auth/signup',credentials);assert.equal(signup.status,201);const first=await signup.json();assert.equal(first.user.email,credentials.email);assert.equal(first.user.role,'member');assert.equal(first.token,undefined);assert.ok(!JSON.stringify(first).includes(credentials.password));assert.match(signup.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);const session=cookie(signup);
 assert.equal((await (await call('/api/auth/me',undefined,{Cookie:session})).json()).user.id,first.user.id);
 assert.equal((await call('/api/auth/login',{...credentials,password:'incorrect'})).status,401);
 assert.equal((await call('/api/auth/logout',{}, {Cookie:session})).status,200);
 assert.equal((await (await call('/api/auth/me',undefined,{Cookie:session})).json()).user,null);
 const login=await call('/api/auth/login',{...credentials,native:true});const native=await login.json();assert.ok(native.token);assert.equal(login.headers.get('set-cookie'),null);const headers={Authorization:`Bearer ${native.token}`};
 assert.equal((await call('/api/auth/delete',{confirm:'DELETE'},headers)).status,200);assert.equal((await call('/api/auth/login',credentials)).status,401);
});
test('signup requires consent and strong password; cross-origin POST is denied',async t=>{
 const {call}=await fixture(t);assert.equal((await call('/api/auth/signup',{...credentials,consent:''})).status,400);assert.equal((await call('/api/auth/signup',{...credentials,password:'short'})).status,400);assert.equal((await call('/api/auth/signup',credentials,{Origin:'https://evil.example'})).status,403);
});
test('admin/admin only works when explicitly enabled locally; never production',async t=>{
 const off=await fixture(t);assert.equal((await off.call('/api/auth/login',{email:'admin',password:'admin'})).status,401);
 const on=await fixture(t,{allowAdmin:true});const result=await on.call('/api/auth/login',{email:'admin',password:'admin',native:true});assert.equal(result.status,200);assert.equal((await result.json()).user.role,'admin');assert.throws(()=>createApi({production:true,allowAdmin:true,origin:'https://example.com',dbPath:':memory:'}));assert.throws(()=>createApi({allowAdmin:true,origin:'http://example.com',dbPath:':memory:'}));
});
test('nearby location needs a session, validates coordinates and reports missing configuration',async t=>{
 const {call}=await fixture(t,{allowAdmin:true});assert.equal((await call('/api/places/nearby',{latitude:37,longitude:127,accuracy:10})).status,401);const admin=await (await call('/api/auth/login',{email:'admin',password:'admin',native:true})).json();const headers={Authorization:`Bearer ${admin.token}`};assert.equal((await call('/api/places/nearby',{latitude:999,longitude:127,accuracy:10},headers)).status,400);assert.equal((await call('/api/places/nearby',{latitude:37,longitude:127,accuracy:10},headers)).status,503);
});
test('nearby returns separate branches without pretending GPS knows floors',async t=>{
 const {call}=await fixture(t,{allowAdmin:true,kakaoKey:'test-key',fetchImpl:async url=>{const query=new URL(url).searchParams;assert.equal(query.get('radius'),'400');return {ok:true,json:async()=>({documents:query.get('query')==='파리바게뜨'?[{id:'one',place_name:'파리바게뜨 A점',road_address_name:'테스트 주소',distance:'8'},{id:'two',place_name:'파리바게뜨 B점',address_name:'테스트 주소',distance:'12'}]:[]})};}});
 const admin=await (await call('/api/auth/login',{email:'admin',password:'admin',native:true})).json();const result=await (await call('/api/places/nearby',{latitude:37,longitude:127,accuracy:200},{Authorization:`Bearer ${admin.token}`})).json();assert.equal(result.places.length,2);assert.equal(result.accuracy,200);assert.equal(result.places[0].merchantId,'paris');assert.match(result.places[0].floor,/제공되지/);assert.equal(result.latitude,undefined);
});
test('invalid coordinates and mismatched merchant names are rejected',()=>{
 for(const coords of [{latitude:NaN,longitude:127,accuracy:10},{latitude:37,longitude:181,accuracy:10},{latitude:37,longitude:127,accuracy:-1}])assert.throws(()=>validateCoordinates(coords));assert.deepEqual(mapPlaces([{place_name:'다른 가게'}],{id:'paris',name:'파리바게뜨'}),[]);
});
test('unconfigured social login and tampered OAuth state cannot sign in',async t=>{
 const off=await fixture(t);assert.equal((await off.call('/api/auth/oauth/google/start?consent=minimal-v1')).status,503);const on=await fixture(t,{providers:{google:{clientId:'id',clientSecret:'secret'}}});assert.equal((await on.call('/api/auth/oauth/google/callback?code=fake&state=fake')).status,400);
});
test('OAuth native exchange is browser-bound, PKCE-bound, one use, and stores no optional profile',async t=>{
 const verifier='test-verifier-with-at-least-forty-three-characters-1234',challenge=createHash('sha256').update(verifier).digest('base64url');
 const {call}=await fixture(t,{providers:{google:{clientId:'id',clientSecret:'secret'}},fetchImpl:async url=>({ok:true,json:async()=>url.includes('/token')?{access_token:'test-provider-token'}:{sub:'unique-provider-id',email:'not-collected@example.test',name:'Not collected'}})});
 const start=await call(`/api/auth/oauth/google/start?consent=minimal-v1&native=1&challenge=${challenge}`);assert.equal(start.status,302);const destination=new URL(start.headers.get('location'));assert.equal(destination.searchParams.get('scope'),'openid');const state=destination.searchParams.get('state');const result=await call(`/api/auth/oauth/google/callback?code=fake&state=${state}`,undefined,{Cookie:cookie(start)});assert.equal(result.status,302);const code=new URL(result.headers.get('location')).searchParams.get('code');
 assert.equal((await call('/api/auth/exchange',{code,verifier:'wrong'})).status,401);const exchange=await call('/api/auth/exchange',{code,verifier});assert.equal(exchange.status,200);const account=await exchange.json();assert.equal(account.user.email,null);assert.equal(account.user.provider,'google');assert.equal((await call('/api/auth/exchange',{code,verifier})).status,401);
});
