(function(root){
  'use strict';
  const areaIds=()=>Object.keys(T().areas);
  const preferenceNames={nature:'自然风光',culture:'古镇人文',photo:'摄影',food:'美食'};
  const A=()=>root.RoamAttractions,T=()=>root.RoamTravelTemplates,uniq=x=>[...new Set(Array.isArray(x)?x:[])];
  const validClock=x=>typeof x==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x)?x:'';
  function normalize(input={}){
    const validAreas=areaIds(),area=validAreas.includes(input.area)?input.area:'erhai';
    const requested=uniq([area,...(Array.isArray(input.areas)?input.areas:[])].filter(id=>validAreas.includes(id)));
    const areas=requested,allowed=new Set(areas.flatMap(id=>(A().byRegion[id]||[]).map(s=>s.id)));
    const selected=uniq(input.selected).filter(id=>allowed.has(id));
    const originOptions=T().areas[area].origins;
    const startLocation=originOptions.some(([id])=>id===input.startLocation)?input.startLocation:T().defaultStart[area];
    const legModes=Object.fromEntries(Object.entries(input.legModes&&typeof input.legModes==='object'&&!Array.isArray(input.legModes)?input.legModes:{}).slice(0,100).filter(([key,mode])=>key.length<500&&['drive','walk','public'].includes(mode)));
    const sameEndAsStart=input.sameEndAsStart!==false,endLocation=sameEndAsStart?startLocation:originOptions.some(([id])=>id===input.endLocation)?input.endLocation:T().defaultStart[area];
    return {area,areas,legModes,planningMode:input.planningMode==='manual'?'manual':'ai',startDate:root.RoamTripModel?.date(input.startDate)||'',aiProfile:input.aiProfile&&typeof input.aiProfile==='object'?{party:['solo','couple','family','friends'].includes(input.aiProfile.party)?input.aiProfile.party:'',mobility:['easy','regular'].includes(input.aiProfile.mobility)?input.aiProfile.mobility:'',mountain:['view','full','skip'].includes(input.aiProfile.mountain)?input.aiProfile.mountain:'',arrival:['morning','afternoon','evening','unknown'].includes(input.aiProfile.arrival)?input.aiProfile.arrival:'',confirmed:input.aiProfile.confirmed===true}:{},days:Math.max(1,Math.min(4,Math.floor(Number(input.days)||3))),pace:['slow','standard','full'].includes(input.pace)?input.pace:'slow',transport:['public','drive','undecided'].includes(input.transport)?input.transport:'undecided',preferences:uniq(input.preferences).filter(id=>Object.hasOwn(preferenceNames,id)),selected,mustVisit:uniq(input.mustVisit).filter(id=>selected.includes(id)),startLocation,endLocation,sameEndAsStart,arrivalWindow:input.arrivalWindow==='half'?'half':'full',departureWindow:input.departureWindow==='half'?'half':'full',arrivalTime:validClock(input.arrivalTime),departureTime:validClock(input.departureTime),personalPlaces:root.RoamPersonalPlaces?root.RoamPersonalPlaces.normalize(input.personalPlaces):[],poiBindings:root.RoamPersonalPlaces?.normalizeBindings(input.poiBindings)||{},aiRequest:typeof input.aiRequest==='string'?input.aiRequest.trim().slice(0,400):''};
  }
  const templateFor=(s,area,days)=>T().classic.find(x=>x.area===area&&x.days===days&&x.pace===s.pace&&x.transports.includes(s.transport))||null;
  const clustersOf=day=>day.clusters||[day.cluster];
  function makeAreaSlots(settings,area,count){
    const region=T().areas[area],classic=templateFor(settings,area,settings.days);
    const candidateTemplates=region.days.filter(day=>!day.ids.some(id=>A().get(id)?.kind.includes('hike')||A().get(id)?.kind.includes('dedicated'))||settings.selected.some(id=>day.ids.includes(id)));
    const rankedTemplates=[...candidateTemplates].sort((a,b)=>{
      const score=day=>Math.max(0,...day.ids.map(id=>settings.preferences.reduce((n,key)=>n+(A().get(id)?.kind.includes(key)?1:0),0)));
      return score(b)-score(a)||region.days.indexOf(a)-region.days.indexOf(b);
    });
    let definitions=classic&&area===settings.area?classic.sequence.map(id=>region.days.find(day=>day.id===id)).filter(Boolean):rankedTemplates;
    const slots=definitions.slice(0,count).map(source=>({...source,sourceTemplateId:classic?.id||null,area,type:'sightseeing',stops:[],periods:[...(source.periods||[])]}));
    const selected=settings.selected.map(id=>A().get(id)).filter(spot=>spot&&spot.area===area).sort((a,b)=>Number(settings.mustVisit.includes(b.id))-Number(settings.mustVisit.includes(a.id)));
    for(const spot of selected){
      if(!settings.mustVisit.includes(spot.id)&&slots.some(day=>selected.some(required=>settings.mustVisit.includes(required.id)&&clustersOf(day).includes(required.cluster))))continue;
      if(slots.some(day=>clustersOf(day).includes(spot.cluster)))continue;
      const replacement=region.days.find(day=>clustersOf(day).includes(spot.cluster));
      const replaceable=[...slots].reverse().find(day=>!selected.some(required=>settings.mustVisit.includes(required.id)&&clustersOf(day).includes(required.cluster)));
      if(replacement&&replaceable)Object.assign(replaceable,{...replacement,sourceTemplateId:null,area,type:'sightseeing',stops:[],periods:[...(replacement.periods||[])]});
    }
    const startCluster=A().get(settings.startLocation)?.cluster,endCluster=A().get(settings.endLocation)?.cluster;
    if(area===settings.area&&startCluster){const index=slots.findIndex(day=>clustersOf(day).includes(startCluster));if(index>0)slots.unshift(...slots.splice(index,1));}
    if(area===settings.area&&endCluster&&endCluster!==startCluster){const index=slots.findIndex(day=>clustersOf(day).includes(endCluster));if(index>=0&&index<slots.length-1)slots.push(...slots.splice(index,1));}
    const placedIds=new Set();
    for(const day of slots){
      const clusters=clustersOf(day),owner=spot=>slots.find(s=>s.ids?.includes(spot.id))||slots.find(s=>clustersOf(s).includes(spot.cluster));
      const required=selected.filter(spot=>clusters.includes(spot.cluster)&&owner(spot)===day&&!placedIds.has(spot.id)).map(spot=>spot.id);
      const templateIds=uniq(day.ids||[]).filter(id=>{const spot=A().get(id);return spot&&spot.area===area&&clusters.includes(spot.cluster);});
      const catalogue=A().byRegion[area]||[];
      const candidates=catalogue.filter(spot=>clusters.includes(spot.cluster)&&!spot.kind.includes('hike')&&!spot.kind.includes('highland')).sort((a,b)=>settings.preferences.reduce((n,key)=>n+(b.kind.includes(key)?1:0)-(a.kind.includes(key)?1:0),0)||catalogue.indexOf(a)-catalogue.indexOf(b)).map(spot=>spot.id);
      const limit=settings.pace==='slow'?2:settings.pace==='standard'?3:4,ids=uniq([...required,...templateIds,...candidates]).filter(id=>!placedIds.has(id)&&owner(A().get(id))===day);
      day.stops=ids.slice(0,Math.max(limit,required.length));for(const id of required)if(!day.stops.includes(id))day.stops.push(id);
      day.stops.forEach(id=>placedIds.add(id));
      day.overCapacity=day.stops.length>limit;day.dayLimit=limit;day.meal=day.meal||'为用餐与休息留出时间；地点按当天安排。';day.mealMinutes=60;day.restMinutes=T().buffer.rest[settings.pace];day.mobilityNote=day.mobility;day.notes=[];
      day.transferReserveMinutes=day.stops.length>1?45:25;day.transferReserveLabel='片区衔接机动的编辑估算，不是道路或公交车程。';
    }
    return{days:slots,classic};
  }
  function assess(day,settings){
    if(day.type==='transfer')return{status:'transfer',known:false,usableMinutes:null,visitMin:0,visitMax:0,mealMinutes:0,restMinutes:0,transferReserveMinutes:null};
    const spots=day.stops.map(id=>A().get(id)).filter(Boolean),estimates=spots.map(s=>s.estimate).filter(Boolean),unknown=spots.length-estimates.length;
    const visitMin=estimates.reduce((n,e)=>n+e.min,0),visitMax=estimates.reduce((n,e)=>n+e.max,0);let usable=T().paceBudget[settings.pace];
    if(day.dayNumber===1&&settings.arrivalWindow==='half')usable=Math.min(usable,240);
    if(day.dayNumber===settings.days&&settings.departureWindow==='half')usable=Math.min(usable,240);
    if(settings.days===1&&settings.arrivalWindow==='half'&&settings.departureWindow==='half')usable=210;
    const toMinutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
    const start=Math.max(day.startTime&&validClock(day.startTime)?toMinutes(day.startTime):540,day.dayNumber===1&&settings.arrivalTime?toMinutes(settings.arrivalTime):540),end=day.dayNumber===settings.days&&settings.departureTime?Math.min(1080,toMinutes(settings.departureTime)):1080;
    usable=Math.min(usable,Math.max(0,end-start));
    const meal=spots.length?(spots.length===1?30:day.mealMinutes||60):0,rest=spots.length?(spots.length===1?15:day.restMinutes||T().buffer.rest[settings.pace]):0,transfer=spots.length?(spots.length===1?25:day.transferReserveMinutes||45):0,min=visitMin+meal+rest+transfer,max=visitMax+meal+rest+transfer;
    const status=!spots.length?'empty':spots.length>(settings.pace==='slow'?2:settings.pace==='standard'?3:4)||min>usable?'over':unknown?'unknown':max>usable?'tight':'within';
    return{status,known:unknown===0,unknownCount:unknown,visitMin,visitMax,mealMinutes:meal,restMinutes:rest,transferReserveMinutes:transfer,transferReserveLabel:day.transferReserveLabel,minimumMinutes:min,maximumMinutes:max,usableMinutes:usable,windowStart:start,windowEnd:end,realTrafficMinutes:null,totalDurationMinutes:null,confidence:'reference-only'};
  }
  function transferDay(dayNumber,from,to){return{type:'transfer',dayNumber,area:from,zone:T().areas[from].label+' → '+T().areas[to].label,theme:'跨地区转场 · 单独预留',ids:[],stops:[],periods:['当天以城际移动为主'],meal:'根据实际班次和抵达时间安排用餐、入住与休息。',why:'不同地区之间独立预留转场日，不与普通市内观光日混排。',mobilityNote:'车次、航班、票务与转场时长均未核实，先确认往返交通。',transferBasis:'转场时长未知；本日仅作占位，不估算小时或里程。',assessment:'transfer',fromArea:from,toArea:to};}
  function generate(input){
    const settings=normalize(input),requested=settings.areas,returnRequired=requested.length>1&&A().get(settings.endLocation)?.area!==requested.at(-1),transferCount=Math.max(0,requested.length-1)+(returnRequired?1:0),canCover=requested.length===1||settings.days>=requested.length+transferCount;
    const visitAreas=canCover?requested:[settings.area],unassignedRegions=canCover?[]:requested.filter(id=>id!==settings.area);
    const sightseeingCount=Math.max(1,settings.days-(canCover?transferCount:0)),allocation=Object.fromEntries(visitAreas.map(id=>[id,1]));let extra=sightseeingCount-visitAreas.length;
    while(extra-->0){const chosen=[...visitAreas].sort((a,b)=>settings.selected.filter(id=>A().get(id)?.area===b).length-settings.selected.filter(id=>A().get(id)?.area===a).length||requested.indexOf(a)-requested.indexOf(b))[0];allocation[chosen]++;}
    const days=[],templates=[];let dayNumber=1,unassigned=[];
    for(let i=0;i<visitAreas.length;i++){
      const area=visitAreas[i],built=makeAreaSlots(settings,area,allocation[area]);
      for(const day of built.days){day.dayNumber=dayNumber++;day.startContext=day.dayNumber===1?{locationId:settings.startLocation,half:settings.arrivalWindow==='half',time:settings.arrivalTime}:null;day.endContext=day.dayNumber===settings.days?{locationId:settings.endLocation,half:settings.departureWindow==='half',time:settings.departureTime}:null;day.assessment=assess(day,settings);days.push(day);}
      if(built.classic)templates.push({area,id:built.classic.id,reason:built.classic.reason,source:built.classic.source});
      if(i<visitAreas.length-1)days.push(transferDay(dayNumber++,area,visitAreas[i+1]));
      const idsForArea=settings.selected.filter(id=>A().get(id)?.area===area),assigned=new Set(built.days.flatMap(day=>day.stops));unassigned.push(...idsForArea.filter(id=>!assigned.has(id)));
    }
    if(canCover&&returnRequired)days.push(transferDay(dayNumber++,visitAreas.at(-1),settings.area));
    unassigned.push(...settings.selected.filter(id=>unassignedRegions.includes(A().get(id)?.area)));
    while(days.length<settings.days)days.push({type:'buffer',dayNumber:days.length+1,area:settings.area,zone:'留白与机动',theme:'机动时间 · 给旅途留白',stops:[],periods:['休息 / 弹性'],why:'没有可靠资料支持自动补入更多景点，因此保留休息或天气机动日。',mobilityNote:'可返回攻略清单添加地点；跨区接驳仍需自行核实。',assessment:'empty'});
    days.slice(0,settings.days).forEach((day,index)=>{
      day.dayNumber=index+1;
      if(day.dayNumber===1)day.startContext={locationId:settings.startLocation,half:settings.arrivalWindow==='half',time:settings.arrivalTime};
      if(day.dayNumber===settings.days)day.endContext={locationId:settings.endLocation,half:settings.departureWindow==='half',time:settings.departureTime};
      if(day.type==='sightseeing'){
        day.assessment=assess(day,settings);
        if(day.stops.some(id=>A().get(id)?.kind.includes('dedicated'))&&day.assessment.usableMinutes<420){
          unassigned.push(...day.stops.filter(id=>settings.selected.includes(id)));day.stops=[];day.buffer='半日或较晚抵达不适合此独立完整日项目，已保留为待安排。';day.assessment=assess(day,settings);
        }
        while(day.stops.length&&['over','tight'].includes(day.assessment.status)){
          let removeIndex=-1;
          for(let i=day.stops.length-1;i>=0;i--)if(!settings.mustVisit.includes(day.stops[i])){removeIndex=i;break;}
          if(day.stops.length===1&&day.assessment.status==='tight')break;
          if(removeIndex<0){
            if(day.assessment.status==='tight')break;
            removeIndex=day.stops.length-1;
          }
          const removed=day.stops.splice(removeIndex,1)[0];
          if(settings.selected.includes(removed))unassigned.push(removed);
          day.assessment=assess(day,settings);
        }
        day.accommodation={label:A().get(settings.startLocation)?.zone||'住宿片区未提供',basis:'沿用用户的抵达片区作为住宿基点，不是酒店推荐；与当日片区不同时接驳待核实。'};
      }
    });
    if(settings.area==='erhai'&&settings.days===4&&settings.selected.length)for(const day of days)day.stops=day.stops.filter(id=>settings.selected.includes(id));
    if(settings.area==='erhai'&&settings.days===4)for(const day of days){for(const chain of [['dali-old-city','dali-longkan','dali-caicun','dali-panxi','dali-xizhou'],['dali-ideal','dali-wenbi','dali-xiaoputuo','dali-wase','dali-shuanglang']]){const indexes=day.stops.map((id,i)=>chain.includes(id)?i:-1).filter(i=>i>=0),ordered=indexes.map(i=>day.stops[i]).sort((a,b)=>chain.indexOf(a)-chain.indexOf(b));indexes.forEach((position,i)=>day.stops[position]=ordered[i]);}}
    const assigned=new Set(days.flatMap(day=>day.stops));unassigned.push(...settings.selected.filter(id=>!assigned.has(id)));
    const plan={version:2,settings,days:days.slice(0,settings.days),unassigned:[...new Set(unassigned)],unassignedRegions,savedAt:null,activeDay:0,templates,createdAt:null};plan.validation=recheck(plan);plan.warnings=warnings(plan);return plan;
  }
  function recheck(plan){
    // User edits remain editable across neighbourhoods; they require renewed road verification.
    if(plan.userEdited){const result=recheck({...plan,userEdited:false,planningMode:'manual'});for(const day of plan.days)if(day.userEdited)result.warnings.push('Day '+day.dayNumber+' 已按你的操作调整，交通与时间需要重新核验。');return result;}
    const violations=[],warnings=[];if(!plan||!plan.settings||!Array.isArray(plan.days))return{valid:false,violations:['计划数据无效。'],warnings:[]};
    const seen=new Set(),settings=normalize(plan.settings);
    for(const day of plan.days){
      if(!day||!Array.isArray(day.stops)){violations.push('行程日数据格式错误。');continue;}
      const spots=day.stops.map(id=>A().get(id));for(const id of day.stops){const spot=A().get(id);if(!spot||!settings.areas.includes(spot.area)){violations.push('景点不属于已选择地区，已阻止保存。');continue;}if(seen.has(id))violations.push('景点重复出现：'+spot.name);seen.add(id);}
      const valid=spots.filter(Boolean);if(day.type==='sightseeing'){const clusters=new Set(valid.map(s=>s.cluster));if(clusters.size>1&&plan.planningMode!=='manual')violations.push(`Day ${String(day.dayNumber).padStart(2,'0')} 跨多个未核实片区，不能假设道路可达。`);if(plan.planningMode!=='manual'&&valid.length>(settings.pace==='slow'?2:settings.pace==='standard'?3:4))violations.push(`Day ${String(day.dayNumber).padStart(2,'0')} 超过节奏景点数量上限。`);if(plan.planningMode!=='manual'&&valid.some(s=>s.kind.includes('hike'))&&valid.length>1)violations.push('徒步项目应单独占用一天。');day.assessment=assess(day,settings);const roadChecked=root.RoamTraffic?.fresh(day,settings);if(!roadChecked&&['over','tight'].includes(day.assessment.status))warnings.push(`Day ${String(day.dayNumber).padStart(2,'0')} 估算时长超过或接近预算，行程可能过满。`);if(plan.planningMode!=='manual'&&!roadChecked&&day.assessment.status==='over')violations.push(`Day ${String(day.dayNumber).padStart(2,'0')} 超出可用时长窗口，请删减后保存。`);if(day.assessment.status==='unknown')warnings.push(`Day ${String(day.dayNumber).padStart(2,'0')} 有景点没有时长数据，无法判断能否按时完成。`);const reference=(day.ids||[]).filter(id=>day.stops.includes(id));const actual=day.stops.filter(id=>reference.includes(id));if(actual.some((id,i)=>id!==reference[i]))warnings.push(`Day ${String(day.dayNumber).padStart(2,'0')} 顺序偏离人工模板，可能增加折返，请核实后执行。`);
        for(const spot of valid){if(spot.openingHours?.verified&&spot.openingHours.open&&spot.openingHours.close){const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3)),open=minutes(spot.openingHours.open),close=minutes(spot.openingHours.close);if(close<=day.assessment.windowStart||open>=day.assessment.windowEnd||(spot.estimate&&Math.min(close,day.assessment.windowEnd)-Math.max(open,day.assessment.windowStart)<spot.estimate.min))violations.push(`${spot.name} 的已核实开放时段与当天可用窗口冲突。`);}else if(!warnings.includes('开放时段和预约信息未完成当前核实，请按官方当日信息执行。'))warnings.push('开放时段和预约信息未完成当前核实，请按官方当日信息执行。');if(spot.preferredPeriods?.some(period=>period.includes('清晨'))&&day.dayNumber===1&&(settings.arrivalWindow==='half'||(settings.arrivalTime&&settings.arrivalTime>='12:00')))warnings.push(`${spot.name} 以清晨观景为主题，抵达当日下午不能实现这一观赏目标；建议前一晚入住或换到次日。`);if(spot.reservation?.required===true&&spot.reservation?.verified===true)warnings.push(`${spot.name} 已核实需要预约；本系统没有核对你是否已获得名额，请先完成预约。`);if(spot.kind.includes('dedicated')&&(day.assessment.usableMinutes<420||valid.some(s=>s.cluster!==spot.cluster)))violations.push(`${spot.name} 需要独立完整游玩日，不应放入半日或跨区组合。`);}
      }
    }
    if(root.RoamTraffic){root.RoamTraffic.clear(plan);for(const day of plan.days){const traffic=root.RoamTraffic.assess(plan,day);if(traffic.status==='over')violations.push(`Day ${String(day.dayNumber).padStart(2,'0')} 已知游览、交通与休息的最低用时超过当天预算，请删减或改期。`);else if(traffic.status==='tight')warnings.push(`Day ${String(day.dayNumber).padStart(2,'0')} 纳入已查交通后时间偏紧。`);}}
    if(settings.mustVisit.some(id=>!settings.selected.includes(id)))violations.push('必去景点必须同时处于已选景点清单。');
    if(settings.mustVisit.some(id=>!seen.has(id)))warnings.push('仍有必去景点未排入，请检查待安排清单。');
    if(root.RoamTripModel){const timed=root.RoamTripModel.checks(plan);warnings.push(...timed.warnings);violations.push(...timed.violations);}
    if(root.RoamPersonalPlaces){const personal=root.RoamPersonalPlaces.check(plan);warnings.push(...personal.warnings);violations.push(...personal.violations);}
    const checked=violations.filter(message=>{
      if(settings.area!=='erhai'||settings.days!==4||!message.includes('跨多个未核实片区'))return true;
      const number=Number(message.match(/Day (\d+)/)?.[1]),d=plan.days[number-1];if(!d)return true;
      const clusters=d.stops.map(id=>A().get(id)?.cluster);
      const permitted=T().areas.erhai.days.some(t=>t.id.startsWith('dali4-')&&clusters.every(c=>t.clusters.includes(c)));
      if(permitted)warnings.push('Day '+number+' 按同侧走廊编排，仍需核实道路与接驳。');return!permitted;
    });
    return{valid:checked.length===0,violations:[...new Set(checked)],warnings:[...new Set(warnings)]};
  }
  function warnings(plan){
    const automatic=(plan.ai?.programAdjustments||[]).map(x=>'Day '+x.day+'：'+x.removed.map(id=>A().get(id)?.name||id).join('、')+' 已留在待安排，避免超出所选节奏。');
    const notes=[],s=plan.settings,spots=plan.days.flatMap(d=>d.stops.map(id=>A().get(id)).filter(Boolean));
    if(plan.unassigned.length)notes.push(`有 ${plan.unassigned.length} 个景点选择未排入，可能过满或超出模板覆盖范围；已保留在待安排清单。`);
    if(plan.unassignedRegions.length)notes.push('所选天数不足以覆盖所有地区与转场日；未安排地区已保留，不假装已到达。');
    if(s.areas.length>1)notes.push('跨地区移动有独立转场日；城际班次、道路和时长均未实时核实。');
    notes.push(...(plan.validation?.warnings||[]));
    if(spots.some(x=>x.kind.includes('highland')))notes.push('包含高海拔地点，请核实开放、天气与个人身体状态。');
    if(spots.some(x=>x.kind.includes('hike')))notes.push('包含徒步或山地项目，已独立分日；向导和步道要求须出发前核实。');
    notes.push(s.transport==='public'?'公共交通方案由高德当前查询参与每日核验；未来班次、换乘候车与景区接驳仍需确认。':s.transport==='drive'?'自驾道路耗时由高德当前查询参与每日核验；停车、景区内部接驳和未查路段仍需确认。':'交通方式待定，高德当前建议方案参与每日核验；出行方式与未查路段仍需确认。');
    if(s.arrivalWindow==='half')notes.push('抵达日按半日窗口安排；此假设不代表交通一定可达。');if(s.departureWindow==='half')notes.push('离开日按半日窗口处理，不在预留离开时段后增加景点。');if(s.arrivalTime||s.departureTime)notes.push('已记录用户提供的时刻，但没有将其推算为景点到达时间。');if(plan.days.some(x=>x.type==='buffer'))notes.push('保留机动日，未为了填满天数增加未验证景点。');
    const start=A().get(s.startLocation),end=A().get(s.endLocation),first=plan.days.find(d=>d.type==='sightseeing'&&d.stops.length),last=[...plan.days].reverse().find(d=>d.type==='sightseeing'&&d.stops.length);
    if(start&&first&&start.cluster!==A().get(first.stops[0])?.cluster)notes.push('首日片区与出发参考片区不同，请核实接驳后再执行。');if(end&&last&&end.cluster!==A().get(last.stops.at(-1))?.cluster)notes.push('末日片区与结束参考片区不同，请预留真实交通时间。');
    return[...new Set([...notes,...automatic])];
  }
  function validatePlan(value){
    if(!value||![1,2].includes(value.version)||!value.settings||!Array.isArray(value.days))return null;const settings=normalize(value.settings);if(value.days.length!==settings.days)return null;const seen=new Set();
    for(const day of value.days){if(!day||!Array.isArray(day.stops)||new Set(day.stops).size!==day.stops.length)return null;for(const id of day.stops){const spot=A().get(id);if(!spot||!settings.areas.includes(spot.area)||seen.has(id))return null;seen.add(id);}}
    const days=value.days.map((day,i)=>{
      if(value.version===1){const area=day.stops.length?A().get(day.stops[0]).area:settings.area;const base=T().areas[area].days.find(template=>day.stops.some(id=>template.ids.includes(id)));return{...base,...day,type:'sightseeing',area,dayNumber:i+1,ids:base?.ids||[],mealMinutes:60,restMinutes:T().buffer.rest[settings.pace],transferReserveMinutes:45,transferReserveLabel:'旧计划迁移后使用编辑缓冲，非车程。',stops:[...day.stops],mobilityNote:'旧计划已迁移，建议重新生成以应用最新模板。'};}
      return{...day,dayNumber:i+1,stops:[...day.stops],timings:root.RoamTripModel?.timings(day.timings)||{},note:typeof day.note==='string'?day.note.slice(0,400):''};
    });
    const plan={...value,version:2,settings,days,templates:Array.isArray(value.templates)?value.templates:[],unassigned:[...new Set([...(Array.isArray(value.unassigned)?value.unassigned:[]).filter(id=>A().get(id)&&settings.areas.includes(A().get(id).area)&&!seen.has(id)),...settings.selected.filter(id=>!seen.has(id))])],unassignedRegions:(Array.isArray(value.unassignedRegions)?value.unassignedRegions:[]).filter(id=>settings.areas.includes(id)),activeDay:Math.max(0,Math.min(value.days.length-1,Number.isInteger(value.activeDay)?value.activeDay:0))};plan.validation=recheck(plan);plan.warnings=warnings(plan);if(value.version===1)plan.warnings.push('此为旧版行程，已重新校验；建议重新生成新版参考模板。');return plan;
  }
  root.RoamRules=Object.freeze({normalize,generate,validatePlan,warnings,recheck,assess,preferenceNames});
})(typeof window!=='undefined'?window:globalThis);
