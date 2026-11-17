(function(){
  'use strict';
  const P=window.TripPlanner;
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const state={plan:[],settings:null,activeDay:0,view:'all',mapScale:1,mapOffset:{x:0,y:0},saved:[],replaceTarget:null,dragIndex:null};
  const storageKey='roam.yunnan.saved.v2';
  let rerunAfterConfirm=null,toastTimer=null;
  function loadSaved(){try{const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');state.saved=Array.isArray(raw)?raw.filter(t=>t&&typeof t.title==='string'&&typeof t.meta==='string'&&t.settings&&P.cities.some(c=>c.name===t.settings.city)&&typeof t.settings.startDate==='string'&&Array.isArray(t.settings.interests)&&Array.isArray(t.plan)&&t.plan.length>=1&&t.plan.length<=3&&t.plan.every(d=>d&&P.cities.some(c=>c.id===d.cityId&&c.name===t.settings.city)&&Array.isArray(d.stops)&&d.stops.every(id=>P.byId[id]&&P.byId[id].cityId===d.cityId))):[]}catch{state.saved=[]}updateSavedCount()}
  function updateSavedCount(){$('#saved-count').textContent=String(state.saved.length)}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state.saved));return true}catch{return false}}
  function showToast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2400)}
  function icon(id){return `<svg aria-hidden="true"><use href="#i-${id}"></use></svg>`}
  function slugLabel(kind){return kind==='nature'?'自然风景':kind==='culture'?'人文漫步':'美食休闲'}
  function interestsText(list){return list.map(x=>({nature:'自然风景',food:'城市烟火',culture:'人文艺术'}[x])).join('、')||'自由探索'}
  function collectSettings(){
    const start=$('#start-date').value;
    if(!start){$('#form-status').textContent='选一个出发日期，开始计划吧。';$('#start-date').focus();return null}
    const selected=$$('input[name=interest]:checked').map(x=>x.value);
    return {city:$('#city').value,days:Number($('#days').value),people:Number($('#people').value),pace:$('#pace').value,budget:Number($('#budget').value),interests:selected,startDate:start};
  }
  function onGenerate(e){e.preventDefault();const settings=collectSettings();if(!settings)return;if(state.plan.length){rerunAfterConfirm=()=>generate(settings);$('#confirm-dialog').showModal();return}generate(settings)}
  function generate(settings){state.settings=settings;state.plan=P.generate(settings);state.activeDay=0;state.mapScale=1;state.mapOffset={x:0,y:0};render();$('#confirm-dialog').close();showToast(`${settings.city}行程已生成，看看有没有想调整的地方。`)}
  function render(){renderHeader();renderStats();renderMap();renderTabs();renderDay();}
  function renderHeader(){
    const s=state.settings;const d0=P.dayDate(s.startDate,0);const d1=P.dayDate(s.startDate,Math.max(0,s.days-1));
    const city=P.getCity(s.city);
    $('#trip-title').textContent=`${city.name} · ${city.theme}`;
    $('#trip-meta').textContent=`${s.days} 天 · ${d0} - ${d1}　·　${s.people} 位旅人　·　${interestsText(s.interests)}`;
  }
  function allSchedules(){return state.plan.map(d=>P.schedule(d,state.settings.pace))}
  function renderStats(){
    const ds=allSchedules();const total=ds.reduce((a,d)=>a+d.cost,0);const stops=ds.reduce((a,d)=>a+d.rows.length,0);const km=ds.reduce((a,d)=>a+d.km,0);
    const metrics=[['游览地点',String(stops),'站'],['相邻地点直线合计',km.toFixed(1),'公里'],['示例人均费用',String(total),'元']];
    $('#stats').innerHTML=metrics.map(([label,value,unit])=>`<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}<small>${unit}</small></div></div>`).join('');
    $('#budget-value').value=$('#budget').value;
    const tooMuch=total>state.settings.budget;
    const info=$('#budget');info.setAttribute('aria-valuetext',`每人预算 ${state.settings.budget} 元`);
    $('#form-status').textContent=tooMuch?`示例估算 ¥${total}，超出目标约 ¥${total-state.settings.budget}；可减少收费景点或调整预算。`:'修改偏好后，点击重新规划';
  }
  function routePoints(){
    return P.mapPoints(state.plan);
  }
  function renderMap(){
    const svg=$('#route-map'), pts=routePoints();
    const land=`<defs><pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e1e8d9" stroke-width="1"/></pattern></defs><rect width="960" height="400" fill="#eff2e6"/><rect width="960" height="400" fill="url(#map-grid)"/><path d="M0 355Q110 235 240 340T540 337T960 315V400H0Z" fill="#e1e9d8" opacity=".55"/><path d="M0 385Q90 312 230 360T540 358T960 348" fill="none" stroke="#cedcc4" stroke-width="1"/><text x="35" y="36" font-size="9" letter-spacing="2" fill="#a2b094">YUNNAN · ROUTE SKETCH</text>`;
    let paths='';
    for(let day=0;day<state.plan.length;day++){
      const subset=state.plan[day].stops.map(id=>pts.find(p=>p.id===id)).filter(Boolean);
      if(subset.length<2)continue;
      const coords=subset.map(p=>`${p.x},${p.y}`).join(' ');
      paths+=`<polyline points="${coords}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${coords}" fill="none" stroke="${['#67845c','#bb895d','#7b7890'][day%3]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 7"/>`;
    }
    const marks=pts.map((p,i)=>`<g class="map-point" tabindex="0" role="button" data-id="${p.id}" aria-label="${p.index}. ${p.name}，第 ${p.day+1} 天"><circle cx="${p.x}" cy="${p.y}" r="15" fill="#fff" opacity=".78"/><circle cx="${p.x}" cy="${p.y}" r="10" fill="${['#67845c','#bb895d','#7b7890'][p.day%3]}" stroke="#fff" stroke-width="2.4"/><text x="${p.x}" y="${p.y+3.2}" text-anchor="middle" font-size="8.5" font-family="Arial" font-weight="600" fill="#fff">${i+1}</text></g>`).join('');
    const labels=pts.map((p,i)=>{const dx=p.x>745?-9:10;const anchor=p.x>745?'end':'start';return `<text x="${p.x+dx}" y="${p.y-13}" text-anchor="${anchor}" font-family="Microsoft YaHei,sans-serif" font-size="10" fill="#58705c" paint-order="stroke" stroke="#eff2e6" stroke-width="3">${p.name}</text>`}).join('');
    svg.innerHTML=`<g class="map-world">${land}${paths}${marks}${labels}</g>`;
    const city=P.getCity(state.settings.city);$('#map-city-en').textContent=city.english;$('#map-city-name').textContent=`${city.name} · 云南`;svg.setAttribute('aria-label',`${city.name}行程路线示意图，非真实地图`);
    $('#map-legend').innerHTML=state.plan.map((d,i)=>`<span class="legend-item"><i style="background:${['#67845c','#bb895d','#7b7890'][i%3]}"></i>第 ${i+1} 天</span>`).join('');
    const g=svg.querySelector('.map-world');g.setAttribute('transform',`translate(${state.mapOffset.x} ${state.mapOffset.y}) scale(${state.mapScale})`);
    svg.querySelectorAll('.map-point').forEach(node=>{node.addEventListener('click',()=>showMapPoint(node.dataset.id));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showMapPoint(node.dataset.id)}})});
    $('#map-tooltip').hidden=true;
  }
  function showMapPoint(id){const p=P.byId[id],day=state.plan.findIndex(d=>d.stops.includes(id));const s=P.schedule(state.plan[day],state.settings.pace).rows.find(x=>x.id===id);const el=$('#map-tooltip');el.innerHTML=`<strong>第 ${day+1} 天 · ${p.name}</strong><small>${P.clock(s.start)} 抵达 · ${p.label}</small>`;el.hidden=false;}
  function renderTabs(){$('#day-tabs').innerHTML=state.plan.map((d,i)=>`<button class="day-tab ${i===state.activeDay?'active':''}" role="tab" aria-selected="${i===state.activeDay}" id="day-tab-${i}" aria-controls="day-content" data-day="${i}"><b>DAY ${String(i+1).padStart(2,'0')}</b><span>${P.dayDate(state.settings.startDate,i)}</span></button>`).join('');$$('.day-tab').forEach(b=>b.addEventListener('click',()=>{state.activeDay=Number(b.dataset.day);renderTabs();renderDay()}));}
  function renderDay(){
    const day=state.plan[state.activeDay],data=P.schedule(day,state.settings.pace),target=$('#day-content');
    target.setAttribute('aria-labelledby',`day-tab-${state.activeDay}`);
    if(!day.stops.length){target.innerHTML=`<div class="empty-day">今天的安排还留着一片空白。<button class="secondary-btn" id="add-stop">＋ 添加一站</button></div>`;$('#add-stop').addEventListener('click',()=>openAdd());return}
    const date=P.dayDate(state.settings.startDate,state.activeDay);
    const rows=data.rows;
    const cards=rows.map((p,i)=>{
      const first=i===0;const mins=p.duration;
      const transfer=first?'':`<div class="travel-line">示例交通约 ${p.travel} 分钟${p.travel>=25?' · 建议留意实际路况':''}</div>`;
      const lunch=i===2?'<div class="lunch-note">⟡ 给自己留一段午餐与休息时间</div>':'';
      return `${transfer}${lunch}<div class="stop-wrap"><div class="timeline-rail"><span class="time">${P.clock(p.start)}</span></div><article class="stop-card" draggable="true" data-index="${i}"><div class="stop-art ${p.kind}" aria-hidden="true">${sceneArt(p)}</div><div class="stop-body"><span class="stop-label">${p.label}</span><h4>${p.name}</h4><p class="stop-description">${p.description}</p><div class="stop-metadata"><span>${icon('clock')}约 ${mins} 分钟</span><span>门票示例 ¥${p.fee}</span></div></div><div class="stop-actions"><button class="replace-btn" data-index="${i}" title="替换景点">${icon('refresh')}替换</button><div class="order-actions"><button data-move="up" data-index="${i}" aria-label="上移景点" title="上移" ${i===0?'disabled':''}>↑</button><button data-move="down" data-index="${i}" aria-label="下移景点" title="下移" ${i===rows.length-1?'disabled':''}>↓</button><button class="delete-stop" data-index="${i}" aria-label="移除景点" title="移除">×</button></div></div></article></div>`;
    }).join('');
    const total=allSchedules().reduce((sum,s)=>sum+s.cost,0);
    const over=total>state.settings.budget;
    const note=over?`<div class="day-note warn">${icon('spark')}<span>全程示例估算约 ¥${total} / 人，高于目标预算 ¥${state.settings.budget}。可替换收费景点。所有金额均非实时价格。</span></div>`:`<div class="day-note">${icon('spark')}<span>今日费用示例：门票 ¥${data.tickets} ＋ 餐饮 ¥${data.food} ＋ 市内交通 ¥${data.transit} / 人。时间和金额仅供体验。</span></div>`;
    const late=data.end>19*60?`<div class="day-note warn">${icon('clock')}<span>今天的安排预计超过 19:00，建议减少地点或缩短游览时间。此版本尚未检查实际营业时间。</span></div>`:'';
    target.innerHTML=`<div class="day-overview"><div><h3>${date} · ${day.title}</h3><p>${day.subtitle}</p></div><span class="day-total">${rows.length} 站 · 约 ${P.clock(data.end)} 结束</span></div><div class="timeline">${cards}</div>${rows.length<6?`<button class="replace-btn" id="add-stop">＋ 添加一站</button>`:''}${note}${late}`;
    $$('.replace-btn[data-index]').forEach(b=>b.addEventListener('click',()=>openReplace(Number(b.dataset.index))));
    $$('.order-actions button[data-move]').forEach(b=>b.addEventListener('click',()=>moveStop(Number(b.dataset.index),b.dataset.move==='up'?-1:1)));
    $$('.delete-stop').forEach(b=>b.addEventListener('click',()=>deleteStop(Number(b.dataset.index))));
    const add=$('#add-stop');if(add)add.addEventListener('click',openAdd);
    setupDrag();
  }
  function sceneArt(p){
    const open='<svg viewBox="0 0 80 80" aria-hidden="true">';
    if(p.kind==='nature')return `${open}<path d="M0 55Q20 43 39 54T80 48v32H0Z" fill="#d4e1d1"/><path d="M0 65Q23 58 43 64T80 59" fill="none" stroke="#92ad98"/><circle cx="57" cy="22" r="10" fill="#e6dfc0"/><path d="M19 55V31m0 0-10 15h10m0-15 10 15H19m40 15V27m0 0-11 16h11m0-16 11 16H59" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M31 69q10-5 20 0" fill="none" stroke="#a3b997"/></svg>`;
    if(p.kind==='food')return `${open}<path d="M12 62h58M20 63V36h42v27M18 35l4-15h38l4 15z" fill="#fff9ef" stroke="currentColor"/><path d="M27 45h9v18h-9zm21 0h9v18h-9zM30 20v12m14-12v12m14-12v12" fill="none" stroke="currentColor"/><path d="M5 68q15-6 27 0t43 0M9 17h12" fill="none" stroke="#d7b78c"/></svg>`;
    return `${open}<path d="M14 64h54M20 64V27h40v37M16 27h48L40 12z" fill="#f8f5e8" stroke="currentColor"/><path d="M31 64V45h18v19M27 34h6m13 0h6m-25 8h6m13 0h6" fill="none" stroke="currentColor"/><circle cx="40" cy="23" r="2" fill="#cfb982"/></svg>`;
  }
  function moveStop(index,delta){const ids=state.plan[state.activeDay].stops,target=index+delta;if(target<0||target>=ids.length)return;[ids[index],ids[target]]=[ids[target],ids[index]];render();showToast('已更新地点顺序。')}
  function deleteStop(index){state.plan[state.activeDay].stops.splice(index,1);render();showToast('已移除地点，路线信息已更新。')}
  function setupDrag(){
    $$('.stop-card').forEach(card=>{
      card.addEventListener('dragstart',e=>{state.dragIndex=Number(card.dataset.index);card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(state.dragIndex))});
      card.addEventListener('dragend',()=>{$$('.stop-card').forEach(c=>c.classList.remove('dragging','drag-over'));state.dragIndex=null});
      card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over')});
      card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
      card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drag-over');const from=state.dragIndex,to=Number(card.dataset.index);if(from===null||from===to)return;const ids=state.plan[state.activeDay].stops;const [item]=ids.splice(from,1);ids.splice(to,0,item);render();showToast('路线顺序已更新。')});
    });
  }
  function openReplace(index){state.replaceTarget=index;showAlternatives(false)}
  function openAdd(){state.replaceTarget=null;showAlternatives(true)}
  function showAlternatives(add){
    const index=state.replaceTarget;const day=state.plan[state.activeDay];const current=add?null:P.byId[day.stops[index]];
    $('#replace-description').textContent=add?'为今天的行程添加一个附近地点。':`将「${current.name}」替换成附近的另一处风景。`;
    const options=P.alternatives(state.plan,state.activeDay,index===null?day.stops.length:index);
    $('#alternatives').innerHTML=options.length?options.map(p=>`<button class="alternative" data-id="${p.id}"><div><strong>${p.name}</strong><small>${p.label} · ${p.description}</small></div><span>${p.fee?`¥${p.fee}`:'免费'}</span>${icon('arrow')}</button>`).join(''):'<div class="saved-empty">暂时没有可替换的推荐地点。</div>';
    $$('.alternative').forEach(b=>b.addEventListener('click',()=>{
      const newId=b.dataset.id;
      if(index===null)day.stops.push(newId);else day.stops[index]=newId;
      $('#replace-dialog').close();render();showToast(add?'已添加地点。':'已替换地点，相关示例时间和预算已更新。');
    }));
    $('#replace-dialog').showModal();
  }
  function drawLegendOnly(){renderMap()}
  function saveTrip(){
    const s=state.settings;const trip={id:Date.now(),title:$('#trip-title').textContent,meta:$('#trip-meta').textContent,created:new Date().toISOString(),settings:{...s,interests:[...s.interests]},plan:state.plan.map(d=>({cityId:d.cityId,title:d.title,subtitle:d.subtitle,stops:[...d.stops]}))};
    state.saved.unshift(trip);state.saved=state.saved.slice(0,20);
    if(!persist()){state.saved.shift();showToast('浏览器存储空间不足，暂时无法保存。');return}
    updateSavedCount();$('#save').innerHTML=`${icon('check')}<span>已保存</span>`;showToast('已保存到我的行程。');setTimeout(()=>$('#save').innerHTML=`${icon('bookmark')}<span>保存行程</span>`,1800);
  }
  function openSaved(){
    const target=$('#saved-list');
    if(!state.saved.length){target.innerHTML='<div class="saved-empty">还没有保存的行程。规划一段旅程，再把它留在这里。</div>'}
    else target.innerHTML=state.saved.map(t=>`<article class="saved-item"><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.meta)}</p><div><button class="secondary-btn" data-open="${t.id}">打开这段行程</button><button class="delete-saved" data-delete="${t.id}">删除</button></div></article>`).join('');
    $$('[data-open]').forEach(b=>b.addEventListener('click',()=>{const t=state.saved.find(x=>x.id===Number(b.dataset.open));if(!t)return;const copy=JSON.parse(JSON.stringify(t));state.settings=copy.settings;state.plan=copy.plan;state.activeDay=0;state.mapScale=1;state.mapOffset={x:0,y:0};$('#city').value=t.settings.city;$('#city-description').textContent=P.getCity(t.settings.city).landscape;$('#start-date').value=t.settings.startDate;$('#days').value=String(t.settings.days);$('#people').value=String(t.settings.people);$('#pace').value=t.settings.pace;$('#budget').value=String(t.settings.budget);$$('input[name=interest]').forEach(c=>c.checked=t.settings.interests.includes(c.value));$('#replace-dialog').close();$('#saved-dialog').close();render();showToast('已打开保存的行程。')}));
    $$('[data-delete]').forEach(b=>b.addEventListener('click',()=>{state.saved=state.saved.filter(x=>x.id!==Number(b.dataset.delete));persist();updateSavedCount();openSaved()}));
    if(!$('#saved-dialog').open)$('#saved-dialog').showModal();
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function exportTrip(){
    const s=state.settings;const lines=[`# ${$('#trip-title').textContent}`,``,`${$('#trip-meta').textContent}`,``,`> 漫游旅行规划体验版。地点、交通时间和费用为示例数据，请出行前核实。`,``,`每人游玩预算：¥${s.budget}（不含住宿和往返交通）`,''];
    state.plan.forEach((d,i)=>{const data=P.schedule(d,s.pace);lines.push(`## ${P.dayDate(s.startDate,i)} · ${d.title}`,``,`${d.subtitle}；相邻地点直线合计约 ${data.km.toFixed(1)} 公里（非步行路线），费用示例 ¥${data.cost}/人。`,'');data.rows.forEach((p,j)=>lines.push(`- ${P.clock(p.start)} ${p.name}（停留约 ${p.duration} 分钟，门票示例 ¥${p.fee}）${j?'，相邻地点示例交通 '+p.travel+' 分钟':''}`));lines.push('')});
    const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${s.city}-${s.days}日漫游.md`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('行程单已导出为 Markdown 文件。');
  }
  function setupView(){
    $$('.mobile-switch button').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;$$('.mobile-switch button').forEach(x=>x.classList.toggle('selected',x===b));document.body.dataset.view=state.view}));
  }
  function setupMapControls(){
    $('#zoom-in').addEventListener('click',()=>{state.mapScale=Math.min(1.5,state.mapScale+.1);drawLegendOnly()});
    $('#zoom-out').addEventListener('click',()=>{state.mapScale=Math.max(.8,state.mapScale-.1);drawLegendOnly()});
    $('#reset-map').addEventListener('click',()=>{state.mapScale=1;state.mapOffset={x:0,y:0};drawLegendOnly()});
    const svg=$('#route-map');let pan=null;
    svg.addEventListener('pointerdown',e=>{if(e.target.closest('.map-point'))return;pan={x:e.clientX,y:e.clientY,ox:state.mapOffset.x,oy:state.mapOffset.y};svg.setPointerCapture(e.pointerId)});
    svg.addEventListener('pointermove',e=>{if(!pan)return;const r=svg.getBoundingClientRect();state.mapOffset={x:pan.ox+(e.clientX-pan.x)*960/r.width,y:pan.oy+(e.clientY-pan.y)*400/r.height};svg.querySelector('.map-world').setAttribute('transform',`translate(${state.mapOffset.x} ${state.mapOffset.y}) scale(${state.mapScale})`)});
    svg.addEventListener('pointerup',()=>{pan=null});svg.addEventListener('pointercancel',()=>{pan=null});
  }
  $('#trip-form').addEventListener('submit',onGenerate);
  $('#city').addEventListener('change',()=>{$('#city-description').textContent=P.getCity($('#city').value).landscape;$('#form-status').textContent=`已选择${$('#city').value}，点击规划生成新行程。当前展示的行程尚未改变。`});
  $('#budget').addEventListener('input',()=>{$('#budget-value').value=$('#budget').value;if(state.plan.length){state.settings.budget=Number($('#budget').value);renderStats();renderDay()}});
  $('#save').addEventListener('click',saveTrip);$('#export').addEventListener('click',exportTrip);
  $$('.saved-trigger').forEach(b=>b.addEventListener('click',openSaved));
  $$('dialog .close-btn').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('#cancel-regenerate').addEventListener('click',()=>{$('#confirm-dialog').close();rerunAfterConfirm=null});
  $('#confirm-regenerate').addEventListener('click',()=>{const fn=rerunAfterConfirm;rerunAfterConfirm=null;if(fn)fn()});
  $$('.rail-btn:not(.saved-trigger)').forEach(b=>b.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'})));
  setupView();setupMapControls();loadSaved();
  const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);$('#start-date').min=local;$('#start-date').value=local;
  generate(collectSettings());
})();
