(function(){
  'use strict';
  const D=window.RoamDestinations,A=window.RoamAttractions,R=window.RoamRules,T=window.RoamTravelTemplates,S=window.RoamTravelStore;
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const query=new URLSearchParams(location.search),requested=query.get('place');
  let area=D.get(requested)?requested:S.lastArea(),plan=null,settings=S.draft(area),toastTimer=0,generationController=null,lastGenerationInput=null,activeTrip=null,trafficController=null,trafficRun=0,trafficCompleted=0;
  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  function notify(text){const el=$('#travel-notice');el.hidden=false;el.textContent=text;}
  function toast(text){const el=$('#travel-toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2500);}
  function route(view,push=false){
    const qs=new URLSearchParams({place:settings.area||area,view});if(activeTrip)qs.set('trip',activeTrip.id);
    const requestedStep=new URLSearchParams(location.search).get('step');if(view==='edit'&&requestedStep)qs.set('step',requestedStep);
    settings.areas.filter(id=>id!==settings.area).forEach(id=>qs.append('area',id));
    if(view==='edit'){if(settings.selected.length)qs.set('spots',settings.selected.join(','));if(settings.mustVisit.length)qs.set('must',settings.mustVisit.join(','));}
    history[push?'pushState':'replaceState'](null,'','/explore/yunnan/planner/?'+qs);
  }
  function checkStorage(ok){if(!ok)notify('本地存储不可用：当前可继续使用，但刷新后无法恢复。');return ok;}
  function readForm(){
    settings.aiProfile={...settings.aiProfile,party:$('#profile-party')?.value||settings.aiProfile?.party||'',mobility:$('#profile-mobility')?.value||settings.aiProfile?.mobility||'regular'};
    const additional=$$('input[name=additional-area]:checked').map(x=>x.value);
    return R.normalize({...settings,area:$('#plan-area').value,areas:additional,days:$('input[name=days]:checked')?.value,pace:$('input[name=pace]:checked')?.value,transport:$('input[name=transport]:checked')?.value,preferences:$$('input[name=preference]:checked').map(x=>x.value),selected:$$('input[name=spot]:checked').map(x=>x.value),mustVisit:$$('input[name=must]:checked').map(x=>x.value),startLocation:$('#start-location').value,endLocation:$('#end-location').value,sameEndAsStart:$('#same-end').checked,arrivalWindow:$('#arrival-window').value,departureWindow:$('#departure-window').value,arrivalTime:$('#arrival-time').value,departureTime:$('#departure-time').value,personalPlaces:settings.personalPlaces,legModes:settings.legModes,poiBindings:settings.poiBindings,aiRequest:$('#ai-expectation').value});
  }
  function counts(){const selected=$$('input[name=spot]:checked').length,must=$$('input[name=must]:checked').length;$('#choice-count').textContent=`已选 ${selected} 个 · 必去 ${must} 个`;}
  function updateLinks(){const place=D.get(settings.area),guide=$('#planner-back-guide');$('#planner-back-map').href=place.mapUrl;$('#result-return-map').href=place.mapUrl;guide.href=place.detailUrl;guide.hidden=!place.hasCatalogue;const nav=$('#site-header .planner-entry');if(nav)nav.href=place.mapUrl;$('#planner-region-name').textContent=place.shortName;const photo=$('#planner-region-photo');photo.hidden=!place.hasPhoto;if(place.hasPhoto){photo.src='/'+place.background;photo.alt=place.author+' 摄影：'+place.place;photo.style.objectPosition=place.position;}document.title=place.shortName+' · 我的旅行计划 · ROAM YUNNAN';}
  function fillOrigins(selector,area,wanted){const target=$(selector),origins=T.areas[area].origins;target.replaceChildren(...origins.map(([id,label])=>{const option=document.createElement('option');option.value=id;option.textContent=label+' · 区域参考';return option;}));target.value=origins.some(x=>x[0]===wanted)?wanted:T.defaultStart[area];}
  function renderRegionSwitches(){
    const container=$('#additional-areas');container.replaceChildren();
    for(const place of D.items.filter(item=>item.id!==settings.area)){
      const label=make('label','additional-area-choice'),input=document.createElement('input');input.type='checkbox';input.name='additional-area';input.value=place.id;input.checked=settings.areas.includes(place.id);label.append(input,make('span','',place.city+' · '+place.shortName));container.append(label);
    }
  }
  function renderChoices(){
    const box=$('#planner-spot-choices');box.replaceChildren();
    for(const spot of settings.areas.flatMap(id=>A.byRegion[id]||[])){
      const row=make('div','planner-choice-row'),label=make('label','planner-spot-choice'),select=document.createElement('input');select.type='checkbox';select.name='spot';select.value=spot.id;select.checked=settings.selected.includes(spot.id);label.append(select,make('span','choice-check','✓'));
      const photo=window.RoamAttractionPhotos?.[spot.id];
      if(photo){const thumb=make('img','choice-photo');thumb.src='/'+photo.src;thumb.alt=photo.subject||spot.name+'实景';thumb.loading='lazy';thumb.width=54;thumb.height=60;label.append(thumb);}
      else label.append(make('span','choice-photo-pending','照片待补'));
      const copy=make('span','choice-copy');copy.append(make('strong','',spot.name),make('small','',spot.zone));
      const flags=[];if(spot.kind.includes('hike'))flags.push('徒步 · 建议独立一天');else if(spot.kind.includes('highland'))flags.push('高海拔 · 留意身体状态');
      copy.append(make('small','choice-caution',flags.join(' · ')));if(photo)copy.append(make('small','choice-photo-credit',photo.author+' · '+photo.license));label.append(copy);
      const mustLabel=make('label','must-visit-toggle'),must=document.createElement('input');must.type='checkbox';must.name='must';must.value=spot.id;must.checked=settings.mustVisit.includes(spot.id);must.setAttribute('aria-label','标记必去：'+spot.name);mustLabel.append(must,make('span','',must.checked?'★':'☆'));
      select.addEventListener('change',()=>{if(!select.checked&&must.checked){must.checked=false;mustLabel.querySelector('span').textContent='☆';}counts();});
      must.addEventListener('change',()=>{if(must.checked&&!select.checked)select.checked=true;mustLabel.querySelector('span').textContent=must.checked?'★':'☆';counts();});row.append(label,mustLabel);box.append(row);
    }
    counts();
  }
  function renderForm(){
    $('#ai-expectation').value=settings.aiRequest||'';
    $('#plan-area').value=settings.area;renderRegionSwitches();fillOrigins('#start-location',settings.area,settings.startLocation);fillOrigins('#end-location',settings.area,settings.endLocation);
    $('#same-end').checked=settings.sameEndAsStart;$('#end-location').disabled=settings.sameEndAsStart;
    $('#arrival-window').value=settings.arrivalWindow;$('#departure-window').value=settings.departureWindow;$('#arrival-time').value=settings.arrivalTime||'';$('#departure-time').value=settings.departureTime||'';
    $$('input[name=days]').forEach(x=>x.checked=Number(x.value)===settings.days);$$('input[name=pace]').forEach(x=>x.checked=x.value===settings.pace);$$('input[name=transport]').forEach(x=>x.checked=x.value===settings.transport);$$('input[name=preference]').forEach(x=>x.checked=settings.preferences.includes(x.value));
    renderChoices();renderPersonalPlaces();updateLinks();$('#resume-plan').hidden=!S.plan(settings.area);
  }
  function renderPersonalPlaces(){
    const box=$('#personal-places-list');if(!box)return;box.replaceChildren();
    const places=window.RoamPersonalPlaces.normalize(settings.personalPlaces);
    if(!places.length){box.append(make('p','personal-places-empty','还没有添加酒店或餐厅。搜索时会默认限定在当前目的地。'));return;}
    for(const place of places){
      const item=make('article','personal-place-item'),copy=make('div');item.dataset.personalId=place.id;
      copy.append(make('small','',window.RoamPersonalPlaces.label(place)),make('h3','',place.name),make('p','',place.city+' · '+place.address));
      if(place.toDay>Number($('input[name=days]:checked')?.value||settings.days))copy.append(make('p','personal-place-warning','日期超出当前旅行天数，请调整日期或移除后重新添加。'));
      const actions=make('div','personal-place-item-actions'),change=make('button','','调整日期'),remove=make('button','','移除');change.type=remove.type='button';
      change.addEventListener('click',()=>window.RoamPlaceSearch?.edit(place));remove.addEventListener('click',()=>removePersonalPlace(place.id));actions.append(change,remove);item.append(copy,actions);box.append(item);
    }
  }
  function removePersonalPlace(id){
    settings.personalPlaces=(settings.personalPlaces||[]).filter(p=>p.id!==id);
    if(plan&&document.body.dataset.plannerView==='result'){plan.settings.personalPlaces=settings.personalPlaces;commitEdit();}else{checkStorage(S.setDraft(readForm()));renderPersonalPlaces();}
    toast('已移除自选地点，并重新检查计划。');
  }
  function focusSection(selector){const heading=$(selector);if(!heading)return;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  function showForm(push=false){stopTraffic();document.body.dataset.plannerView='edit';$('#planning-section').hidden=false;$('#result-section').hidden=true;renderForm();route('edit',push);window.RoamPlannerUI?.showStep(1);if(push)focusSection('#planning-title');}
  function assessAfterEdit(){plan.validation=R.recheck(plan);plan.warnings=R.warnings(plan);}
  function commitEdit(){stopTraffic();window.RoamTraffic.clear(plan);plan.savedAt=null;if(plan.ai)plan.ai.edited=true;assessAfterEdit();settings=plan.settings;checkStorage(S.setDraft(settings));persistTrip(true,'编辑行程');storePlan();renderResult();}
  function renderWarnings(){
    const panel=$('#plan-warnings');panel.replaceChildren();assessAfterEdit();
    for(const warning of plan.warnings){const item=make('p');item.append(make('span','warning-dot','·'),make('span','',warning));panel.append(item);}
    for(const issue of plan.validation.violations){const item=make('p','critical-warning');item.append(make('span','warning-dot','!'),make('span','',issue));panel.append(item);}
    panel.hidden=!plan.warnings.length&&!plan.validation.violations.length;
  }
  function renderTabs(){
    const target=$('#result-days');target.replaceChildren();
    plan.days.forEach((day,index)=>{const tab=make('button',index===plan.activeDay?'is-active':'');tab.type='button';tab.id='result-day-'+index;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(index===plan.activeDay));tab.setAttribute('aria-controls','day-itinerary');tab.append(make('strong','',window.RoamTripModel.dayDate(plan.settings.startDate,index)?.slice(5).replace('-','.')||'Day '+String(index+1).padStart(2,'0')),make('small','',day.type==='transfer'?'转场':day.type==='buffer'?'机动':day.stops.length+' 站'));tab.addEventListener('click',()=>{plan.activeDay=index;storePlan();renderTabs();renderDay();});const status=window.RoamTraffic.assess(plan,day),small=tab.querySelector('small');small.dataset.traffic=status.status;if(!['empty','transfer'].includes(status.status))small.textContent=status.label;target.append(tab);});
  }
  function renderDay(){
    if(window.RoamWorkbench){window.RoamWorkbench.render(plan);return;}
    const renderedPlan=plan;
    window.RoamPlannerView.renderDay(plan,{
      moveStop,removeStop,moveToDay,removePersonal:removePersonalPlace,
      editPlan(){settings=plan.settings;showForm(true);},applyTrafficSuggestion,refreshTraffic(){stopTraffic();startTraffic(true);renderDay();},
      setLegMode(key,mode){stopTraffic();plan.settings.legModes={...plan.settings.legModes,[key]:mode};delete plan.days[plan.activeDay].traffic;plan.savedAt=null;settings=plan.settings;checkStorage(S.setDraft(settings));storePlan();updateTrafficUI();},
      setTraffic(traffic){if(plan!==renderedPlan||traffic.fingerprint!==window.RoamTraffic.fingerprint(plan.days[plan.activeDay],plan.settings))return;plan.days[plan.activeDay].traffic=traffic;persistTraffic();if(!trafficController)startTraffic();},
      rerender(){if(plan===renderedPlan)renderDay();},
      setBinding(id,poi){
        if(plan!==renderedPlan)return;
        const existing=plan.settings.poiBindings?.[id];
        if(existing?.match==='user-confirmed'&&poi.match!=='user-confirmed')return;
        plan.settings.poiBindings=window.RoamPersonalPlaces.normalizeBindings({...plan.settings.poiBindings,[id]:poi});
        settings=plan.settings;checkStorage(S.setDraft(settings));storePlan();
      }
    });
    window.RoamJourneyUI?.renderDay();
  }
  function stopTraffic(){trafficController?.abort();trafficController=null;trafficRun++;}
  function needsVerification(day){const a=window.RoamTraffic.assess(plan,day);return a.status!=='empty'&&a.complete!==true;}
  function persistTraffic(){
    if(!plan)return;assessAfterEdit();if(plan.savedAt&&!plan.validation.valid){plan.savedAt=null;$('#save-status').textContent='新的交通核验发现冲突，请调整后重新保存。';}checkStorage(S.setDraft(plan.settings));storePlan();updateTrafficUI();
  }
  function updateTrafficUI(){
    if(!plan||document.body.dataset.plannerView!=='result')return;
    const F=window.RoamTraffic,states=plan.days.map(d=>F.assess(plan,d)),over=states.filter(a=>a.status==='over').length,tight=states.filter(a=>a.status==='tight').length;
    const remaining=states.filter(a=>!['empty','transfer'].includes(a.status)&&a.complete!==true).length;
    const hasPlaces=plan.days.some(day=>(window.RoamTraffic.entries(day,plan.settings)||[]).length);
    $('#traffic-verification-text').textContent=hasPlaces?(trafficController?`正在核验各日交通（${trafficCompleted}/${plan.days.filter(d=>d.type!=='transfer').length}）… `:'')+(over?`${over} 天安排过满，请删减或改期。 `:'')+(tight?`${tight} 天时间偏紧。 `:'')+(remaining?`${remaining} 天仍有交通、酒店或停留信息待补。`:states.some(a=>a.status==='transfer')?'城际转场尚需单独核实。':over||tight?'':`各日已完成当前道路与时间预算核验，出行前仍需复核。`):'还没有安排地点；添加地点或填写每日行程后再核验交通。';
    if(window.RoamWorkbench){window.RoamWorkbench.render(plan);renderWarnings();return;}
    const target=$('#day-traffic-assessment');if(target)window.RoamPlannerView.renderAssessment(plan,plan.days[plan.activeDay],target,{applyTrafficSuggestion,editPlan(){settings=plan.settings;showForm(true);}});
    renderTabs();renderWarnings();
  }
  function startTraffic(force=false){
    if(!plan||document.body.dataset.plannerView!=='result'||trafficController)return;
    const F=window.RoamTraffic;
    if(!force&&plan.days.every(d=>d.type==='transfer'||F.fresh(d,plan.settings))){updateTrafficUI();return;}
    if(force){window.RoamJourneyRouting.clear();for(const day of plan.days)delete day.traffic;plan.savedAt=null;}
    const activePlan=plan,controller=new AbortController(),run=++trafficRun;trafficController=controller;trafficCompleted=0;updateTrafficUI();
    const timeout=setTimeout(()=>controller.abort('timeout'),65000);let failure=null;
    const matches=()=>plan===activePlan&&run===trafficRun&&!controller.signal.aborted&&document.body.dataset.plannerView==='result';
    window.RoamTrafficService.checkPlan(plan,{signal:controller.signal,onDay(result){
      if(!matches())return;const day=plan.days.find(d=>d.dayNumber===result.dayNumber);if(!day)return;
      // A different point selected by the user while querying must invalidate old evidence.
      const merged=window.RoamPersonalPlaces.normalizeBindings({...result.bindings,...plan.settings.poiBindings});
      const settingsWithBindings={...plan.settings,poiBindings:merged};
      if(result.traffic.fingerprint!==F.fingerprint(day,settingsWithBindings))return;
      plan.settings.poiBindings=merged;day.traffic=result.traffic;settings=plan.settings;
      window.RoamWorkbench?.setDayRoutes(plan,result.dayNumber,result.points,result.legs);
      persistTraffic();
    },onProgress(done){if(matches()){trafficCompleted=done;updateTrafficUI();}}}).catch(error=>{
      if(matches()&&error.name!=='AbortError')failure='交通服务暂不可用，行程已保留；未核实部分不会当作可行。';
    }).finally(()=>{clearTimeout(timeout);if(plan===activePlan&&run===trafficRun&&document.body.dataset.plannerView==='result'){trafficController=null;persistTraffic();if(controller.signal.reason==='timeout')$('#traffic-verification-text').textContent='交通核验超时，已保留查到的路段；其余待确认，可重新查询。';else if(failure)$('#traffic-verification-text').textContent=failure;}});
  }
  function applyTrafficSuggestion(option){
    const changed=window.RoamTraffic.applySuggestion(plan,option);if(!changed)return;
    const existing=new Set(R.recheck(plan).violations),check=R.recheck(changed);
    if(check.violations.some(message=>!existing.has(message))){toast('该调整仍有冲突，请增加天数或手动调整。');return;}
    plan=changed;commitEdit();toast(option.kind==='defer'?'已移到待安排清单，选择仍保留；正在重新核验。':'已调整日期，必去景点与酒店保持；正在重新核验。');
  }
  $('#traffic-recheck').addEventListener('click',()=>{stopTraffic();startTraffic(true);renderDay();});
  $('#traffic-edit').addEventListener('click',()=>{settings=plan.settings;showForm(true);});
  window.addEventListener('focus',()=>{if(document.body.dataset.plannerView==='result')startTraffic();});
  setInterval(()=>{if(!document.hidden&&document.body.dataset.plannerView==='result')startTraffic();},60000);
  function renderUnassigned(){if(window.RoamJourneyUI){window.RoamJourneyUI.renderPool();return;}const box=$('#unassigned-spots');box.replaceChildren();box.hidden=!(plan.unassigned.length||plan.unassignedRegions?.length);if(box.hidden)return;box.append(make('h3','','仍留在心愿清单的计划'),make('p','','已保留未能安排的景点或地区，不会静默丢弃。可增加天数或减少地区。'));const list=make('ul');plan.unassigned.forEach(id=>list.append(make('li','',A.get(id).name)));plan.unassignedRegions.forEach(id=>list.append(make('li','',T.areas[id].label+'（尚未安排完整观光日）')));box.append(list);const edit=make('button','text-gold','修改计划 ↗');edit.type='button';edit.addEventListener('click',()=>showForm(true));box.append(edit);}
  function renderResult(){
    if(!activeTrip){activeTrip={id:plan.tripId||window.RoamTripLibrary.id(),title:plan.title||D.get(plan.settings.area).city+' · '+plan.settings.days+'天旅行',startDate:plan.settings.startDate||'',mode:plan.planningMode==='manual'?'manual':'ai',settings:plan.settings};plan.tripId=activeTrip.id;}
    document.body.dataset.plannerView='result';
    $('#planning-section').hidden=true;$('#result-section').hidden=false;const regions=plan.settings.areas.map(id=>T.areas[id].label),preferences=plan.settings.preferences.map(id=>R.preferenceNames[id]).join(' · ')||'随心发现';
    $('#result-title').textContent=activeTrip?.title||(regions.length>1?regions.join(' → '):D.get(plan.settings.area).city)+' · '+plan.settings.days+' 天'+({slow:'慢慢走',standard:'刚刚好',full:'自在探索'}[plan.settings.pace]);
    $('#result-subtitle').textContent=`${preferences} · ${({public:'公共交通',drive:'自驾',undecided:'交通待定'})[plan.settings.transport]} · ${plan.ai?'DeepSeek 规划 · 交通负荷另行核验':plan.planningMode==='manual'?'自己安排 · 时间由你填写':'历史参考行程'}`;$('#save-status').textContent=plan.savedAt?(plan.days.some(needsVerification)?'参考草稿已保存 · 尚有交通或停留信息待确认':'已保存到当前浏览器 · 可刷新恢复'):'已在当前浏览器保留草稿，点击保存标记当前版本';
    $('#ai-result-summary').hidden=!plan.ai;
    if(plan.ai){$('#ai-result-title').textContent=plan.ai.title;$('#ai-result-text').textContent=plan.ai.summary;$('#ai-result-source').textContent='DeepSeek · '+plan.ai.model+' · '+(plan.ai.edited?'已手动调整，说明来自原 AI 版本；当前结果重新经过规则检查。':'依据项目景点与用户选择生成；道路查询参与下方每日负荷核验，开放、预约与园内接驳仍需确认。');}
    const sources=[...new Set(plan.days.map(day=>day.source).filter(Boolean))],classicText=(plan.templates||[]).map(item=>item.reason).filter(Boolean).join(' ');const reason=$('#template-reason');reason.hidden=!classicText&&!sources.length;reason.textContent=classicText?`人工整理参考模板：${classicText} 资料仅支持景点与片区关系，不是实测交通线路。`:'按地区片区整理为参考草案。未核实交通的地点不显示精确路线时间。';
    renderWarnings();renderUnassigned();updateLinks();
    if(window.RoamWorkbench)window.RoamWorkbench.render(plan);else{renderTabs();renderDay();}
    window.RoamJourneyUI?.render();startTraffic();persistTrip();
  }
  async function generate(override=null){
    if(generationController)return;stopTraffic();
    if(!override&&!readForm().selected.length&&!settings.personalPlaces.length){window.RoamPlannerUI?.showStep(1);toast('先选一个想去的地方，也可以点击“选入常见地点”。');return;}
    let input=R.normalize(override||readForm());
    if(window.RoamJourneyUI&&!input.aiProfile.confirmed){
      const confirmed=await window.RoamJourneyUI.clarify(input);if(!confirmed)return;
      input=R.normalize(confirmed);settings=input;checkStorage(S.setDraft(settings));persistTrip();
    }
    const controller=new AbortController();generationController=controller;
    lastGenerationInput=input;const progress=$('#ai-generation-progress');progress.hidden=false;progress.classList.remove('is-error');$('#ai-generation-message').textContent='正在安排你选择的地点，检查分组与时间；如有冲突会自动校正一次…';$('#cancel-ai-generation').hidden=false;$('#retry-ai-generation').hidden=true;
    $('#travel-form').inert=true;$('.planning-aside').inert=true;$('#result-section').inert=true;
    if(window.RoamPlannerUI?.beginGeneration)window.RoamPlannerUI.beginGeneration();else if(document.body.dataset.plannerView==='result'){$('#planning-section').before(progress);}else{$('#planning-section .planning-layout').before(progress);}
    const timeout=setTimeout(()=>controller.abort('timeout'),105000);
    try{
      const generated=await window.RoamAIService.generate(input,controller.signal);if(controller.signal.aborted)return;
      generated.planningMode='ai';generated.settings.planningMode='ai';
      if(activeTrip){generated.tripId=activeTrip.id;generated.title=activeTrip.title;generated.settings.startDate=activeTrip.startDate;}
      if(plan){generated.days.forEach((d,i)=>{if(plan.days[i]?.note)d.note=plan.days[i].note;});}
      plan=generated;settings=plan.settings;area=settings.area;if(activeTrip)activeTrip.mode='ai';persistTrip(true,'AI重新安排');checkStorage(S.setDraft(settings));storePlan();route('result',true);renderResult();progress.hidden=true;window.RoamPlannerUI?.endGeneration();$('#result-section').inert=false;focusSection('#result-title');toast('AI 草案已生成，正在查询各日交通并核验实际负荷。');
    }catch(error){
      progress.classList.add('is-error');$('#cancel-ai-generation').hidden=true;$('#retry-ai-generation').hidden=false;
      $('#ai-generation-message').textContent=controller.signal.aborted?(controller.signal.reason==='timeout'?'AI 规划超时，已有行程保留，请稍后重试。':'已取消生成，已有行程保留。'):error.message;
      window.RoamPlannerUI?.generationFailed(controller.signal.aborted);
      progress.scrollIntoView({block:'center',behavior:'auto'});
    }finally{clearTimeout(timeout);generationController=null;$('#travel-form').inert=false;$('.planning-aside').inert=false;$('#result-section').inert=false;}
  }
  function moveStop(from,step){const day=plan.days[plan.activeDay],target=from+step;if(target<0||target>=day.stops.length)return;[day.stops[from],day.stops[target]]=[day.stops[target],day.stops[from]];commitEdit();toast('顺序已调整，正在重新查询交通并核验当天负荷。');}
  function moveToDay(id,index){
    if(index===plan.activeDay)return;if(plan.planningMode==='manual'){try{plan=window.RoamTripModel.place(plan,id,index);commitEdit();toast('已改期，时间安排已清空，请重新核对。');}catch(e){toast(e.message);}return;}const changed=JSON.parse(JSON.stringify(plan)),from=changed.days[plan.activeDay],to=changed.days[index],spot=A.get(id);
    if(!to||to.type==='transfer'||to.area!==spot.area){toast('这个日期属于转场或其他地区，请选择同地区的游玩日。');renderDay();return;}
    const emptyTarget=!to.stops.length;from.stops=from.stops.filter(x=>x!==id);to.stops.push(id);
    if(to.type==='buffer'||emptyTarget){const template=T.areas[spot.area].days.find(d=>d.clusters.includes(spot.cluster));Object.assign(to,{...template,area:spot.area,dayNumber:index+1,type:'sightseeing',stops:[id],ids:[...template.ids],mealMinutes:60,restMinutes:T.buffer.rest[changed.settings.pace],transferReserveMinutes:45});}
    const existing=new Set(R.recheck(plan).violations),check=R.recheck(changed),added=check.violations.filter(message=>!existing.has(message));if(added.length){toast(added[0]+' 可换到同片区或空闲的一天。');renderDay();return;}
    changed.activeDay=index;plan=changed;commitEdit();toast('已调整日期，并重新检查当天安排。');
  }
  function removeStop(id){const day=plan.days[plan.activeDay];day.stops=day.stops.filter(item=>item!==id);plan.settings.selected=plan.settings.selected.filter(item=>item!==id);plan.settings.mustVisit=plan.settings.mustVisit.filter(item=>item!==id);plan.unassigned=plan.unassigned.filter(item=>item!==id);commitEdit();toast('景点已移除，行程时长与片区约束已重新核算。');}
  function preserveDraft(){settings=readForm();area=settings.area;checkStorage(S.setDraft(settings));persistTrip();counts();renderPersonalPlaces();if(document.body.dataset.plannerView==='edit')route('edit');}

  window.RoamPlannerPersonal=Object.freeze({
    settings(){return document.body.dataset.plannerView==='result'?plan.settings:readForm();},
    context(){return{area:settings.area,days:document.body.dataset.plannerView==='result'?plan.settings.days:Number($('input[name=days]:checked')?.value||settings.days),places:settings.personalPlaces||[]};},
    add(value,replaceId=null){
      const P=window.RoamPersonalPlaces,place=P.normalize([value])[0];if(!place)return{ok:false,message:'地点、日期或位置数据无效，请重新确认。'};
      if(document.body.dataset.plannerView!=='result')settings=readForm();
      const existing=(settings.personalPlaces||[]).filter(p=>p.id!==replaceId);
      if(existing.some(p=>p.id===place.id))return{ok:false,message:'这个地点已加入相同日期与时段。'};
      if(place.kind==='hotel'&&existing.some(p=>p.kind==='hotel'&&p.fromDay<=place.toDay&&p.toDay>=place.fromDay))return{ok:false,message:'所选日期已有酒店，请调整日期，或先移除原酒店。'};
      settings.personalPlaces=P.normalize([...existing,place]);
      if(document.body.dataset.plannerView==='result'){plan.settings.personalPlaces=settings.personalPlaces;commitEdit();}
      else{checkStorage(S.setDraft(settings));renderPersonalPlaces();}
      toast('已'+(replaceId?'更新':'加入')+' '+place.name+'，并保留到当前浏览器。');return{ok:true};
    },
    remove:removePersonalPlace
  });

  function persistTrip(revision=false,label='更新计划'){
    if(!activeTrip)return true;
    if(plan?.tripId===activeTrip.id&&plan.title)activeTrip.title=plan.title;
    activeTrip.startDate=(document.body.dataset.plannerView==='result'&&plan?plan.settings:settings).startDate||'';
    const payload={...activeTrip,settings:plan&&document.body.dataset.plannerView==='result'?plan.settings:settings,
      plan:plan&&plan.tripId===activeTrip.id?plan:activeTrip.plan||null,mode:activeTrip.mode};
    const ok=window.RoamTripLibrary.save(payload,{revision,label});if(!ok)notify('旅行记录保存失败，可能存储空间不足。当前编辑仍保留，请先导出行程。');return ok;
  }
  function storePlan(){checkStorage(S.setPlan(plan));return persistTrip();}
  function replaceCurrent(next,label){
    const candidate=R.validatePlan(next);if(!candidate){toast('行程格式无效，未采用。');return false;}
    plan=candidate;plan.savedAt=null;if(plan.ai)plan.ai.edited=true;settings=plan.settings;
    stopTraffic();assessAfterEdit();persistTrip(true,label);checkStorage(S.setDraft(settings));storePlan();renderResult();return true;
  }
  window.RoamJourneyController={
    context(){return{settings:document.body.dataset.plannerView==='edit'?readForm():settings,plan,trip:activeTrip,initialEntry:!query.has('trip')&&!query.has('spots')&&!query.has('step')&&!query.has('demo')};},
    create(value){
      stopTraffic();const seed=value.fresh?{area:value.area||settings.area,days:value.days}:{...(document.body.dataset.plannerView==='result'?settings:readForm())};
      settings=R.normalize({...seed,area:value.area||settings.area,days:value.days,startDate:value.startDate,planningMode:value.mode,aiProfile:{}});
      area=settings.area;activeTrip={id:window.RoamTripLibrary.id(),title:value.title,startDate:value.startDate,mode:value.mode,settings};
      plan=null;checkStorage(S.setDraft(settings));persistTrip();
      if(value.mode==='manual'){plan=window.RoamTripModel.create(settings,activeTrip);plan.tripId=activeTrip.id;storePlan();route('result',true);renderResult();}
      else{showForm(true);window.RoamJourneyUI?.render();}
    },
    reset(){stopTraffic();if(plan)S.removePlan(plan.settings.area);activeTrip=null;plan=null;settings=R.normalize({area});showForm(true);},
    open(id){
      const trip=window.RoamTripLibrary.get(id);if(!trip)return;stopTraffic();activeTrip=trip;settings=R.normalize(trip.settings);area=settings.area;plan=trip.plan?R.validatePlan(trip.plan):null;
      checkStorage(S.setDraft(settings));if(plan){route('result',true);renderResult();}else showForm(true);
    },
    update:replaceCurrent,notify:toast,edit(){settings=plan.settings;showForm(true);},
    generate(){settings=R.normalize({...settings,planningMode:'ai',aiProfile:{...settings.aiProfile,confirmed:false}});showForm(true);window.RoamPlannerUI?.showStep(3);},
    saveDraft(){settings=readForm();checkStorage(S.setDraft(settings));persistTrip();},
    updateDetails(value){settings=R.normalize({...readForm(),days:value.days,startDate:value.startDate});if(activeTrip){activeTrip.title=value.title;activeTrip.startDate=value.startDate;}checkStorage(S.setDraft(settings));persistTrip();renderForm();window.RoamPlannerUI?.showStep(1);window.dispatchEvent(new Event('journey-details'));},
    rename(title){if(!activeTrip)return;activeTrip.title=title;if(plan)plan.title=title;persistTrip(true,'重命名');window.RoamJourneyUI?.render();},
    restore(index){if(!activeTrip)return;const t=window.RoamTripLibrary.restore(activeTrip.id,index);if(t)this.open(t.id);},
    addPersonal:()=>window.RoamPlaceSearch.open('other'),
    setActiveDay(index){if(plan&&plan.days[index])plan.activeDay=index;},
    actions:{
      moveStop(index,step){moveStop(index,step);},
      removeStop(id){removeStop(id);},
      moveToDay(id,index){moveToDay(id,index);},
      removePersonal(id){removePersonalPlace(id);}
    }
  };

  D.items.forEach(place=>{const option=document.createElement('option');option.value=place.id;option.textContent=place.city+' · '+place.shortName;$('#plan-area').append(option);});
  const pace=$('.pace-options');
  if(!pace.querySelector('input[value="standard"]')){
    const label=make('label'),input=document.createElement('input');input.type='radio';input.name='pace';input.value='standard';const span=make('span','','标准节奏');span.append(make('small','','兼顾观赏与休息'));label.append(input,span);pace.insertBefore(label,pace.lastElementChild);
  }
  const incomingAreas=query.getAll('area').filter(id=>D.get(id)&&id!==area);
  if(incomingAreas.length&&!query.has('spots'))settings=R.normalize({...settings,areas:incomingAreas});
  if(query.get('demo')){
    settings=R.normalize(query.get('demo')==='lijiang'?{area:'yulong',days:2,pace:'standard',transport:'public',preferences:['culture','photo']}:{area:'erhai',days:3,pace:'slow',transport:'drive',preferences:['culture','photo','nature']});
    area=settings.area;checkStorage(S.setDraft(settings));
  }
  if(requested&&!D.get(requested))notify('此地区未收录，已打开最近使用的地区。');
  if(query.has('spots')||query.has('must')){const ids=(query.get('spots')||'').split(',').filter(Boolean),must=(query.get('must')||'').split(',').filter(Boolean);settings=R.normalize({...settings,areas:incomingAreas,selected:ids,mustVisit:must});checkStorage(S.setDraft(settings));if(settings.selected.length!==new Set(ids).size)notify('链接包含当前地区之外或未收录的景点，已忽略这些项。');}
  const incomingTrip=window.RoamTripLibrary.get(query.get('trip'));
  if(incomingTrip){activeTrip=incomingTrip;settings=R.normalize(incomingTrip.settings);area=settings.area;checkStorage(S.setDraft(settings));}
  let cached=incomingTrip?(incomingTrip.plan?R.validatePlan(incomingTrip.plan):null):query.has('trip')?null:S.plan(area);
  if(query.get('demo')){showForm();notify('已填入示例偏好，点击“生成我的路线”后由 DeepSeek 实际生成。');}
  else if(cached&&cached.settings.areas.join(',')===settings.areas.join(',')&&!query.has('spots')&&query.get('view')!=='edit'){plan=cached;settings=plan.settings;renderResult();route('result');}else{if(query.get('view')==='result'&&!cached)notify('没有可恢复的已生成行程。请先生成计划。');showForm();}
  $('#plan-area').addEventListener('change',()=>{const previous={...settings,area,selected:$$('input[name=spot]:checked').map(x=>x.value),mustVisit:$$('input[name=must]:checked').map(x=>x.value)};checkStorage(S.setDraft(previous));area=$('#plan-area').value;settings=R.normalize({...S.draft(area),area,areas:[area],selected:S.selection(area),mustVisit:S.mustVisits(area)});activeTrip=null;plan=null;renderForm();route('edit');window.RoamJourneyUI?.render();toast('已切换目的地；跨地区行程需另外留出转场日。');});
  $('#additional-areas').addEventListener('change',()=>{settings=readForm();checkStorage(S.setDraft(settings));renderChoices();});
  $('#same-end').addEventListener('change',()=>{$('#end-location').disabled=$('#same-end').checked;if($('#same-end').checked)$('#end-location').value=$('#start-location').value;preserveDraft();});
  $('#start-location').addEventListener('change',()=>{if($('#same-end').checked)$('#end-location').value=$('#start-location').value;preserveDraft();});
  $('#end-location').addEventListener('change',preserveDraft);
  $('#travel-form').addEventListener('change',event=>{if(event.target.id==='plan-area'||event.target.name==='additional-area'||event.target.id==='same-end'||event.target.id==='start-location'||event.target.id==='end-location')return;preserveDraft();});
  $('#ai-expectation').addEventListener('input',()=>{settings=readForm();checkStorage(S.setDraft(settings));persistTrip();});
  $('#clear-choices').addEventListener('click',()=>{$$('input[name=spot],input[name=must]').forEach(input=>input.checked=false);preserveDraft();renderChoices();toast('已清空景点和必去标记。');});
  $('#travel-form').addEventListener('submit',event=>{event.preventDefault();if(window.RoamPlannerUI&&document.body.dataset.plannerStep!=='3')return;if(area!==$('#plan-area').value)area=$('#plan-area').value;generate();});
  $('#cancel-ai-generation').addEventListener('click',()=>generationController?.abort('user'));
  $('#retry-ai-generation').addEventListener('click',()=>generate(lastGenerationInput));
  $('#edit-plan').addEventListener('click',()=>{settings=R.normalize({...plan.settings,selected:plan.settings.selected,mustVisit:plan.settings.mustVisit});showForm(true);});
  $('#save-plan').addEventListener('click',()=>{plan.validation=R.recheck(plan);if(!plan.validation.valid){plan.warnings=R.warnings(plan);renderWarnings();toast('行程存在片区或时间冲突，请按每日提醒调整后保存。');return;}const pending=plan.days.some(needsVerification);persistTrip(true,'手动保存');plan.savedAt=new Date().toISOString();if(storePlan()){$('#save-status').textContent=pending?'参考草稿已保存 · 尚有交通或停留信息待确认':'已保存到当前浏览器 · 刷新可恢复此版本';toast(pending?'已保存参考草稿；仍有交通或停留信息待确认。':'行程已保存，可刷新恢复。');}else plan.savedAt=null;});
  $('#resume-plan').addEventListener('click',()=>{const saved=S.plan(area);if(saved){plan=saved;settings=plan.settings;route('result',true);renderResult();toast('已恢复上次保存的地区行程。');}});
  $('#regenerate-plan').addEventListener('click',()=>$('#regenerate-dialog').showModal());$('#cancel-regenerate').addEventListener('click',()=>$('#regenerate-dialog').close());
  $('#confirm-regenerate').addEventListener('click',()=>{$('#regenerate-dialog').close();generate(plan.settings);});
  window.RoamAIService.status().then(status=>{const box=$('#ai-service-status');box.hidden=status.configured;box.textContent=status.configured?'已读取 DeepSeek 配置。':status.unavailable?'AI 规划服务尚未启动。':'DeepSeek API Key 尚未配置，配置后即可生成路线。';if(!status.configured){const link=make('a','','查看申请与配置步骤 ↗');link.href='/data/DEEPSEEK.md';link.target='_blank';link.rel='noopener noreferrer';box.append(link);}});
  window.addEventListener('popstate',()=>location.reload());
})();

