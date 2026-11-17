/* Daily itinerary editing, POI resolution and road legs share a single render version. */
(function(root){
  'use strict';
  const $=s=>document.querySelector(s),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const modes={walk:'步行',drive:'自驾 / 打车',public:'公共交通'};
  function renderDay(plan,actions){
    const day=plan.days[plan.activeDay],panel=$('#day-itinerary'),A=root.RoamAttractions,P=root.RoamPersonalPlaces,J=root.RoamJourneyRouting;
    const token=String(Number(panel.dataset.viewVersion||0)+1);panel.dataset.viewVersion=token;const current=()=>panel.dataset.viewVersion===token&&document.body.dataset.plannerView==='result';
    panel.replaceChildren();panel.setAttribute('aria-labelledby','result-day-'+plan.activeDay);
    const entries=root.RoamTraffic.entries(day,plan.settings);
    const intro=make('div','day-intro');intro.append(make('h2','',day.theme||day.zone),make('p','day-overview-line',entries.length+' 个停留点 · '+(day.type==='transfer'?'以转场为主':day.zone)));panel.append(intro);
    if(day.stops.some(id=>A.get(id).kind.some(k=>['hike','highland'].includes(k))))panel.append(make('p','day-important-note','含高海拔或徒步活动：景区接驳、预约和个人体力需另行确认。'));
    const note=make('details','day-arrangement-note');note.append(make('summary','','当天安排与提醒'));
    const ai=plan.ai?.dayNotes?.find(item=>item.dayNumber===day.dayNumber);note.append(make('p','',(ai&&plan.ai.edited?'原AI方案说明（行程已调整）：':'')+(ai?.reason||day.why||'按你的选择安排，开放和交通需出发前确认。')));
    const feasibility=make('section','traffic-assessment');feasibility.id='day-traffic-assessment';feasibility.setAttribute('aria-label','当天时间与交通核验');intro.after(feasibility);
    renderAssessment(plan,day,feasibility,actions);
    if(day.mobilityNote)note.append(make('p','',day.mobilityNote));if(day.buffer)note.append(make('p','',day.buffer));panel.append(note);
    const list=make('ol','daily-stops');panel.append(list);const legViews=[];let activeKey=null;
    function selectEntry(key){activeKey=key;for(const row of list.querySelectorAll('.daily-stop'))row.classList.toggle('is-map-selected',row.dataset.entryKey===key);root.RoamTravelMap.focus($('#travel-map'),key);}
    function bind(spot){root.RoamPlaceSearch.bind(spot,poi=>{if(!current())return;actions.setBinding(spot.id,poi);actions.rerender();});}
    entries.forEach((entry,index)=>{
      const row=make('li','daily-stop'+(entry.type==='personal'?' personal-stop':''));row.dataset.entryKey=entry.key;
      const number=make('span','stop-index',String(index+1).padStart(2,'0')),card=make('article',entry.type==='attraction'?'daily-stop-card':'personal-stop-card');card.tabIndex=0;card.setAttribute('aria-label','在地图上查看'+entry.name);
      card.addEventListener('click',event=>{if(!event.target.closest('button,select,a,summary,details'))selectEntry(entry.key);});card.addEventListener('keydown',event=>{if(event.target===card&&event.key==='Enter')selectEntry(entry.key);});
      const copy=make('div','stop-card-copy'),controls=make('div','stop-controls');
      if(entry.type==='attraction'){
        const spot=entry.spot,photo=root.RoamAttractionPhotos?.[spot.id];if(photo){const image=make('img');image.src='/'+photo.src;image.alt=photo.subject||spot.name;image.loading='lazy';card.append(image);}
        copy.append(make('span','stop-kind',plan.settings.mustVisit.includes(spot.id)?'★ 必去':plan.settings.selected.includes(spot.id)?spot.zone:'AI 补充 · '+spot.zone),make('h3','',spot.name),make('small','',spot.estimate?`游览参考 ${spot.estimate.min}–${spot.estimate.max} 分钟`:'游览时长按实际情况安排'));
        const detail=make('details','stop-more');detail.append(make('summary','','介绍与来源'),make('p','',spot.intro));
        if(spot.caution)detail.append(make('p','stop-alert',spot.caution));
        if(photo){const credit=make('a','stop-photo-credit',photo.author+' · '+photo.license+' ↗');credit.href=photo.source;credit.target='_blank';credit.rel='noopener noreferrer';detail.append(credit);}copy.append(detail);
        const location=make('button','stop-location-action','确认地图位置');location.type='button';location.dataset.bindingFor=spot.id;location.addEventListener('click',()=>bind(spot));copy.append(location);
        for(const [text,label,disabled,action]of [['↑','上移'+spot.name,entry.index===0,()=>actions.moveStop(entry.index,-1)],['↓','下移'+spot.name,entry.index===day.stops.length-1,()=>actions.moveStop(entry.index,1)],['移除','移除'+spot.name,false,()=>actions.removeStop(spot.id)]]){const b=make('button','',text);b.type='button';b.disabled=disabled;b.setAttribute('aria-label',label);b.addEventListener('click',action);controls.append(b);}
        const move=make('select','move-stop-day');move.setAttribute('aria-label','调整'+spot.name+'所在日期');
        plan.days.forEach((d,i)=>{const option=make('option','','Day '+String(i+1).padStart(2,'0'));option.value=String(i);option.selected=i===plan.activeDay;move.append(option);});move.addEventListener('change',()=>actions.moveToDay(spot.id,Number(move.value)));controls.append(move);
      }else{
        const p=entry.place;copy.append(make('span','stop-kind',entry.role==='start'?'酒店出发':entry.role==='end'?'返回酒店':P.label(p)),make('h3','',p.name),make('small','',p.address||p.city));
        const edit=make('button','','调整'),remove=make('button','','移除');edit.type=remove.type='button';edit.addEventListener('click',()=>root.RoamPlaceSearch.edit(p));remove.addEventListener('click',()=>actions.removePersonal(p.id));controls.append(edit,remove);
      }
      card.append(copy,controls);row.append(number,card);list.append(row);
      if(index<entries.length-1){const leg=make('li','route-leg'),text=make('span','route-leg-text','正在查询交通…'),select=make('select','route-leg-mode');select.setAttribute('aria-label','从'+entry.name+'到'+entries[index+1].name+'的交通方式');for(const[mode,label]of Object.entries(modes)){const option=make('option','',label);option.value=mode;select.append(option);}select.disabled=true;leg.append(make('span','route-leg-line','↓'),text,select);list.append(leg);legViews.push({node:leg,text,select,from:entry,to:entries[index+1],result:null});}
    });
    if(!entries.length)list.append(make('li','empty-day-edit','这一天留给休息与转场。可以调整地点，或添加酒店和餐厅。'));
    const routeOrder=$('#route-order');routeOrder.replaceChildren();
    $('#overview-heading').textContent='这一天，怎么走';$('#overview-day').textContent='Day '+String(day.dayNumber).padStart(2,'0');
    $('#coordinate-note').textContent='正在匹配具体地点并查询道路信息…';$('#travel-map').dataset.area=day.area||plan.settings.area;
    const routeSummary=make('p','route-overview-summary');routeSummary.id='route-overview-summary';routeSummary.textContent='查询地点与交通中';routeOrder.append(routeSummary);
    const refresh=make('button','refresh-day-routes','重新查询交通');refresh.type='button';refresh.addEventListener('click',()=>actions.refreshTraffic());routeOrder.append(refresh);
    const dataNote=make('details','route-data-note');dataNote.append(make('summary','','点位与交通说明'),make('p','','地图位置来自高德 POI，是地点参考位置，未核实景区开放入口。距离和耗时只来自高德道路查询，属于当前估算；景区内部步行、索道与接驳另算。未查到的路段不填数字、不画直线冒充道路。'));routeOrder.append(dataNote);
    let points=[];
    function draw(){if(!current())return;root.RoamTravelMap.renderRoad($('#travel-map'),points,legViews,key=>{selectEntry(key);const selected=[...list.querySelectorAll('.daily-stop')].find(n=>n.dataset.entryKey===key);selected?.scrollIntoView({block:'nearest',behavior:'smooth'});});
      const known=legViews.filter(l=>['ok','same'].includes(l.result?.status));const meters=known.reduce((n,l)=>n+l.result.distanceMeters,0);routeSummary.textContent=known.length?`${known.length}/${legViews.length} 段已查 · 已查路段约 ${J.distance(meters)}`:legViews.length?'部分点位或交通待确认':'当天地点已标记';
      const road=legViews.some(l=>l.result?.paths?.length);$('.route-preview-disclaimer').textContent=road?(known.length===legViews.length?'高德道路路径 · 当前查询估算':'已显示高德道路路径 · 未查路段待确认'):'地点位置预览 · 尚无可用道路路径';
      if(activeKey)root.RoamTravelMap.focus($('#travel-map'),activeKey);
    }
    draw();
    async function queryLeg(leg,mode){
      if(!current())return;leg.text.textContent='正在查询交通…';leg.select.disabled=true;
      const version=Number(leg.version||0)+1;leg.version=version;leg.pending=true;leg.result=null;
      if(mode)actions.setLegMode(root.RoamTraffic.legKey(day,leg.from,leg.to),mode);
      const from=points.find(p=>p.key===leg.from.key)?.poi,to=points.find(p=>p.key===leg.to.key)?.poi;
      const selectedMode=mode||plan.settings.legModes?.[root.RoamTraffic.legKey(day,leg.from,leg.to)];
      const result=selectedMode?await J.route(from,to,selectedMode):await J.recommend(from,to,plan.settings.transport);if(!current()||leg.version!==version)return;
      leg.pending=false;leg.result=result;leg.select.disabled=!from||!to;leg.select.value=result.mode||'drive';
      if(result.status==='ok'){leg.text.textContent=(result.recommended?'建议':'')+modes[result.mode]+' · '+J.distance(result.distanceMeters)+' · 约'+J.duration(result.durationSeconds);leg.node.dataset.routeSource=result.source;}
      else if(result.status==='same')leg.text.textContent='同一地点，无需转场';
      else leg.text.textContent=result.status==='missing'?'先确认两端地图位置，再查询距离':result.message||'交通信息暂未查到';
      draw();
      if(legViews.every(l=>l.result&&!l.pending)){actions.setTraffic(root.RoamTraffic.evidence(day,plan.settings,legViews));renderAssessment(plan,day,feasibility,actions);}
    }
    legViews.forEach(leg=>leg.select.addEventListener('change',()=>queryLeg(leg,leg.select.value)));
    (async()=>{
      for(const entry of entries){
        if(!current())return;
        const poi=entry.type==='personal'?entry.place:await J.resolveSpot(entry.spot,plan.settings.poiBindings||{});if(!current())return;
        if(poi){points.push({key:entry.key,index:entry.indexInDay,name:entry.name,poi});if(entry.type==='attraction'){actions.setBinding(entry.id,poi);const button=panel.querySelector('[data-binding-for="'+entry.id+'"]');if(button){button.textContent='已定位 · 更换点位';button.classList.add('is-resolved');}}}
      }
      if(!current())return;
      const missing=entries.filter(e=>!points.some(p=>p.key===e.key)).length;$('#coordinate-note').textContent=missing?`${missing} 个地点需要确认地图位置；可在左侧卡片确认。`:'已匹配地图参考点。距离和耗时为高德当前道路估算。';
      draw();
      // Bound concurrency keeps public-map quotas and low-end browsers usable.
      let cursor=0;await Promise.all([0,1].map(async()=>{while(cursor<legViews.length&&current()){const leg=legViews[cursor++];await queryLeg(leg);}}));
      if(current()&&!legViews.length){actions.setTraffic(root.RoamTraffic.evidence(day,plan.settings,[]));renderAssessment(plan,day,feasibility,actions);}
    })().catch(()=>{if(current()){$('#coordinate-note').textContent='地图服务暂不可用，地点仍保留。可以稍后重新查询。';for(const leg of legViews)leg.text.textContent='交通暂未查到';}});
  }
  function renderAssessment(plan,day,target,actions){
    const F=root.RoamTraffic,a=F.assess(plan,day);target.replaceChildren();target.dataset.status=a.status;
    target.append(make('h3','',a.label));if(['empty','transfer'].includes(a.status)){a.notes.forEach(text=>target.append(make('p','',text)));return;}
    const fmt=n=>{const h=Math.floor(n/60),m=n%60;return(h?h+'小时':'')+(m?m+'分钟':'')||'0分钟';};
    target.append(make('p','',`当天可用 ${fmt(a.usableMinutes)} · ${a.complete?'预计合计':'已知部分'} ${fmt(a.minimumMinutes)}–${fmt(a.maximumMinutes)}`));
    target.append(make('p','',`游览 ${a.visitMin}–${a.visitMax} 分钟 · ${a.knownLegs?'已查交通 '+a.roadMinutes+' 分钟':'交通待确认'}（${a.knownLegs}/${a.totalLegs} 段）`));
    const bar=make('div','traffic-budget');for(const[cls,n]of [['budget-visit',a.visitMin],['budget-road',a.roadMinutes],['budget-rest',a.mealMinutes+a.restMinutes+a.bufferMinutes]]){const span=make('span',cls);span.style.width=Math.min(100,n/Math.max(a.minimumMinutes,a.usableMinutes,1)*100)+'%';bar.append(span);}target.append(bar);
    target.append(make('p','',`用餐 ${a.mealMinutes} 分钟 · 休息 ${a.restMinutes} 分钟 · 机动 ${a.bufferMinutes} 分钟（编辑预留）`));
    const immediate=a.notes.filter(n=>!n.startsWith('游览、')&&!n.startsWith('每处餐厅'));immediate.forEach(text=>target.append(make('p','',text)));
    const details=make('details');details.append(make('summary','','查看依据与核验时间'));a.notes.filter(n=>!immediate.includes(n)).forEach(n=>details.append(make('p','',n)));if(a.checkedAt)details.append(make('p','',`核验于 ${new Date(a.checkedAt).toLocaleString('zh-CN')} · 道路记录 30 分钟后重新查询。`));target.append(details);
    if(['over','tight'].includes(a.status)){
      const options=F.suggestions(plan,day),buttons=make('div','traffic-suggestions');
      for(const option of options){const b=make('button','',option.label);b.type='button';b.addEventListener('click',()=>actions.applyTrafficSuggestion(option));buttons.append(b);}
      const edit=make('button','','增加天数 / 调整地点');edit.type='button';edit.addEventListener('click',actions.editPlan);buttons.append(edit);target.append(buttons,make('p','traffic-suggestion-note',options.length?'点击后才应用；必去景点与酒店保持，调整后重新查询交通。':'没有可自动删减的普通景点；请增加天数或自行调整必去选择。'));
    }
  }
  root.RoamPlannerView=Object.freeze({renderDay,renderAssessment});
})(window);
