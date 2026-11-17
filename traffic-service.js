/* Bounded browser-side road verification; credentials remain with the existing AMap SDK. */
(function(root){
  'use strict';
  function abortError(){const e=Error('交通核验已取消');e.name='AbortError';return e;}
  function guard(signal){if(signal?.aborted)throw abortError();}
  async function wait(promise,signal){
    guard(signal);if(!signal)return promise;
    let listener;const aborted=new Promise((_,reject)=>{listener=()=>reject(abortError());signal.addEventListener('abort',listener,{once:true});});
    try{return await Promise.race([promise,aborted]);}finally{signal.removeEventListener('abort',listener);}
  }
  async function checkDay(plan,day,{signal}={}){
    const F=root.RoamTraffic,J=root.RoamJourneyRouting,settings={...plan.settings,poiBindings:{...plan.settings.poiBindings}},list=F.entries(day,settings),points=[];
    for(const entry of list){
      guard(signal);const poi=entry.type==='personal'?entry.place:await wait(J.resolveSpot(entry.spot,settings.poiBindings),signal);guard(signal);
      if(poi){points.push({key:entry.key,index:entry.indexInDay,name:entry.name,poi});if(entry.type==='attraction')settings.poiBindings[entry.id]=poi;}
    }
    const legs=[];
    for(let i=0;i<list.length-1;i++){
      guard(signal);const from=list[i],to=list[i+1],a=points.find(p=>p.key===from.key)?.poi,b=points.find(p=>p.key===to.key)?.poi,mode=settings.legModes?.[F.legKey(day,from,to)];
      const result=await wait(mode?J.route(a,b,mode):J.recommend(a,b,settings.transport),signal);guard(signal);legs.push({from,to,result});
    }
    return{dayNumber:day.dayNumber,bindings:settings.poiBindings,traffic:F.evidence(day,settings,legs),points,legs};
  }
  async function checkPlan(plan,{signal,onDay,onProgress}={}){
    const snapshot=JSON.parse(JSON.stringify(plan)),eligible=snapshot.days.filter(d=>d.type!=='transfer');let cursor=0,done=0;
    if(root.RoamAMap?.load)await wait(root.RoamAMap.load(),signal);
    await Promise.all([0,1].map(async()=>{while(cursor<eligible.length){guard(signal);const day=eligible[cursor++],result=await checkDay(snapshot,day,{signal});guard(signal);onDay?.(result);onProgress?.(++done,eligible.length);}}));
  }
  root.RoamTrafficService=Object.freeze({checkDay,checkPlan});
})(window);
