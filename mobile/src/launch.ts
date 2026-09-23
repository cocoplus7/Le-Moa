import {Platform,Linking} from 'react-native';
import {type ExternalApp,storeUrl} from './registry';
export type LaunchResult={kind:'preview'|'opened'|'store'|'failed'|'unsupported';message:string};
export async function openExternalApp(app:ExternalApp):Promise<LaunchResult> {
 if(Platform.OS==='web') return {kind:'preview',message:`Android에서는 ${app.name} 앱을 엽니다. PC에서는 앱 실행 대신 연결 안내를 보여드립니다.`};
 if(Platform.OS!=='android') return {kind:'unsupported',message:'iOS 앱 연결은 다음 버전에서 지원합니다.'};
 try {
 const launcher=await import('expo-intent-launcher');
 launcher.openApplication(app.packageName);
 return {kind:'opened',message:`${app.name} 앱을 열었습니다. 이용 후 르모아로 돌아오세요. 앱 실행은 혜택 적용이나 결제 완료를 뜻하지 않습니다.`};
 }catch{
 try{await Linking.openURL(storeUrl(app));return {kind:'store',message:'앱을 열 수 없어 Google Play로 안내했습니다. 설치·호환 여부를 확인해 주세요.'};}
 catch{return {kind:'failed',message:'앱과 스토어를 열지 못했습니다. 해당 앱을 직접 열어 주세요. 카드 선택은 계속할 수 있습니다.'};}
 }
}
