(function(root){
  'use strict';
  // Preserve the existing 4173 static preview; the bundled server also serves the whole site at 4174.
  const base=['127.0.0.1','localhost'].includes(location.hostname)&&location.port==='4173'?'http://127.0.0.1:4174':'';
  async function status(){try{const response=await fetch(base+'/api/ai/status',{cache:'no-store'});if(!response.ok)throw Error();return await response.json();}catch{return{configured:false,unavailable:true};}}
  async function generate(settings,signal){
    let response;try{response=await fetch(base+'/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings}),signal});}catch(error){if(error.name==='AbortError')throw error;throw Error('AI 规划服务暂时无法连接，请检查本地服务后重试。已有行程会保留。');}
    let body;try{body=await response.json();}catch{throw Error('AI 服务响应异常，已有行程会保留。');}
    if(!response.ok)throw Error(typeof body.error==='string'?body.error:'AI 规划暂未完成，请稍后重试。');
    const plan=root.RoamRules.validatePlan(body.plan);
    if(!plan?.ai||plan.ai.provider!=='deepseek'||!plan.validation.valid)throw Error('AI 结果未通过本地校验，本次未采用。');
    // Check again in the browser; only catalogue IDs, valid grouping and fixed POIs may survive.
    const checked=root.RoamAIPlan.apply(root.RoamRules.generate(settings),{title:plan.ai.title,summary:plan.ai.summary,days:plan.days.map((day,i)=>({dayNumber:i+1,theme:plan.ai.dayNotes?.[i]?.theme,reason:plan.ai.dayNotes?.[i]?.reason,stops:day.stops}))},{model:plan.ai.model,generatedAt:plan.ai.generatedAt});
    // The server already validates all optional guide fields; retain them in the local result.
    checked.ai.dayNotes=plan.ai.dayNotes;
    checked.ai.programAdjustments=plan.ai.programAdjustments||[];
    checked.ai.directionChanges=plan.ai.directionChanges||[];
    for(let i=0;i<checked.days.length;i++)if(Array.isArray(plan.days[i].entryOrder))checked.days[i].entryOrder=[...plan.days[i].entryOrder];
    checked.ai.correctionAttempts=Number(plan.ai.correctionAttempts)||0;return checked;
  }
  async function adjust(plan,message,signal){
    let response;try{response=await fetch(base+'/api/ai/adjust',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,message}),signal});}catch(error){if(error.name==='AbortError')throw error;throw Error('行程助手暂时无法连接，当前路线没有改变。');}
    let body;try{body=await response.json();}catch{throw Error('行程助手响应异常，当前路线没有改变。');}
    if(!response.ok)throw Error(typeof body.error==='string'?body.error:'暂时无法生成安全的调整建议。');
    const checked=root.RoamAIAdjust.apply(plan,{reply:body.reply,summary:body.summary,actions:body.actions});
    if(JSON.stringify(checked.plan.days.map(d=>d.stops))!==JSON.stringify(body.plan?.days?.map(d=>d.stops)))throw Error('调整建议未通过本地复核。');
    return checked;
  }
  root.RoamAIService=Object.freeze({status,generate,adjust});
})(window);
