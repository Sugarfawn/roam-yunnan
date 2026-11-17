/* Three-column result workbench. Planning, saving, history and road services stay in existing modules. */
(function(root){
  'use strict';
  const C=()=>root.RoamJourneyController, L=()=>root.RoamTripLibrary, A=()=>root.RoamAttractions,
    T=()=>root.RoamTraffic, R=()=>root.RoamJourneyRouting, M=()=>root.RoamTripModel,
    P=()=>root.RoamPersonalPlaces, UI=()=>root.RoamJourneyUI;
  const $=sel=>document.querySelector(sel), $$=sel=>[...document.querySelectorAll(sel)];
  const COLORS=['#3f6b51','#b4884f','#668a89','#9b6f5b','#7b7b58','#846b86'];
  const MODE_NAMES={walk:'步行',drive:'自驾 / 打车',public:'公共交通'};
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dayColor=dayNumber=>COLORS[(dayNumber-1)%COLORS.length];
  const dateLabel=(start,index)=>M().dayDate(start,index)||'';

  let plan=null, activeDay=0, selectedKey=null, mapMode='all', mapDay=1;
  let routeCache=new Map(), routePending=new Set(), cachePlan=null, ensureTimer=0, scrollLeft=0;
  let booted=false, assistantCollapsed=false, mapCollapsed=false;

  function trip(){return C()?.context().trip||null;}
  function setActive(index){
    if(!plan||!plan.days[index])return;
    activeDay=index;plan.activeDay=index;
  }
  function dayEntries(day){return T()?.entries(day,plan.settings)||[];}
  function currentCache(dayNumber){return routeCache.get(Number(dayNumber))||null;}
  function fingerprint(day){return T()?.fingerprint(day,plan.settings)||'';}

  function renderTop(p){
    const t=trip(), start=p.settings.startDate||'';
    $('#result-title').textContent=t?.title||p.title||'我的云南漫游计划';
    $('#wb-date').textContent=start?start.replaceAll('-','.'):'日期待定';
    $('#wb-duration').textContent=`${p.settings.days}天`;
    const full=t?L()?.get(t.id):null, history=full?.history||[];
    const undo=$('#wb-undo');undo.disabled=!history.length;
    undo.title=history.length?'恢复上一版':'还没有可撤销的版本';
    $('#regenerate-plan').hidden=p.planningMode==='manual';
  }

  function renderAssistant(p){
    const t=trip(), places=(p.settings.personalPlaces||[]).length;
    if(p.ai?.title){
      $('#wb-ai-summary').innerHTML=`<strong>${esc(p.ai.title)}</strong><p>${esc(p.ai.summary||'')}</p><small>DeepSeek · ${esc(p.ai.model||'')}${p.ai.edited?' · 已手动调整':''}</small>`;
    }else{
      $('#wb-ai-summary').innerHTML=`<strong>${p.planningMode==='manual'?'自己安排 · 每天由你决定':'这一程，按你的选择展开'}</strong><p>${p.settings.selected.length} 个景点 · ${places} 个酒店 / 餐厅 · ${p.settings.days} 天。地点顺序与时间都可以继续调整。</p>`;
    }
    const warnings=[...(p.warnings||[]),...(p.validation?.violations||[])];
    $('#wb-warnings').innerHTML=[...new Set(warnings)].slice(0,8).map(text=>`<p class="wb-warning${String(text).includes('冲突')||String(text).includes('超')?' is-critical':''}">${esc(text)}</p>`).join('');
    if(UI()?.renderPool)UI().renderPool();
    const count=p.days.reduce((n,d)=>n+dayEntries(d).length,0);
    $('#wb-day-count').textContent=`${p.settings.days} 天 · ${count} 个地点`;
  }

  function modeText(mode){return MODE_NAMES[mode]||'交通';}
  function formatDistance(m){return Number.isFinite(m)?R().distance(m):'';}
  function formatDuration(s){return Number.isFinite(s)?R().duration(s):'';}
  function evidenceLeg(day,fromKey,toKey){return (day.traffic?.legs||[]).find(l=>l.fromKey===fromKey&&l.toKey===toKey);}
  function cacheLeg(day,fromKey,toKey){return (currentCache(day.dayNumber)?.legs||[]).find(l=>l.fromKey===fromKey&&l.toKey===toKey);}
  function legView(day,from,to){
    const cached=cacheLeg(day,from.key,to.key);
    if(cached?.result){const result=cached.result;return{result,status:result.status||'unavailable'};}
    const evidence=evidenceLeg(day,from.key,to.key);
    if(evidence)return{result:evidence,status:evidence.status||'unavailable'};
    return{result:null,status:'pending'};
  }
  function legText(day,from,to){
    const leg=legView(day,from,to), result=leg.result;
    if(!result)return{text:'路线待查询',pending:true};
    if(result.status==='same')return{text:'同一地点，无需转场',pending:false};
    if(result.status==='ok'&&Number.isFinite(result.distanceMeters)&&Number.isFinite(result.durationSeconds)){
      return{text:`${modeText(result.mode)} · ${formatDistance(result.distanceMeters)} · 约 ${formatDuration(result.durationSeconds)}`,pending:false};
    }
    if(result.status==='missing')return{text:'待确认两端地图位置',pending:true};
    return{text:result.message||'路线待查询',pending:true};
  }
  function routeSummary(day){
    const entries=dayEntries(day), legs=[];
    for(let i=0;i<entries.length-1;i++)legs.push(legView(day,entries[i],entries[i+1]));
    const known=legs.filter(l=>l.result&&['ok','same'].includes(l.result.status));
    const missing=legs.length-known.length;
    const distance=known.reduce((n,l)=>n+(Number.isFinite(l.result.distanceMeters)?l.result.distanceMeters:0),0);
    const duration=known.reduce((n,l)=>n+(Number.isFinite(l.result.durationSeconds)?l.result.durationSeconds:0),0);
    if(!legs.length)return{known:0,total:0,text:'没有路段',pending:false,distance:0,duration:0};
    if(!known.length)return{known:0,total:legs.length,text:'路线待查询',pending:true,distance:0,duration:0};
    return{known:known.length,total:legs.length,text:`${known.length}/${legs.length} 段 · ${formatDistance(distance)} · ${formatDuration(duration)}${missing?' · '+missing+' 段待查':''}`,pending:missing>0,distance,duration};
  }

  function fallbackPoints(day){
    const entries=dayEntries(day), out=[];
    for(const entry of entries){
      if(entry.type==='personal'&&entry.place?.coordinates)out.push({key:entry.key,index:entry.indexInDay,name:entry.name,poi:entry.place});
      else if(entry.type==='attraction'){
        const poi=plan.settings.poiBindings?.[entry.spot.id];
        if(poi?.coordinates)out.push({key:entry.key,index:entry.indexInDay,name:entry.name,poi});
      }
    }
    return out;
  }

  function stopCard(day,entry,index){
    const color=dayColor(day.dayNumber), timing=day.timings?.[entry.key];
    if(entry.type==='personal'){
      const place=entry.place, kind=entry.role==='start'?'酒店出发':entry.role==='end'?'返回酒店':P()?.label(place)||'酒店 / 餐厅';
      return `<article class="wb-stop-card personal${selectedKey===entry.key?' is-selected':''}" tabindex="0" data-day="${day.dayNumber}" data-key="${esc(entry.key)}" data-kind="personal">
        <div class="wb-stop-copy">
          <span class="wb-stop-kind">${esc(kind)}</span>
          <h3>${esc(place.name)}</h3>
          <small>${esc(place.address||place.city||'高德 POI')}</small>
          ${timing?.start?`<span class="wb-stop-time">${esc(timing.start)} – ${esc(timing.end)} · 我的安排</span>`:''}
          ${timing?.note?`<p class="wb-stop-note">${esc(timing.note)}</p>`:''}
          <div class="wb-stop-tools">
            <button type="button" data-act="time">时间</button>
            <button type="button" data-act="edit-personal">调整</button>
            <button type="button" data-act="remove-personal">移除</button>
          </div>
        </div>
      </article>`;
    }
    const spot=entry.spot, photo=root.RoamAttractionPhotos?.[spot.id];
    const kind=plan.settings.mustVisit.includes(spot.id)?'★ 必去':plan.settings.selected.includes(spot.id)?spot.zone:'AI 补充 · '+spot.zone;
    const estimate=spot.estimate?`游览参考 ${spot.estimate.min}–${spot.estimate.max} 分钟`:'游览时长待补';
    const options=plan.days.map((d,i)=>({i,label:M().dayDate(plan.settings.startDate,i)||`Day ${String(i+1).padStart(2,'0')}`,enabled:d.type!=='transfer'&&d.area===spot.area}))
      .filter(x=>x.enabled).map(x=>`<option value="${x.i}" ${x.i===day.dayNumber-1?'selected':''}>${esc(x.label)}</option>`).join('');
    return `<article class="wb-stop-card${selectedKey===entry.key?' is-selected':''}" tabindex="0" data-day="${day.dayNumber}" data-key="${esc(entry.key)}" data-kind="attraction" style="--day-color:${color}">
      ${photo?`<img class="wb-stop-photo" src="/${esc(photo.src)}" alt="${esc(photo.subject||spot.name)}" loading="lazy">`:''}
      <div class="wb-stop-copy">
        <span class="wb-stop-kind">${esc(kind)}</span>
        <h3>${esc(spot.name)}</h3>
        <small>${esc(estimate)} · ${esc(spot.zone)}</small>
        ${timing?.start?`<span class="wb-stop-time">${esc(timing.start)} – ${esc(timing.end)} · 我的安排</span>`:''}
        ${timing?.note?`<p class="wb-stop-note">${esc(timing.note)}</p>`:''}
        <div class="wb-stop-tools">
          <button type="button" data-act="time">时间</button>
          <button type="button" data-act="bind">${plan.settings.poiBindings?.[spot.id]?'改位置':'定位'}</button>
          <button type="button" data-act="up" ${day.stops.indexOf(spot.id)===0?'disabled':''} aria-label="上移">↑</button>
          <button type="button" data-act="down" ${day.stops.indexOf(spot.id)===day.stops.length-1?'disabled':''} aria-label="下移">↓</button>
          <select class="day-move" data-act="move-day" aria-label="调整日期">${options}</select>
          <button type="button" data-act="defer">待安排</button>
          <button type="button" data-act="remove">移除</button>
        </div>
      </div>
    </article>`;
  }

  function dayColumn(day,index){
    const color=dayColor(day.dayNumber), entries=dayEntries(day), assessment=T()?.assess(plan,day)||{status:'pending',label:'待核验'};
    const summary=routeSummary(day), date=dateLabel(plan.settings.startDate,index);
    const cards=[];
    entries.forEach((entry,i)=>{
      cards.push(stopCard(day,entry,i));
      if(i<entries.length-1){
        const leg=legText(day,entry,entries[i+1]);
        cards.push(`<div class="wb-leg${leg.pending?' is-pending':''}"><span class="wb-leg-text">${esc(leg.text)}</span></div>`);
      }
    });
    const body=cards.length?cards.join(''):`<div class="wb-day-empty">${day.type==='transfer'?'这一天用于转场，暂不安排景点。':'这一天留给休息与临时起意。<br>可以添加地点，或把待安排的地方放进来。'}</div>`;
    return `<article class="wb-day-column${index===activeDay?' is-active':''}" data-day-column="${day.dayNumber}" style="--day-color:${color}">
      <header class="wb-day-head" data-day-select="${index}" tabindex="0" aria-label="查看第${day.dayNumber}天地图">
        <div class="wb-day-kicker"><span class="wb-day-index"><span>DAY</span><strong>${String(day.dayNumber).padStart(2,'0')}</strong></span><span class="wb-day-date">${esc(date||'日期待定')}</span></div>
        <h3 class="wb-day-title">${esc(day.theme||day.zone||'自由安排')}</h3>
        <div class="wb-day-meta"><span>${entries.length} 个停留点</span><span class="wb-day-status" data-status="${esc(assessment.status)}">${esc(assessment.label)}</span></div>
        <div class="wb-day-route${summary.pending?' is-pending':''}">${esc(summary.text)}</div>
      </header>
      <div class="wb-day-scroll" data-day-scroll="${index}">${body}</div>
      <footer class="wb-day-footer"><button type="button" data-day-act="note" data-day="${index}">当天备注</button><button type="button" data-day-act="add" data-day="${index}">＋ 添加地点</button></footer>
    </article>`;
  }

  function renderCanvas(p){
    const canvas=$('#day-canvas');
    if(!canvas)return;
    const previous=canvas.scrollLeft;
    canvas.innerHTML=p.days.map((day,index)=>dayColumn(day,index)).join('');
    canvas.scrollLeft=previous||scrollLeft;
    if(selectedKey&&!p.days.some(day=>dayEntries(day).some(e=>e.key===selectedKey)))selectedKey=null;
  }

  function mapDays(p){
    return p.days.map(day=>{
      const cache=currentCache(day.dayNumber);
      return{dayNumber:day.dayNumber,color:dayColor(day.dayNumber),points:cache?.points||fallbackPoints(day),legs:cache?.legs||[]};
    });
  }

  function renderMap(p){
    const container=$('#workbench-map');
    if(!container)return;
    const days=mapDays(p);
    const shown=mapMode==='single'?days.filter(d=>d.dayNumber===activeDay+1):days;
    $('#map-mode-all').classList.toggle('is-active',mapMode==='all');
    $('#map-mode-single').classList.toggle('is-active',mapMode==='single');
    $('#wb-map-day-label').textContent=mapMode==='single'?`Day ${String(activeDay+1).padStart(2,'0')}`:'全部日期';
    $('#wb-map-legend').innerHTML=days.map(day=>`<button type="button" data-map-day="${day.dayNumber}" class="${day.dayNumber===activeDay+1?'is-active':''}" style="--day-color:${day.color}"><i></i>Day ${String(day.dayNumber).padStart(2,'0')}</button>`).join('');
    const known=shown.flatMap(day=>day.legs||[]).filter(l=>l.result&&['ok','same'].includes(l.result.status));
    const total=shown.reduce((n,day)=>n+Math.max(0,(day.points?.length||0)-1),0);
    const missing=total-known.length;
    const distance=known.reduce((n,l)=>n+(Number.isFinite(l.result.distanceMeters)?l.result.distanceMeters:0),0);
    const duration=known.reduce((n,l)=>n+(Number.isFinite(l.result.durationSeconds)?l.result.durationSeconds:0),0);
    const hasRoutes=known.length>0;
    const checking=/正在核验/.test($('#traffic-verification-text')?.textContent||'');
    $('#wb-map-summary').innerHTML=hasRoutes
      ?`<strong>${known.length}/${total||known.length} 段已查</strong> · ${esc(formatDistance(distance))} · 约 ${esc(formatDuration(duration))}${missing?` · ${missing} 段待查询`:''}`
      :checking?'正在查询高德路线…':'<strong>路线待查询</strong> · 地图先显示已确认点位';
    const fixed=days.reduce((n,d)=>n+(d.points?.length||0),0);
    const expected=shown.reduce((n,d)=>n+dayEntries(p.days[d.dayNumber-1]).length,0);
    $('#wb-coordinate-note').textContent=fixed<expected?`${expected-fixed} 个地点还未确认地图位置；道路只显示已查到的路段。`:'地图点位为高德 POI / 地区参考；未查到的路段不画线，标为待查询。';
    root.RoamWorkbenchMap?.render(container,{
      days, mode:mapMode, activeDay:activeDay+1, activeKey:selectedKey,
      onMarker(dayNumber,key){selectDay(dayNumber-1,{single:true});selectStop(dayNumber-1,key,{fromMap:true});}
    });
  }

  function scheduleEnsure(p){
    if(p.days.every(day=>day.type==='transfer'||routeCache.has(day.dayNumber)||dayEntries(day).length<2))return;
    window.clearTimeout(ensureTimer);
    ensureTimer=window.setTimeout(()=>{
      if(plan!==p||!plan)return;
      const status=$('#traffic-verification-text')?.textContent||'';
      if(/正在核验/.test(status))return;
      ensureMissing(p);
    },1200);
  }

  async function ensureMissing(p){
    if(!root.RoamTrafficService||!p)return;
    for(const day of p.days){
      if(day.type==='transfer'||routeCache.has(day.dayNumber)||routePending.has(day.dayNumber))continue;
      if(dayEntries(day).length<2)continue;
      routePending.add(day.dayNumber);
      try{
        const result=await root.RoamTrafficService.checkDay(p,day,{});
        if(plan!==p)return;
        routeCache.set(day.dayNumber,{points:result.points,legs:result.legs,fingerprint:result.traffic?.fingerprint||fingerprint(day)});
        renderCanvas(plan);renderMap(plan);
      }catch{}
      finally{routePending.delete(day.dayNumber);}
    }
  }

  function setDayRoutes(p,dayNumber,points,legs){
    if(!p)return;
    if(cachePlan!==p){cachePlan=p;routeCache.clear();}
    routeCache.set(Number(dayNumber),{points:points||[],legs:legs||[],fingerprint:T()?.fingerprint(p.days[Number(dayNumber)-1],p.settings)||''});
    if(plan===p){renderCanvas(p);renderMap(p);}
  }

  function render(p){
    if(!p||!$('#result-section')||$('#result-section').hidden)return;
    if(cachePlan!==p||plan!==p){cachePlan=p;routeCache.clear();routePending.clear();}
    plan=p;
    activeDay=Math.min(Math.max(Number(p.activeDay)||0,0),p.days.length-1);
    if(!p.days[activeDay])activeDay=0;
    p.activeDay=activeDay;
    renderTop(p);renderAssistant(p);renderCanvas(p);renderMap(p);scheduleEnsure(p);
  }

  function selectDay(index,{single=true,scroll=true}={}){
    if(!plan||!plan.days[index])return;
    setActive(index);
    if(single)mapMode='single';
    selectedKey=null;
    renderCanvas(plan);renderMap(plan);
    if(scroll){
      const column=$(`[data-day-column="${plan.days[index].dayNumber}"]`);
      column?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
    }
  }

  function selectStop(dayIndex,key,{fromMap=false}={}){
    if(!plan)return;
    setActive(dayIndex);selectedKey=key;
    renderCanvas(plan);
    if(!fromMap&&mapMode==='single')renderMap(plan);
    root.RoamWorkbenchMap?.focus(key);
    const card=$(`.wb-stop-card[data-key="${CSS.escape(key)}"]`);
    card?.classList.add('is-selected');
  }

  function handleCardAction(action,card){
    if(!plan)return;
    const dayIndex=Number(card.dataset.day)-1,day=plan.days[dayIndex],key=card.dataset.key;
    const entry=dayEntries(day).find(e=>e.key===key);
    if(!entry)return;
    setActive(dayIndex);
    if(action==='time'){UI()?.openTiming(key);return;}
    if(action==='bind'&&entry.spot){
      root.RoamPlaceSearch?.bind(entry.spot,poi=>{
        const next=JSON.parse(JSON.stringify(plan));
        next.settings.poiBindings=P()?.normalizeBindings({...next.settings.poiBindings,[entry.spot.id]:poi})||next.settings.poiBindings;
        C()?.update(next,'确认地图位置：'+entry.name);
      });
      return;
    }
    if(action==='up'||action==='down'){
      const spotIndex=day.stops.indexOf(entry.id);
      C()?.actions?.moveStop(spotIndex,action==='up'?-1:1);return;
    }
    if(action==='remove'){
      if(entry.type==='personal')C()?.actions?.removePersonal(entry.place.id);
      else C()?.actions?.removeStop(entry.id);
      return;
    }
    if(action==='edit-personal'){root.RoamPlaceSearch?.edit(entry.place);return;}
    if(action==='remove-personal'){C()?.actions?.removePersonal(entry.place.id);return;}
    if(action==='defer'){
      if(entry.type==='attraction')C()?.update(M().defer(plan,entry.id),'移回待安排');
      return;
    }
    if(action==='move-day'){
      const value=Number(card.querySelector('[data-act="move-day"]')?.value);
      if(Number.isInteger(value)&&value!==dayIndex)C()?.actions?.moveToDay(entry.id,value);
    }
  }

  function handleDayAction(action,index){
    if(!plan)return;
    setActive(index);
    if(action==='note')UI()?.editDay();
    if(action==='add')UI()?.openCatalogue();
  }

  function exportTrip(){
    const t=trip(), full=t?L()?.get(t.id):null;
    if(!full){C()?.notify('当前行程还没有可导出的记录。');return;}
    const blob=new Blob([JSON.stringify(full,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=(String(full.title||'云南旅行').replace(/[\\/:*?"<>|]/g,'_'))+'.json';
    a.click();setTimeout(()=>URL.revokeObjectURL(url),800);
  }

  function undo(){
    const t=trip();if(!t)return;
    const full=L()?.get(t.id),history=full?.history||[];
    if(!history.length){C()?.notify('还没有可撤销的版本。');return;}
    C()?.restore(history.length-1);
  }

  function updateCollapse(){
    const shell=$('#workbench-shell');if(!shell)return;
    shell.classList.toggle('assistant-collapsed',assistantCollapsed);
    shell.classList.toggle('map-collapsed',mapCollapsed);
    $('#toggle-assistant').textContent=assistantCollapsed?'展开':'收起';
    $('#toggle-assistant').setAttribute('aria-expanded',String(!assistantCollapsed));
    $('#toggle-map').textContent=mapCollapsed?'展开':'收起';
    $('#toggle-map').setAttribute('aria-expanded',String(!mapCollapsed));
    setTimeout(()=>root.RoamWorkbenchMap?.resize(),320);
  }

  function bind(){
    if(booted)return;booted=true;
    $('#toggle-assistant').addEventListener('click',()=>{assistantCollapsed=!assistantCollapsed;updateCollapse();});
    $('#toggle-map').addEventListener('click',()=>{mapCollapsed=!mapCollapsed;updateCollapse();});
    $('#map-mode-all').addEventListener('click',()=>{mapMode='all';renderMap(plan);});
    $('#map-mode-single').addEventListener('click',()=>{mapMode='single';renderMap(plan);});
    $('#wb-undo').addEventListener('click',undo);
    $('#wb-export').addEventListener('click',exportTrip);
    $('#wb-add-place').addEventListener('click',()=>UI()?.openCatalogue());
    $('#wb-add-personal').addEventListener('click',()=>root.RoamPlaceSearch?.open('hotel'));
    $('#wb-ai-adjust').addEventListener('click',()=>C()?.notify('AI 修改会先展示方案，下一轮接入。'));
    $('#wb-map-legend').addEventListener('click',event=>{
      const button=event.target.closest('[data-map-day]');if(!button)return;
      selectDay(Number(button.dataset.mapDay)-1,{single:true});
    });
    $('#day-canvas').addEventListener('click',event=>{
      const dayAction=event.target.closest('[data-day-act]');if(dayAction){event.preventDefault();handleDayAction(dayAction.dataset.dayAct,Number(dayAction.dataset.day));return;}
      const action=event.target.closest('[data-act]');
      const card=event.target.closest('.wb-stop-card');
      if(action&&card){
        if(action.tagName==='SELECT')return;
        event.preventDefault();handleCardAction(action.dataset.act,card);return;
      }
      const head=event.target.closest('[data-day-select]');
      if(head){selectDay(Number(head.dataset.daySelect),{single:true});return;}
      if(card){selectStop(Number(card.dataset.day)-1,card.dataset.key);}
    });
    $('#day-canvas').addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      const head=event.target.closest('[data-day-select]');
      if(head){event.preventDefault();selectDay(Number(head.dataset.daySelect),{single:true});return;}
      const card=event.target.closest('.wb-stop-card');
      if(card&&event.target===card){event.preventDefault();selectStop(Number(card.dataset.day)-1,card.dataset.key);}
    });
    $('#day-canvas').addEventListener('change',event=>{
      const select=event.target.closest('[data-act="move-day"]');
      if(!select)return;
      const card=select.closest('.wb-stop-card');if(card)handleCardAction('move-day',card);
    });
    $('#day-canvas').addEventListener('scroll',()=>{scrollLeft=$('#day-canvas').scrollLeft;},{passive:true});
    window.addEventListener('resize',()=>{root.RoamWorkbenchMap?.resize();});
    // The three-column desktop surface is intentionally open wide; on a smaller window the rails become compact.
    if(innerWidth<1160){assistantCollapsed=true;mapCollapsed=false;}
    if(innerWidth<980){assistantCollapsed=true;mapCollapsed=true;}
    updateCollapse();
  }

  function boot(){
    if(!$('#result-section')||!$('#day-canvas'))return;
    bind();
    const p=C()?.context().plan;
    if(p&&document.body.dataset.plannerView==='result')render(p);
  }

  window.RoamWorkbench={render,setDayRoutes,selectDay,selectStop,renderMap};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);
