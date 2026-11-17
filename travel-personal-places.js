/* User-confirmed AMap POIs are separate from the curated attraction catalogue. */
(function(root){
  'use strict';
  const clean=(s,max=160)=>typeof s==='string'?s.trim().slice(0,max):'';
  const regionFromAdcode=code=>code.startsWith('5329')?'erhai':code.startsWith('5307')?'yulong':code.startsWith('5328')?'banna':code.startsWith('533422')?'meili':code.startsWith('5334')?'shangri':null;
  function normalize(values){
    if(!Array.isArray(values))return[];
    const result=[],seen=new Set();
    for(const value of values.slice(0,40)){
      if(!value||value.provider!=='amap'||value.coordinateSystem!=='GCJ-02'||!['hotel','restaurant','other'].includes(value.kind))continue;
      const poiId=clean(value.poiId,80),name=clean(value.name),adcode=clean(value.adcode,6),coords=value.coordinates;
      if(!poiId||!name||!/^53\d{4}$/.test(adcode)||!Array.isArray(coords)||coords.length!==2||!coords.every(n=>typeof n==='number'&&Number.isFinite(n))||coords[0]<97||coords[0]>107||coords[1]<20||coords[1]>30)continue;
      const fromDay=Number(value.fromDay),toDay=value.kind==='hotel'?Number(value.toDay):fromDay;
      if(!Number.isInteger(fromDay)||!Number.isInteger(toDay)||fromDay<1||toDay<fromDay||toDay>4)continue;
      const slot=value.kind==='hotel'?'stay':value.kind==='restaurant'?(value.slot==='dinner'?'dinner':'lunch'):['morning','afternoon','evening'].includes(value.slot)?value.slot:'afternoon';
      const id=['amap',poiId,value.kind,fromDay,toDay,slot].join(':');if(seen.has(id))continue;seen.add(id);
      result.push({id,provider:'amap',poiId,name,address:clean(value.address,240),city:clean(value.city,60),adcode,area:regionFromAdcode(adcode),coordinates:[...coords],coordinateSystem:'GCJ-02',locationRole:'provider-poi-not-verified-entrance',kind:value.kind,fromDay,toDay,slot});
    }
    return result;
  }
  function forDay(settings,dayNumber){return normalize(settings.personalPlaces).filter(p=>p.fromDay<=dayNumber&&p.toDay>=dayNumber);}
  function sequence(day,settings){
    const places=forDay(settings,day.dayNumber),hotels=places.filter(p=>p.kind==='hotel'),hotel=hotels[0],other=slot=>places.filter(p=>p.kind!=='hotel'&&p.slot===slot).map(place=>({type:'personal',place}));
    const scenic=(day.stops||[]).map((id,index)=>({type:'attraction',id,index}));
    return [...(hotel?[{type:'personal',place:hotel,role:'start'}]:[]),...other('morning'),...scenic.slice(0,1),...other('lunch'),...scenic.slice(1),...other('afternoon'),...other('dinner'),...other('evening'),...(hotel?[{type:'personal',place:hotel,role:'end'}]:[])];
  }
  function check(plan){
    const places=normalize(plan.settings.personalPlaces),warnings=[],violations=[];
    if(places.length){warnings.push('酒店、餐厅与自选地点来自高德 POI；标记不是已核实入口。酒店往返与餐厅交通参与道路核验；餐厅使用编辑用餐预留，自选地点停留未知时只评估已知部分。');}
    for(let n=1;n<=plan.settings.days;n++){
      const day=plan.days[n-1],items=forDay(plan.settings,n),hotels=items.filter(p=>p.kind==='hotel');
      if(hotels.length>1)violations.push(`Day ${String(n).padStart(2,'0')} 有重叠酒店，请为当天保留一个住宿起终点。`);
      for(const slot of ['lunch','dinner'])if(items.filter(p=>p.slot===slot).length>1)warnings.push(`Day ${String(n).padStart(2,'0')} 同一餐段选择了多家餐厅，请确认是否只保留一家。`);
      if(items.some(p=>!p.area||p.area!==(day?.area||plan.settings.area)))warnings.push(`Day ${String(n).padStart(2,'0')} 自选地点与当天游玩地区不同或尚未匹配，需单独确认转场。`);
      if(day?.type==='transfer'&&items.some(p=>p.kind!=='hotel'))warnings.push(`Day ${String(n).padStart(2,'0')} 为转场日，餐厅与自选地点能否停留需按实际交通确认。`);
      if(items.some(p=>p.kind!=='hotel')&&(day?.stops||[]).some(id=>root.RoamAttractions?.get(id)?.kind.some(kind=>['hike','dedicated'].includes(kind))))warnings.push(`Day ${String(n).padStart(2,'0')} 含独立整日或徒步景点，不能默认能顺路前往所选餐厅 / 自选地点，请确认可达性或改期。`);
    }
    if(places.some(p=>p.toDay>plan.settings.days))warnings.push('旅行天数缩短后，仍有自选地点在行程日期之外；已保留，请在修改计划中调整日期。');
    return{warnings,violations};
  }
  const label=p=>p.kind==='hotel'?`Day ${p.fromDay}${p.toDay!==p.fromDay?'–'+p.toDay:''} · 住宿起终点`:`Day ${p.fromDay} · ${({lunch:'午餐',dinner:'晚餐',morning:'上午',afternoon:'下午',evening:'傍晚'})[p.slot]}`;
  function normalizeBindings(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return{};
    const out={};for(const[id,p]of Object.entries(value).slice(0,50)){
      const spot=root.RoamAttractions?.get(id);if(!spot||!p)continue;
      const candidate=normalize([{...p,kind:'other',fromDay:1,toDay:1,slot:'afternoon'}])[0];
      if(!candidate||candidate.area!==spot.area||!['exact-name','user-confirmed'].includes(p.match))continue;
      out[id]={provider:'amap',poiId:candidate.poiId,name:candidate.name,address:candidate.address,city:candidate.city,adcode:candidate.adcode,area:candidate.area,coordinates:candidate.coordinates,coordinateSystem:'GCJ-02',locationRole:'provider-poi-reference',match:p.match,queriedAt:clean(p.queriedAt,35)};
    }return out;
  }
  root.RoamPersonalPlaces=Object.freeze({normalize,forDay,sequence,check,label,regionFromAdcode,normalizeBindings});
})(typeof window!=='undefined'?window:globalThis);
