/* Strictly validated AI edits for an existing itinerary. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const text=(value,max)=>typeof value==='string'&&value.trim()?value.trim().slice(0,max):'';
  function apply(current,output){
    if(!current||!output||typeof output!=='object'||Array.isArray(output)||!Array.isArray(output.actions))throw Error('ADJUST_SCHEMA_INVALID');
    const reply=text(output.reply,800),summary=text(output.summary,160);
    if(!reply||!summary||output.actions.length>3)throw Error('ADJUST_SCHEMA_INVALID');
    const plan=clone(current),touched=new Set();
    function locate(id){for(let i=0;i<plan.days.length;i++){const index=plan.days[i].stops.indexOf(id);if(index>=0)return{day:i,index};}return null;}
    for(const raw of output.actions){
      if(!raw||typeof raw!=='object'||typeof raw.type!=='string')throw Error('ADJUST_ACTION_INVALID');
      if(raw.type==='swap_days'){
        const a=Number(raw.dayA)-1,b=Number(raw.dayB)-1;
        if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=plan.days.length||b>=plan.days.length||a===b)throw Error('ADJUST_ACTION_INVALID');
        const left={...plan.days[a],dayNumber:b+1},right={...plan.days[b],dayNumber:a+1};
        plan.days[a]=right;plan.days[b]=left;touched.add(a);touched.add(b);continue;
      }
      const stopId=text(raw.stopId,100),spot=root.RoamAttractions.get(stopId),from=locate(stopId);
      if(!spot||!from)throw Error('ADJUST_STOP_INVALID');
      if(raw.type==='defer_stop'){
        if(plan.settings.mustVisit.includes(stopId))throw Error('ADJUST_MUST_VISIT');
        plan.days[from.day].stops.splice(from.index,1);plan.unassigned=[...new Set([...plan.unassigned,stopId])];touched.add(from.day);continue;
      }
      if(raw.type==='move_stop'){
        const to=Number(raw.toDay)-1,target=plan.days[to];
        if(!Number.isInteger(to)||!target||target.type==='transfer'||target.area!==spot.area)throw Error('ADJUST_TARGET_INVALID');
        plan.days[from.day].stops.splice(from.index,1);const position=Math.max(0,Math.min(target.stops.length,Math.floor(Number(raw.position)||0)));target.stops.splice(position,0,stopId);
        plan.unassigned=plan.unassigned.filter(id=>id!==stopId);touched.add(from.day);touched.add(to);continue;
      }
      if(raw.type==='reorder_stop'){
        const day=plan.days[from.day];day.stops.splice(from.index,1);const position=Math.max(0,Math.min(day.stops.length,Math.floor(Number(raw.position)||0)));day.stops.splice(position,0,stopId);touched.add(from.day);continue;
      }
      throw Error('ADJUST_ACTION_INVALID');
    }
    for(const index of touched){delete plan.days[index].traffic;plan.days[index].timings={};}
    plan.activeDay=Math.max(0,Math.min(plan.days.length-1,plan.activeDay||0));plan.savedAt=null;
    if(plan.ai)plan.ai.edited=true;
    const checked=root.RoamRules.validatePlan(plan);
    if(!checked||!checked.validation.valid)throw Error('ADJUST_CONFLICT');
    return{reply,summary,actions:clone(output.actions),plan:checked};
  }
  const explain=error=>({ADJUST_SCHEMA_INVALID:'建议格式不完整。',ADJUST_ACTION_INVALID:'建议包含不支持的操作。',ADJUST_STOP_INVALID:'建议引用了当前行程之外的地点。',ADJUST_MUST_VISIT:'必去地点不能自动移出行程。',ADJUST_TARGET_INVALID:'目标日期与地点不匹配。',ADJUST_CONFLICT:'调整后会产生片区或时间冲突。'})[error?.message]||'这条建议暂时不能安全应用。';
  root.RoamAIAdjust=Object.freeze({apply,explain});
})(typeof window!=='undefined'?window:globalThis);
