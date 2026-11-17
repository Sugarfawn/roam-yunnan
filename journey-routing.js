/* Provider POIs and road responses stay separate from the unverified attraction entrance data. */
(function(root){
  'use strict';
  const S=()=>root.RoamAMap,P=()=>root.RoamPersonalPlaces;
  const lookups=new Map(),routes=new Map();let pluginPromise;
  const aliases={
    'dali-old-city':['大理古城'],'dali-three-pagodas':['崇圣寺三塔文化旅游区','崇圣寺三塔'],
    'dali-longkan':['龙龛码头','龙龛古渡'],'dali-caicun':['才村码头','才村'],
    'dali-xizhou':['喜洲古镇'],'dali-yan-courtyard':['严家大院博物馆','严家大院'],
    'dali-shuanglang':['双廊古镇'],'dali-erhai-park':['洱海公园'],
    'lijiang-old-city':['丽江古城'],'lijiang-black-dragon':['黑龙潭公园'],
    'lijiang-shuhe':['束河古镇'],'lijiang-baisha':['白沙古镇'],'lijiang-mural':['白沙壁画'],
    'lijiang-yuhu':['玉湖村'],'lijiang-yulong-mountain':['玉龙雪山景区','玉龙雪山'],
    'lijiang-yunshanping':['云杉坪'],'lijiang-yushui':['玉水寨'],
    'meili-feilai':['飞来寺观景台'],'meili-moon-bend':['金沙江大湾'],'meili-mingyong':['明永冰川'],'meili-deqin-town':['德钦县城'],
    'shangri-abuji':['阿布吉措'],'shangri-songzanlin':['松赞林寺','噶丹松赞林寺'],
    'shangri-napahai':['纳帕海'],'shangri-oldtown':['独克宗古城'],
    'banna-botanical':['中国科学院西双版纳热带植物园'],'banna-gasa':['西双版纳傣族园'],
    'banna-mengyuan':['勐远仙境'],'banna-menghai':['景洪市澜沧江江边']
  };
  const normalized=s=>String(s).replace(/[\s·•()（）\-—,，]/g,'');
  const queries=spot=>aliases[spot.id]||[spot.name];
  async function resolveSpot(spot,bindings){
    const saved=P().normalizeBindings(bindings)[spot.id];if(saved)return saved;
    // A broad town/river region has no single legitimate route endpoint.
    if(['meili-deqin-town','banna-menghai','shangri-napahai'].includes(spot.id))return null;
    if(lookups.has(spot.id))return lookups.get(spot.id);
    const promise=(async()=>{
      for(const query of queries(spot)){
        const rows=await S().search(query,spot.area,'other');
        const exact=rows.filter(row=>queries(spot).some(name=>normalized(name)===normalized(row.name)));
        if(exact.length===1){const poi=await S().resolve(exact[0]);const result=P().normalizeBindings({[spot.id]:{...poi,match:'exact-name',queriedAt:new Date().toISOString()}})[spot.id];if(result)return result;}
      }return null;
    })().catch(()=>null);
    lookups.set(spot.id,promise);const result=await promise;if(!result)lookups.delete(spot.id);return result;
  }
  function routePlugins(){
    if(!pluginPromise)pluginPromise=S().load().then(AMap=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('ROUTE_PLUGIN_TIMEOUT')),16000);AMap.plugin(['AMap.Driving','AMap.Walking','AMap.Transfer'],()=>{clearTimeout(t);resolve(AMap);});})).catch(error=>{pluginPromise=null;throw error;});
    return pluginPromise;
  }
  function pathsOf(value){
    const paths=[],seen=new Set();
    function visit(node,depth=0){
      if(!node||depth>9||typeof node!=='object'||seen.has(node))return;seen.add(node);
      if(Array.isArray(node)){node.forEach(n=>visit(n,depth+1));return;}
      if(Array.isArray(node.path)){const p=node.path.map(point=>Array.isArray(point)?point:typeof point.getLng==='function'?[point.getLng(),point.getLat()]:[point.lng,point.lat]).filter(p=>p.length===2&&p.every(Number.isFinite));if(p.length>1)paths.push(p);}
      for(const key of ['steps','segments','walking','transit','buslines','railway'])if(node[key])visit(node[key],depth+1);
    }visit(value);return paths;
  }
  async function route(from,to,mode){
    if(!from||!to)return{status:'missing',mode};
    if(from.poiId===to.poiId)return{status:'same',mode,distanceMeters:0,durationSeconds:0,paths:[],source:'same-poi',queriedAt:new Date().toISOString()};
    const key=[mode,from.poiId,to.poiId,from.coordinates.join(','),to.coordinates.join(',')].join('|');
    if(routes.has(key)){const cached=await routes.get(key);if(!cached.queriedAt||Date.now()-Date.parse(cached.queriedAt)<30*60*1000)return cached;routes.delete(key);}
    if(mode==='public'&&from.adcode.slice(0,4)!==to.adcode.slice(0,4))return{status:'unavailable',mode,message:'跨城公共交通需另查城际班次'};
    const promise=(async()=>{
      const AMap=await routePlugins();
      const router=mode==='walk'?new AMap.Walking():mode==='public'?new AMap.Transfer({city:from.city||S().cityFor(from.area),cityd:to.city||S().cityFor(to.area)}):new AMap.Driving({policy:0});
      return new Promise(resolve=>{
        const timer=setTimeout(()=>resolve({status:'unavailable',mode,message:'交通查询超时'}),16000);
        router.search(from.coordinates,to.coordinates,(status,result)=>{
          clearTimeout(timer);const item=mode==='public'?result?.plans?.[0]:result?.routes?.[0];
          if(status!=='complete'||!item||!Number.isFinite(Number(item.distance))||!Number.isFinite(Number(item.time))){resolve({status:'unavailable',mode,message:'未查到可用的'+({walk:'步行',drive:'驾车',public:'公交'})[mode]+'方案'});return;}
          resolve({status:'ok',mode,distanceMeters:Number(item.distance),durationSeconds:Number(item.time),paths:pathsOf(item),source:'AMap.'+({walk:'Walking',drive:'Driving',public:'Transfer'})[mode],queriedAt:new Date().toISOString()});
        });
      });
    })().catch(()=>({status:'unavailable',mode,message:'地图交通服务暂不可用'}));
    routes.set(key,promise);const result=await promise;if(result.status!=='ok')routes.delete(key);return result;
  }
  async function recommend(from,to,transport){
    if(transport==='drive')return route(from,to,'drive');
    if(transport==='public')return route(from,to,'public');
    const [drive,walking]=await Promise.all([route(from,to,'drive'),route(from,to,'walk')]);
    // Recommendation uses an actual walking path, even where driving requires a long detour.
    if(['ok','same'].includes(walking.status)&&walking.distanceMeters<=2000&&walking.durationSeconds<=1800)return{...walking,recommended:true};
    if(drive.status!=='ok'&&walking.status==='ok')return{...walking,recommended:true};
    return{...drive,recommended:true};
  }
  const distance=n=>n>=1000?(n/1000).toFixed(1)+' 公里':Math.round(n/10)*10+' 米';
  const duration=n=>{const min=Math.max(1,Math.ceil(n/60));return min>=60?Math.floor(min/60)+'小时'+(min%60?min%60+'分钟':''):min+'分钟';};
  root.RoamJourneyRouting=Object.freeze({resolveSpot,route,recommend,queries,distance,duration,clear(){routes.clear();lookups.clear();}});
})(window);
