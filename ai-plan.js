/* Shared, deterministic verification of AI proposals. The provider never supplies places or coordinates. */
(function(root){
  'use strict';
  const exact=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every(k=>keys.includes(k));
  function prose(value,max){
    if(typeof value!=='string'||!value.trim()||value.length>20000)throw Error('AI_TEXT_INVALID');
    // Reject precise travel/price/opening claims: no live route or commercial data was supplied.
    for(const sentence of value.split(/[。；;！!\n]/)){
      const precise=/\d\s*[:：]\s*\d|\d+(?:\.\d+)?\s*(?:公里|千米|分钟|小时|元|km\b|minutes?\b)|无需预约|免预约/i.test(sentence);
      const absolute=/(?:^|[^不未无])保证|实时路况/.test(sentence)&&!/(?:不|无法|不能|不作|不做|未|没有|并非).{0,15}(?:保证|实时路况)|实时路况.{0,12}(?:未知|未核实|待确认|自行核实)/.test(sentence);
      if(precise||absolute)throw Error('AI_UNVERIFIED_FACT');
    }
    const text=value.trim().replace(/baseline/gi,'初始安排').replace(/cluster/gi,'片区').replace(/budget/gi,'可用时间').replace(/pace/gi,'旅行节奏');return text.length<=max?text:text.slice(0,max-1)+'…';
  }
  function apply(base,output,metadata={}){
    if(!exact(output,['title','summary','days'])||!Array.isArray(output.days)||output.days.length!==base.settings.days)throw Error('AI_SCHEMA_INVALID');
    const title=prose(output.title,70),summary=prose(output.summary,700),R=root.RoamRules,A=root.RoamAttractions,T=root.RoamTravelTemplates;
    const plan=JSON.parse(JSON.stringify(base)),seen=new Set(),notes=[];
    for(let i=0;i<plan.days.length;i++){
      const proposed=output.days[i],original=plan.days[i];
      if(!exact(proposed,['dayNumber','theme','reason','stops','tips','alternative','stopNotes','order'])||Number(proposed.dayNumber)!==i+1||!Array.isArray(proposed.stops)||proposed.stops.length>4||proposed.stops.some(id=>typeof id!=='string'))throw Error('AI_DAY_INVALID');
      const theme=prose(proposed.theme,60),reason=prose(proposed.reason,500);
      if(original.type==='transfer'&&proposed.stops.length)throw Error('AI_TRANSFER_CONFLICT');
      for(const id of proposed.stops){
        const spot=A.get(id);if(!spot||spot.area!==original.area||!plan.settings.areas.includes(spot.area)||seen.has(id))throw Error('AI_PLACE_INVALID');seen.add(id);
      }
      if(original.area==='erhai'&&base.settings.days===4){
        if(base.settings.selected.length&&proposed.stops.some(id=>!base.settings.selected.includes(id)))throw Error('AI_PLACE_INVALID');
        for(const chain of [['dali-old-city','dali-longkan','dali-caicun','dali-panxi','dali-xizhou'],['dali-ideal','dali-wenbi','dali-xiaoputuo','dali-wase','dali-shuanglang']]){const positions=proposed.stops.filter(id=>chain.includes(id)).map(id=>chain.indexOf(id));if(positions.length>=3){const signs=positions.slice(1).map((x,i)=>Math.sign(x-positions[i]));if(signs.some(x=>x!==signs[0])){original.routeReview='同侧路线存在折返，建议结合住宿与道路查询调整顺序。';}}}
      }
      const spots=proposed.stops.map(id=>A.get(id));
      if(spots.length){
        const clusters=[...new Set(spots.map(s=>s.cluster))];
        const template=T.areas[original.area].days.find(day=>clusters.every(c=>day.clusters.includes(c))&&(clusters.length===1||(base.settings.days===4&&original.area==='erhai'&&day.id.startsWith('dali4-'))));
        if(!template)throw Error(clusters.length>1?'AI_CLUSTER_CONFLICT':'AI_TEMPLATE_INVALID');
        Object.assign(original,{...template,area:original.area,dayNumber:i+1,type:'sightseeing',stops:[...proposed.stops],theme,ids:[...template.ids],periods:[...(template.periods||['上午','下午'])],mealMinutes:60,restMinutes:T.buffer.rest[plan.settings.pace],transferReserveMinutes:45,mobilityNote:template.mobility});
      }else{original.stops=[];if(original.type!=='transfer'){original.type='buffer';original.theme=theme;original.zone='留白与机动';original.why='AI 建议保留机动空间，未额外补入景点。';}}
      const personals=plan.settings.personalPlaces.filter(p=>p.kind!=='hotel'&&p.fromDay<=i+1&&p.toDay>=i+1);
      if(proposed.order!==undefined){const expected=[...proposed.stops,...personals.map(p=>p.id)];if(!Array.isArray(proposed.order)||proposed.order.length!==expected.length||new Set(proposed.order).size!==expected.length||proposed.order.some(id=>!expected.includes(id)))throw Error('AI_ORDER_INVALID');original.entryOrder=proposed.order.map(id=>{const p=personals.find(p=>p.id===id);return p?p.id+':'+p.slot:id;});}
      if(personals.some(p=>/沙溪|玉津桥|欧阳大院|兴教寺/.test(p.name))&&proposed.stops.length)original.routeReview='含沙溪远程地点及洱海景点，请分日调整并核实往返交通。';
      if(personals.length&&original.type==='buffer'){original.type='sightseeing';original.theme=theme;original.why=reason;original.zone='自选地点 · 已确认日期';}
      const tips=(Array.isArray(proposed.tips)?proposed.tips:[]).slice(0,3).map(t=>prose(t,200));
      const alternative=typeof proposed.alternative==='string'&&proposed.alternative.trim()?prose(proposed.alternative,240):'';
      const stopNotes=(Array.isArray(proposed.stopNotes)?proposed.stopNotes:[]).filter(n=>n&&proposed.stops.includes(n.id)).slice(0,4).map(n=>({id:n.id,period:['上午','下午','傍晚','晚上','弹性'].includes(n.period)?n.period:'弹性',note:prose(n.note,220)}));
      notes.push({dayNumber:i+1,theme,reason,tips,alternative,stopNotes});
    }
    // An already feasible mandatory stop cannot disappear from the AI itinerary.
      const baselineIds=new Set(base.days.flatMap(day=>day.stops));
    if(baselineIds.size&&!seen.size)throw Error('AI_EMPTY_ROUTE');
    if(plan.settings.mustVisit.some(id=>baselineIds.has(id)&&!seen.has(id)))throw Error('AI_MUST_VISIT_MISSING');
    plan.unassigned=plan.settings.selected.filter(id=>!seen.has(id));
    plan.ai={provider:'deepseek',model:String(metadata.model||''),generatedAt:String(metadata.generatedAt||new Date().toISOString()),title,summary,dayNotes:notes,edited:false};
    plan.savedAt=null;plan.activeDay=0;
    const verified=R.validatePlan(plan);if(!verified||!verified.validation.valid){const error=Error('AI_FEASIBILITY_CONFLICT');error.issues=verified?.validation.violations||[];throw error;}
    return verified;
  }
  function explain(error){return ({AI_SCHEMA_INVALID:'返回格式不完整，需按要求返回全部日期。',AI_DAY_INVALID:'日期编号或景点列表格式不正确。',AI_UNVERIFIED_FACT:'说明包含未经核实的精确时间、价格或承诺。',AI_TEXT_INVALID:'安排说明为空或格式异常。',AI_TRANSFER_CONFLICT:'转场日被塞入景点。',AI_PLACE_INVALID:'包含未知、跨地区或重复景点。',AI_CLUSTER_CONFLICT:'同一天混合了未核实交通的多个片区。',AI_TEMPLATE_INVALID:'景点缺少可用片区资料。',AI_EMPTY_ROUTE:'没有安排任何景点。',AI_MUST_VISIT_MISSING:'遗漏了可安排的必去景点。',AI_FEASIBILITY_CONFLICT:'行程与时长、徒步或日期限制冲突。',AI_OUTPUT_INCOMPLETE:'模型返回不完整。'})[error?.message]||'返回内容不能解析为所需的行程 JSON。';}
  function explainResult(error){if(error?.message==='AI_DIRECTION_BACKTRACK')return'同侧路线出现无理由折返，请沿一个方向重排。';if(error?.message==='AI_ORDER_INVALID')return'当天排序遗漏或重复了已确认地点。';if(error?.message==='AI_SHAXI_CONFLICT')return'沙溪应独立留日，不与洱海景点混排。';if(error?.message==='AI_OUTPUT_TRUNCATED')return'模型输出达到长度上限，行程未完整返回。';if(error?.message==='AI_OUTPUT_EMPTY')return'模型没有返回行程正文。';return explain(error);}
  function explainProtocol(error){if(error?.message==='AI_JSON_SYNTAX')return'模型返回的JSON存在语法错误。';if(error?.message==='AI_JSON_REPAIR_CHANGED')return'格式修复改变了地点或日期，本次结果未采用。';return explainResult(error);}
  root.RoamAIPlan=Object.freeze({apply,explain:explainProtocol});
})(typeof window!=='undefined'?window:globalThis);
