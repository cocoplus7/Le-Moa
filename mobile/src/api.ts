import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
export type Member={id:string;role:'member'|'admin';email:string|null;provider:string};
export type ServiceConfig={providers:{google:boolean;naver:boolean};places:boolean;localAdmin:boolean};
export type Place={id:string;merchantId:string;name:string;address:string;distance:number;floor:string};
const base=process.env.EXPO_PUBLIC_API_URL||(Platform.OS==='web'?'':'http://10.0.2.2:4173');
const TOKEN_KEY='lemoa.session.v1';
let bearer:string|null=null;
export async function restoreToken(){if(Platform.OS!=='web')bearer=await SecureStore.getItemAsync(TOKEN_KEY);}
export async function request<T>(route:string,data?:unknown):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
 const response=await fetch(`${base}${route}`,{method:data===undefined?'GET':'POST',credentials:'include',headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:`Bearer ${bearer}`}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{}),signal:controller.signal});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'요청을 처리하지 못했습니다.');return result;
 }catch(error){if(error instanceof Error&&error.name==='AbortError')throw new Error('연결 시간이 초과되었습니다. 다시 시도해 주세요.');throw error;}finally{clearTimeout(timer);}
}
async function accept(result:{user:Member;token?:string}){if(Platform.OS!=='web'&&result.token){await SecureStore.setItemAsync(TOKEN_KEY,result.token);bearer=result.token;}return result.user;}
export async function passwordLogin(email:string,password:string,signup:boolean){return accept(await request(signup?'/api/auth/signup':'/api/auth/login',{email,password,native:Platform.OS!=='web',...(signup?{consent:'minimal-v1'}:{})}));}
export async function logout(remove=false){await request(remove?'/api/auth/delete':'/api/auth/logout',remove?{confirm:'DELETE'}:{});bearer=null;if(Platform.OS!=='web')await SecureStore.deleteItemAsync(TOKEN_KEY);}
export async function socialLogin(provider:'google'|'naver'):Promise<Member|null>{
 const start=`${base}/api/auth/oauth/${provider}/start?consent=minimal-v1`;
 if(Platform.OS==='web'){window.location.assign(start);return null;}
 const bytes=Crypto.getRandomBytes(32);const verifier=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const challenge=(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,verifier,{encoding:Crypto.CryptoEncoding.BASE64})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const result=await WebBrowser.openAuthSessionAsync(`${start}&native=1&challenge=${challenge}`,'lemoa://auth/callback');
 if(result.type!=='success')throw new Error('소셜 로그인이 취소되었습니다.');
 const code=new URL(result.url).searchParams.get('code');if(!code)throw new Error('소셜 로그인이 완료되지 않았습니다.');
 return accept(await request('/api/auth/exchange',{code,verifier}));
}
