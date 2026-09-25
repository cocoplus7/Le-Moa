// Published benefit conditions, reviewed against official sources on 2026-09-24.
// These are conditional advertised rates, not a personal eligibility or value ranking.
export const gradeOptions:Record<string,string[]>={skt:['VIP','GOLD','SILVER','LITE'],kt:['VVIP','VIP','GOLD','SILVER','WHITE','일반'],lgu:['VVIP','VIP','우수'],outback:['WELCOME','SILVER','GOLD','PLATINUM']};
export function restoreGrades(raw:unknown):Record<string,string>{
 const v=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 return Object.fromEntries(Object.entries(gradeOptions).map(([id,allowed])=>[id,typeof v[id]==='string'&&allowed.includes(v[id])?v[id]:'미설정']));
}
export function membershipRate(store:string,app:string,grade:string,mode:string){
 if(!gradeOptions[app])return '쿠폰·적립 조건은 해당 앱에서 확인';
 if(!gradeOptions[app].includes(grade))return '내 등급을 설정하면 등급별 혜택이 표시돼요';
 const earn=mode==='earn';const unit=earn?'P 적립':'원 할인';const action=earn?'적립':'할인';
 if(app==='skt'){
  if(grade==='LITE')return '할인·적립 대상 여부를 T 멤버십에서 확인';
  if(mode!=='earn'&&mode!=='discount')return 'T 멤버십 할인형·적립형을 설정해 주세요';
  if(['paris','cu'].includes(store))return `1,000원당 ${grade==='SILVER'?50:100}${unit}`;
  if(store==='papa')return `${grade==='VIP'?30:15}% ${action} · 일 1회`;
  if(store==='outback')return `${grade==='SILVER'?5:15}% ${action} · 일 1회 / 월 4회`;
 }
 if(app==='kt'){
  const high=['VVIP','VIP','GOLD'].includes(grade);
  if(store==='paris')return `1,000원당 ${high?100:50}원 할인 · 포인트 차감`;
  if(store==='outback')return `${high?15:5}% 할인`;
 }
 if(app==='lgu'&&store==='paris')return `1,000원당 ${grade==='우수'?50:100}원 할인`;
 if(app==='outback'&&store==='outback')return `10% 할인 또는 ${['GOLD','PLATINUM'].includes(grade)?3:2}% 부메랑 포인트 적립`;
 return '선택한 등급의 사용 가능 쿠폰을 앱에서 확인';
}
export function cardBenefit(id:string,store?:string):{headline:string;condition:string}{
 switch(id){
 case 'sk':return store==='starbucks'?{headline:'조건 충족 시 10% 할인',condition:'전월 실적 20만원 이상. 스타벅스 가맹점 인정·제외 매장·세부 한도는 하나Pay에서 확인. OK캐쉬백과 합산 계산하지 않아요.'}:{headline:'0.3~0.9% OK캐쉬백 적립',condition:'해당 월 국내외 신용판매 결제금액 구간에 따라 달라져요. 실적·적립 제외 조건은 상세 혜택을 확인하세요.'};
 case 'hilton':return {headline:'1,500원당 2 힐튼 포인트',condition:'국내 일반 가맹점 기준 · 실적 조건·적립 한도 없음. 2% 적립이 아니며 현금과 가치가 다릅니다.'};
 case 'pink':return store==='olive'?{headline:'조건 충족 시 5% M포인트',condition:'전월 100만원 이상 · 패션/뷰티 월 3만 M포인트. 한도 초과 시 기본 1.5%, 전월 50만원 미만은 기본 적립 제외.'}:{headline:'조건 충족 시 1.5% M포인트',condition:'전월 50만원 이상 · 기본 적립 한도 없음. 전월 실적은 자동 조회되지 않습니다.'};
 case 'zero':return {headline:'1.2% M포인트 적립',condition:'전월 실적·적립 한도 없음. 상품권·선불카드 충전·무이자할부 등은 적립에서 제외됩니다.'};
 default:return {headline:'혜택 확인 필요',condition:'카드사 공식 안내를 확인하세요.'};
 }
}
export const cardDetails:Record<string,{title:string;text:string}[]>={
 sk:[{title:'스마트라이프(마트형) · OK캐쉬백',text:'월 신용판매 결제금액에 따라 100만원 이하 0.3%, 100만원 초과~200만원 이하 0.5%, 200만원 초과~300만원 이하 0.7%, 300만원 초과 0.9%. 다음 달 10영업일 이전 일괄 적립. 캐쉬백포인트 수수료는 별도입니다.'},{title:'마트·커피 혜택',text:'이마트·트레이더스·홈플러스·롯데마트 합산 5만원 이용마다 5천원 모바일 쿠폰, 월 최대 10매. 쿠폰 사용 조건이 별도로 있으며 즉시 10% 할인이 아닙니다. 스타벅스·커피빈·카페베네 결제금액 10% 할인은 공통 서비스입니다.'},{title:'실적·제외 조건',text:'서비스 기준: 전월 20만원 이상. 스마트라이프 실적에서 SK주유소·충전소, 지정 마트, 아파트관리비·도시가스 자동납부 제외. 첫 등록 다음 달 말일까지 유예. 세금·무이자할부·상품권·등록금·수수료 등 포인트 적립 제외. 커피 세부 한도와 최신 SK 제휴 서비스는 하나Pay에서 확인하세요.'},{title:'자료 기준',text:'하나카드 스마트라이프 공식 안내장 기준. 항공 마일리지형과 다릅니다. 발급 시점·제휴 변경에 따른 개인 적용 조건을 확인하세요.'}],
 hilton:[{title:'힐튼 아너스 포인트',text:'국내 일반 가맹점은 1,500원당 2포인트. 국내 오프라인 면세점 및 대한항공·아시아나 직접 항공권 구매는 6포인트. 해외 및 국내외 힐튼 호텔 이용은 8포인트. 전월 실적·적립 한도 없음. 힐튼 포인트를 현금 할인율로 환산하지 않습니다.'},{title:'적립 제외',text:'무이자할부, 세금·공과금, 상품권 및 선불카드 구매·충전, 포인트 충전 등은 제외됩니다. 카드사에 등록된 가맹점 분류에 따라 적용됩니다.'},{title:'호텔·여행 서비스',text:'힐튼 등급·숙박권·공항 라운지는 별도 발급 및 이용실적 조건이 있습니다. 개인별 보유 숙박권과 상세 이용 조건은 공식 상품 안내에서 확인하세요.'}],
 pink:[{title:'기본 1.5% M포인트',text:'전월 이용금액 50만원 이상일 때 국내외 일반 가맹점 1.5% 적립, 기본 적립 한도 없음.'},{title:'쇼핑 5% M포인트',text:'전월 100만원 이상: 지정 백화점/프리미엄 아울렛 월 5만, 패션/뷰티 월 3만, 온라인몰 월 2만 M포인트 한도. 올리브영 온·오프라인은 패션/뷰티 대상. 한도 초과 시 기본률 적용. 기본·특별 적립을 합산하지 않습니다. PG·간편결제로 가맹점이 다르게 잡히면 특별 적립 제외 가능.'},{title:'바우처·공항 혜택',text:'연 15만원 바우처: 첫해 누적 100만원 이상 사용 가능, 2차년도부터 전년도 1,200만원 이상 제공. 전월 50만원 이상 시 라운지 연 5회, 지정 공항·호텔 발레파킹 통합 월 5회. 별도 이용 조건 적용.'},{title:'제외 항목',text:'상품권·선불카드 충전, 세금·공과금·관리비·등록금 등 제외. 이 카드 혜택 외 현대카드 할인 또는 무이자할부가 적용된 건은 적립 제외. M포인트는 현금과 전환·사용 가치가 다릅니다.'}],
 zero:[{title:'국내외 1.2% M포인트',text:'전월 이용실적과 적립한도 없이 국내외 가맹점에서 1.2% M포인트 적립. ZERO Edition3 포인트형 기준이며 할인형과 다릅니다.'},{title:'적립 제외',text:'상품권·선불카드 구매/충전, 무이자할부, 현대카드 자체 할인 적용 거래, 세금·공과금·관리비·등록금 등은 제외됩니다. 일부 결제는 카드사 가맹점 분류에 따라 달라집니다.'},{title:'사용 시 확인',text:'M포인트는 현금과 동일하지 않습니다. 적립률은 상품 구매 결제 기준이며 스타벅스 카드 등 선불잔액 충전에는 적용하지 않습니다.'}]
};
