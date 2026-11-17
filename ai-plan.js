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
    const text=value.trim();return text.length<=max?text:text.slice(0,max-1)+'…';
  }
  function apply(base,output,metadata={}){
    if(!exact(output,['title','summary','days'])||!Array.isArray(output.days)||output.days.length!==base.settings.days)throw Error('AI_SCHEMA_INVALID');
    const title=prose(output.title,70),summary=prose(output.summary,700),R=root.RoamRules,A=root.RoamAttractions,T=root.RoamTravelTemplates;
    const plan=JSON.parse(JSON.stringify(base)),seen=new Set(),notes=[];
    for(let i=0;i<plan.days.length;i++){
      const proposed=output.days[i],original=plan.days[i];
      if(!exact(proposed,['dayNumber','theme','reason','stops'])||Number(proposed.dayNumber)!==i+1||!Array.isArray(proposed.stops)||proposed.stops.length>4||proposed.stops.some(id=>typeof id!=='string'))throw Error('AI_DAY_INVALID');
      const theme=prose(proposed.theme,60),reason=prose(proposed.reason,500);
      if(original.type==='transfer'&&proposed.stops.length)throw Error('AI_TRANSFER_CONFLICT');
      for(const id of proposed.stops){
        const spot=A.get(id);if(!spot||spot.area!==original.area||!plan.settings.areas.includes(spot.area)||seen.has(id))throw Error('AI_PLACE_INVALID');seen.add(id);
      }
      const spots=proposed.stops.map(id=>A.get(id));
      if(spots.length){
        const clusters=[...new Set(spots.map(s=>s.cluster))];if(clusters.length!==1)throw Error('AI_CLUSTER_CONFLICT');
        const template=T.areas[original.area].days.find(day=>day.clusters.includes(clusters[0]));if(!template)throw Error('AI_TEMPLATE_INVALID');
        Object.assign(original,{...template,area:original.area,dayNumber:i+1,type:'sightseeing',stops:[...proposed.stops],theme,ids:[...template.ids],periods:[...(template.periods||['上午','下午'])],mealMinutes:60,restMinutes:T.buffer.rest[plan.settings.pace],transferReserveMinutes:45,mobilityNote:template.mobility});
      }else{original.stops=[];if(original.type!=='transfer'){original.type='buffer';original.theme=theme;original.zone='留白与机动';original.why='AI 建议保留机动空间，未额外补入景点。';}}
      notes.push({dayNumber:i+1,theme,reason});
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
  root.RoamAIPlan=Object.freeze({apply,explain});
})(typeof window!=='undefined'?window:globalThis);
