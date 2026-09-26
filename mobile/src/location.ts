import {Platform} from 'react-native';
import * as Location from 'expo-location';
export async function currentPosition():Promise<{latitude:number;longitude:number;accuracy:number}>{
 if(Platform.OS==='web')return new Promise((resolve,reject)=>{
 if(!navigator.geolocation){reject(new Error('이 브라우저에서는 위치를 사용할 수 없습니다. 가게를 직접 선택해 주세요.'));return;}
 navigator.geolocation.getCurrentPosition(position=>resolve({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy}),()=>reject(new Error('위치를 확인하지 못했습니다. 위치 권한과 GPS를 확인하거나 가게를 직접 선택해 주세요.')),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 });
 const permission=await Location.requestForegroundPermissionsAsync();
 if(permission.status!=='granted')throw new Error('위치 권한이 없습니다. 가게를 직접 선택하거나 기기 설정에서 권한을 허용해 주세요.');
 if(!await Location.hasServicesEnabledAsync())throw new Error('기기의 위치 서비스를 켜거나 가게를 직접 선택해 주세요.');
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{const position=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('GPS 확인 시간이 초과되었습니다. 다시 시도하거나 가게를 직접 선택해 주세요.')),15000);})]);return {latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy??1000};}finally{if(timer)clearTimeout(timer);}
}
