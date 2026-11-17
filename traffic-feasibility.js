/* Pure accounting of provider road evidence. No straight-line distance or invented drive time. */
(function(root){
  'use strict';
  const TTL=30*60*1000;
  const legKey=(day,from,to)=>JSON.stringify([day.dayNumber,from.key,to.key]);
  function entries(day,settings){
    return root.RoamPersonalPlaces.sequence(day,settings).map((entry,index)=>entry.type==='attraction'
      ?{...entry,key:entry.id,name:root.RoamAttractions.get(entry.id).name,spot:root.RoamAttractions.get(entry.id),indexInDay:index}
      :{...entry,key:entry.place.id+':'+(entry.role||entry.place.slot),name:entry.place.name,indexInDay:index});
  }
  function fingerprint(day,settings){
    const list=entries(day,settings),keys=list.slice(0,-1).map((e,i)=>legKey(day,e,list[i+1]));
    return JSON.stringify([day.dayNumber,day.type,day.area,day.stops,settings.days,settings.pace,settings.transport,
      settings.arrivalWindow,settings.departureWindow,settings.arrivalTime,settings.departureTime,
      day.timings||{},day.entryOrder||[],day.startTime||'',root.RoamPersonalPlaces.forDay(settings,day.dayNumber),day.stops.map(id=>settings.poiBindings?.[id]||null),keys.map(k=>settings.legModes?.[k]||null)]);
  }
  function fresh(day,settings,now=Date.now()){
    const t=day.traffic,stamp=Date.parse(t?.queriedAt);
    return Boolean(t&&t.version===1&&t.fingerprint===fingerprint(day,settings)&&Number.isFinite(stamp)&&now>=stamp&&now-stamp<TTL);
  }
  function evidence(day,settings,legs,now=Date.now()){
    return{version:1,fingerprint:fingerprint(day,settings),queriedAt:new Date(now).toISOString(),legs:legs.map(l=>({
      key:legKey(day,l.from,l.to),fromKey:l.from.key,toKey:l.to.key,status:l.result?.status||'unavailable',mode:l.result?.mode||settings.transport,
      source:l.result?.source||null,durationSeconds:Number.isFinite(l.result?.durationSeconds)?l.result.durationSeconds:null,
      distanceMeters:Number.isFinite(l.result?.distanceMeters)?l.result.distanceMeters:null,queriedAt:l.result?.queriedAt||null
    }))};
  }
  function assess(plan,day,now=Date.now()){
    const s=plan.settings,list=entries(day,s),base=root.RoamRules.assess(day,s);
    if(day.type==='transfer')return{status:'transfer',label:'转场待核实',notes:['城际移动、班次与接驳需单独确认，不据此给出完成判断。'],suggestions:[]};
    if(!list.length)return{status:'empty',label:'留白休息',notes:[],suggestions:[]};
    const hasEvidence=fresh(day,s,now),stored=day.traffic,expected=list.slice(0,-1).map((e,i)=>legKey(day,e,list[i+1]));
    // Never accept an unrelated, duplicated, negative or unproven road result from storage.
    const records=hasEvidence&&Array.isArray(stored.legs)?stored.legs:[];
    const valid=expected.map(key=>records.filter(l=>l.key===key)).filter(rows=>rows.length===1).map(rows=>rows[0]).filter(l=>Number.isFinite(Date.parse(l.queriedAt))&&now>=Date.parse(l.queriedAt)&&now-Date.parse(l.queriedAt)<TTL).filter(l=>
      (l.status==='same'&&l.source==='same-poi'&&l.durationSeconds===0&&l.distanceMeters===0)||
      (l.status==='ok'&&({drive:'AMap.Driving',walk:'AMap.Walking',public:'AMap.Transfer'})[l.mode]===l.source&&Number.isFinite(l.durationSeconds)&&l.durationSeconds>=0&&Number.isFinite(l.distanceMeters)&&l.distanceMeters>=0));
    const roadMinutes=Math.ceil(valid.reduce((sum,l)=>sum+l.durationSeconds,0)/60),missingLegs=expected.length-valid.length;
    const places=root.RoamPersonalPlaces.forDay(s,day.dayNumber),restaurants=places.filter(p=>p.kind==='restaurant');
    const lunch=restaurants.filter(p=>p.slot==='lunch').length,dinner=restaurants.filter(p=>p.slot==='dinner').length;
    const mealMinutes=Math.max(base.mealMinutes,lunch*60)+(dinner*60),restMinutes=Math.max(base.restMinutes,list.length?root.RoamTravelTemplates.buffer.rest[s.pace]:0);
    const unknownStops=day.stops.filter(id=>!root.RoamAttractions.get(id).estimate).length+places.filter(p=>p.kind==='other').length;
    const hotel=places.some(p=>p.kind==='hotel'),missingHotel=!hotel&&Boolean(day.stops.length||places.length),bufferMinutes=30;
    let visitMin=base.visitMin,visitMax=base.visitMax;for(const id of day.stops){const time=day.timings?.[id],estimate=root.RoamAttractions.get(id).estimate;if(time?.start&&time?.end&&time.end>time.start){const m=t=>Number(t.slice(0,2))*60+Number(t.slice(3)),duration=m(time.end)-m(time.start);visitMin+=duration-(estimate?.min||0);visitMax+=duration-(estimate?.max||0);}}
    const minimumMinutes=visitMin+mealMinutes+restMinutes+bufferMinutes+roadMinutes,maximumMinutes=visitMax+mealMinutes+restMinutes+bufferMinutes+roadMinutes;
    const internalTransportUnknown=day.stops.some(id=>root.RoamAttractions.get(id).kind.some(k=>['hike','dedicated'].includes(k)));
    const usableMinutes=base.usableMinutes,complete=hasEvidence&&!missingLegs&&!unknownStops&&!missingHotel&&!internalTransportUnknown;
    const status=minimumMinutes>usableMinutes?'over':maximumMinutes>usableMinutes?'tight':!hasEvidence?'pending':!complete?'partial':'within';
    const labels={over:'安排过满',tight:'时间偏紧',pending:'交通待核验',partial:'部分信息待补',within:'当前估算可安排'};
    const notes=[];
    if(status==='over')notes.push('已知部分的最低用时已超过当天预算，建议删减或改期。');
    if(status==='tight')notes.push('按较宽松的游览估算可能超时，建议减少一处或增加留白。');
    if(s.transport==='undecided')notes.push('交通方式暂未决定，按已查的建议方式估算；确定方式后请重新核验。');
    if(!hasEvidence)notes.push(stored?'交通记录已过期或行程已改变，需要重新查询。':'还未完成交通查询，不能判断完整行程可行。');
    if(hasEvidence&&missingLegs)notes.push(`${missingLegs} 段交通未查到，未将未知耗时当作零。`);
    if(missingHotel)notes.push('未提供酒店起终点，住宿往返接驳尚未计入。');
    if(unknownStops)notes.push(`${unknownStops} 个景点 / 自选地点缺少停留时长，合计仅含已知部分。`);
    if(restaurants.length)notes.push('每处餐厅按 60 分钟编辑预留，替代对应基础餐段；不是营业或上餐时间承诺。');
    if(day.stops.some(id=>root.RoamAttractions.get(id).kind.some(k=>['highland','hike','dedicated'].includes(k))))notes.push('园内接驳、索道、排队和徒步条件未完成核实，仍需按官方安排预留。');
    notes.push('游览、用餐、休息与 30 分钟机动为编排估算；交通为高德当前查询，均非出行保证。');
    return{status,label:labels[status],hasEvidence,complete,knownLegs:valid.length,totalLegs:expected.length,missingLegs,roadMinutes,
      visitMin,visitMax,mealMinutes,restMinutes,bufferMinutes,minimumMinutes,maximumMinutes,usableMinutes,unknownStops,missingHotel,notes,
      internalTransportUnknown,checkedAt:hasEvidence?stored.queriedAt:null};
  }
  function clear(plan){for(const day of plan.days)if(day.traffic&&!fresh(day,plan.settings))delete day.traffic;return plan;}
  function suggestions(plan,day){
    if(!['over','tight'].includes(assess(plan,day).status))return[];
    const s=plan.settings,options=[];
    for(const id of [...day.stops].reverse().filter(id=>!s.mustVisit.includes(id))){
      const spot=root.RoamAttractions.get(id);
      for(const target of plan.days){
        if(target.dayNumber===day.dayNumber||target.type==='transfer'||target.area!==spot.area)continue;
        if(target.stops.some(other=>root.RoamAttractions.get(other).cluster!==spot.cluster))continue;
        const proposal=applySuggestion(plan,{kind:'move',id,from:day.dayNumber,to:target.dayNumber});
        if(proposal&&root.RoamRules.recheck(proposal).valid){options.push({kind:'move',id,from:day.dayNumber,to:target.dayNumber,label:`将${spot.name}移至 Day ${String(target.dayNumber).padStart(2,'0')}`});break;}
      }
      options.push({kind:'defer',id,from:day.dayNumber,label:`将${spot.name}留到下次`});
      if(options.length>=3)break;
    }
    return options.slice(0,3);
  }
  function applySuggestion(plan,option){
    if(!['move','defer'].includes(option?.kind)||plan.settings.mustVisit.includes(option.id))return null;
    const next=JSON.parse(JSON.stringify(plan)),from=next.days.find(d=>d.dayNumber===option.from),spot=root.RoamAttractions.get(option.id);
    if(!from||!spot||!from.stops.includes(option.id))return null;
    if(option.kind==='move'){
      const target=next.days.find(d=>d.dayNumber===option.to);
      if(!target||target===from||target.type==='transfer'||target.area!==spot.area||target.stops.some(id=>root.RoamAttractions.get(id).cluster!==spot.cluster))return null;
      if(!target.stops.length){const template=root.RoamTravelTemplates.areas[spot.area].days.find(t=>t.clusters.includes(spot.cluster));if(!template)return null;Object.assign(target,template,{dayNumber:option.to,area:spot.area,type:'sightseeing',stops:[],mealMinutes:60,restMinutes:root.RoamTravelTemplates.buffer.rest[next.settings.pace]});}
      target.stops.push(option.id);delete target.traffic;
    }
    from.stops=from.stops.filter(id=>id!==option.id);delete from.traffic;
    if(option.kind==='defer')next.unassigned=[...new Set([...next.unassigned,option.id])];
    return next;
  }
  root.RoamTraffic=Object.freeze({TTL,legKey,entries,fingerprint,fresh,evidence,assess,clear,suggestions,applySuggestion});
})(typeof window!=='undefined'?window:globalThis);
