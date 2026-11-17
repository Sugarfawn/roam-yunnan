require('node:fs').mkdirSync(require('node:path').join(__dirname,'artifacts'),{recursive:true});
/* Mock upstream responses exercise the contract; no real DeepSeek key or call is used. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),{createServer,engine}=require(path.join(root,'server.cjs'));
const E=engine(),R=E.RoamRules,A=E.RoamAIPlan;
const input={area:'erhai',days:3,pace:'slow',transport:'drive',selected:['dali-old-city'],mustVisit:['dali-old-city'],aiRequest:'希望多看白族村落，少赶路。'},base=R.generate(input);
const proposal={title:'大理，留白之间',summary:'按古城、村落与湖岸分日，保留慢游空间。交通和开放仍需出发前确认。',days:base.days.map((day,i)=>({dayNumber:i+1,theme:day.theme,reason:'同片区游览，给休息留出余量。',stops:[...day.stops]}))};
const copy=x=>JSON.parse(JSON.stringify(x));
const swapped=copy(proposal);[swapped.days[0].stops,swapped.days[1].stops]=[swapped.days[1].stops,swapped.days[0].stops];
const valid=A.apply(base,swapped,{model:'test-model'});assert.ok(valid.ai);assert.ok(valid.days[0].stops.includes('dali-xizhou'));assert.ok(valid.validation.valid);assert.equal(valid.settings.aiRequest,input.aiRequest);
const disclaimer=copy(proposal);disclaimer.summary='不保证天气，实时路况待核实；本说明不提供精确车程。';assert.ok(A.apply(base,disclaimer),'negative disclaimers are not factual promises');
const verbose=copy(proposal);verbose.summary='按实际开放安排慢游。'.repeat(120);assert.ok(A.apply(base,verbose).ai.summary.length<=700,'long prose is shortened without discarding a valid itinerary');
for(const mutate of [
 p=>p.days[0].stops.push('invented-hotel'),
 p=>p.days[1].stops.push('dali-old-city'),
 p=>p.days[0].stops.push('dali-shuanglang'),
 p=>p.days[0].stops=[],
 p=>p.summary='开车只需15分钟，门票60元。',
 p=>p.days.pop(),
 p=>p.days[0].coordinates=[100,25]
]){const p=copy(proposal);mutate(p);assert.throws(()=>A.apply(base,p));}
const half=R.generate({...input,days:1,arrivalWindow:'half'});const halfBad={...copy(proposal),days:[{...proposal.days[0],stops:['lijiang-yulong-mountain']}]};assert.throws(()=>A.apply(half,halfBad));
const personal={provider:'amap',poiId:'TEST-HOTEL',name:'仅测试酒店',address:'测试',city:'大理',adcode:'532901',coordinates:[100.2,25.7],coordinateSystem:'GCJ-02',kind:'hotel',fromDay:1,toDay:3};
const fixed=R.generate({...input,personalPlaces:[personal]});assert.equal(A.apply(fixed,proposal).settings.personalPlaces[0].name,'仅测试酒店');
(async()=>{
 let mode='no-key',calls=0;
 const server=createServer({configProvider:()=>({apiKey:mode==='no-key'?'':'test-only-not-real',model:'test-model'}),fetchImpl:async(url,opts)=>{
  calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.ok(opts.headers.Authorization);const body=JSON.parse(opts.body);assert.equal(body.response_format.type,'json_object');assert.equal(body.stream,false);assert.match(body.messages[0].content,/json/);
  if(mode==='unauthorized')return{ok:false,status:401};
  if(mode==='repair-once'){const count=JSON.parse(opts.body).messages.length;return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:count===2?'not-json':JSON.stringify(proposal)}}]})};}
  if(mode==='bad-json')return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'not-json'}}]})};
  if(mode==='truncated')return{ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'{}'}}]})};
  const result=mode==='invented'?{...proposal,days:proposal.days.map((d,i)=>i?d:{...d,stops:['fake-place']})}:proposal;
  return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]})};
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 try{
  let response=await fetch(url+'/api/ai/status');assert.equal((await response.json()).configured,false);
  const post=body=>fetch(url+'/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  response=await post({settings:input});assert.equal(response.status,503);assert.equal(calls,0);
  for(const privatePath of ['/.env.local','/.env.example','/server.cjs','/.git/config','/%2e%2e/.env.local'])assert.equal((await fetch(url+privatePath)).status,404);
  assert.equal((await fetch(url+'/explore/yunnan/planner/')).status,200);
  mode='ok';response=await post({settings:input});assert.equal(response.status,200);const result=await response.json();assert.ok(result.plan.ai);assert.equal(result.plan.settings.aiRequest,input.aiRequest);
  response=await post({settings:{...input,days:'bad'}});assert.equal(response.status,422);
  mode='repair-once';const beforeRepair=calls;response=await post({settings:input});assert.equal(response.status,200);assert.equal(calls-beforeRepair,2);assert.equal((await response.json()).plan.ai.correctionAttempts,1);
  for(const failure of ['unauthorized','bad-json','truncated','invented']){mode=failure;response=await post({settings:input});assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/test-only-not-real/);}
  response=await fetch(url+'/api/ai/plan',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:'{}'});assert.equal(response.status,403);
  const report={passed:true,mode:'mock provider contract tests; no live DeepSeek call',checks:['AI can regroup real catalogue stops','mandatory stop retention','unknown and duplicate IDs rejected','cluster and half-day constraints','precise invented traffic or prices rejected','negative disclaimers accepted','long prose shortened','bounded automatic repair','strict JSON schema','user hotel dates preserved','private env/server paths denied','missing key makes no provider call','valid response carries AI provenance','invalid provider JSON/truncation/auth failures explicit','cross-origin rejected'],providerCalls:calls};
  fs.writeFileSync(path.join(__dirname,'artifacts','deepseek-contract-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.message);process.exitCode=1});
