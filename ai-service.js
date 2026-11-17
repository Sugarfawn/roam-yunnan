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
    checked.ai.correctionAttempts=Number(plan.ai.correctionAttempts)||0;return checked;
  }
  root.RoamAIService=Object.freeze({status,generate});
})(window);
