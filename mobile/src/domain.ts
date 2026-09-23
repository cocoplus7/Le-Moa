import { merchants,cards,apps,type Merchant } from './registry.ts';
export const normalize=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/\s+/g,'').trim();
export function searchMerchants(query:string) {
 const q=normalize(query); if(!q) return merchants;
 return merchants.filter(m=>[m.name,...m.aliases].some(a=>normalize(a).includes(q)||q.startsWith(normalize(a))));
}
export function membershipCandidates(merchant:Merchant,holdings:string[]) {
 return merchant.options.filter(o=>holdings.includes(o.appId));
}
export function orderedCards(holdings:string[],primary:string) {
 return cards.filter(c=>holdings.includes(c.id)).sort((a,b)=>Number(b.id===primary)-Number(a.id===primary));
}
export type Preferences={memberships:string[];cards:string[];primary:string;largeText:boolean};
export const defaultPreferences:Preferences={memberships:['skt'],cards:cards.map(c=>c.id),primary:'',largeText:false};
export function restorePreferences(raw:unknown):Preferences {
 if(!raw||typeof raw!=='object') return defaultPreferences;
 const value=raw as Record<string,unknown>;
 const strings=(x:unknown,fallback:string[],allowed:string[])=>Array.isArray(x)?[...new Set(x.filter((a):a is string=>typeof a==='string'&&allowed.includes(a)))]:fallback;
 const cardIds=strings(value.cards,defaultPreferences.cards,cards.map(c=>c.id));
 return {memberships:strings(value.memberships,defaultPreferences.memberships,apps.filter(a=>a.kind!=='payment').map(a=>a.id)),cards:cardIds,primary:typeof value.primary==='string'&&cardIds.includes(value.primary)?value.primary:'',largeText:value.largeText===true};
}
export type Flow={merchantId:string|null;stage:'search'|'benefits'|'payment';lastLaunch:string|null};
export type FlowEvent={type:'select';merchantId:string}|{type:'payment'}|{type:'back'}|{type:'launch';appId:string};
export function transition(state:Flow,event:FlowEvent):Flow {
 switch(event.type){
 case 'select':return {merchantId:event.merchantId,stage:'benefits',lastLaunch:null};
 case 'payment':return {...state,stage:'payment'};
 case 'back':return {...state,stage:state.stage==='payment'&&state.merchantId?'benefits':'search'};
 case 'launch':return {...state,lastLaunch:event.appId}; // Never infer discount or payment success from launching.
 }
}
