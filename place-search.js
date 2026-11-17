(function(){
  'use strict';
  const bridge=window.RoamPlannerPersonal,P=window.RoamPersonalPlaces,service=window.RoamAMap;
  if(!bridge||!P||!service)return;
  const $=s=>document.querySelector(s),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const dialog=make('dialog','sources-dialog personal-place-dialog');dialog.id='place-search-dialog';dialog.setAttribute('aria-labelledby','place-search-title');
  dialog.innerHTML='<button type="button" class="close-dialog" id="close-place-search" aria-label="关闭地点搜索">×</button><p class="eyebrow">MAKE ROOM FOR YOUR FAVOURITES</p><h2 id="place-search-title">把喜欢的地方，放进这一程。</h2><p class="place-search-intro">搜索你订的酒店、想吃的餐厅；确认分店和位置后，再加入指定日期。</p><form id="place-query-form" class="place-query-form"><label>地点类型<select id="place-kind"><option value="hotel">酒店 / 民宿</option><option value="restaurant">餐厅 / 美食</option><option value="other">其他地点</option></select></label><label class="place-keyword-label">地点名称<input id="place-keyword" type="search" required minlength="2" maxlength="100" placeholder="输入酒店或餐厅名称" autocomplete="off"></label><button type="submit" id="run-place-search" class="gold-button">搜索地点 ↗</button></form><p id="place-search-status" class="place-search-status" role="status" aria-live="polite"></p><div class="place-search-layout"><div id="place-search-results" class="place-search-results" aria-label="地点搜索结果"></div><div id="place-search-map" class="place-search-map" aria-label="高德地图地点确认"></div></div><section class="place-confirm" id="place-confirm" hidden><h3 id="place-confirm-name"></h3><p id="place-confirm-address"></p><p id="place-coordinate-note"></p><div class="place-assignment"><label>加入日期<select id="personal-from-day"></select></label><label id="personal-to-label">住宿至<select id="personal-to-day"></select></label><label id="personal-slot-label" hidden>安排时段<select id="personal-slot"></select></label><button type="button" id="confirm-personal-place" class="gold-button" disabled>加入我的行程 ↗</button></div></section><p class="place-service-note">地点由高德地图提供。位置为商家 / 地点 POI，未核实景区入口、预约或营业状态。此处选点不代表道路导航或住宿预订。</p>';
  document.body.append(dialog);
  let map=null,markers=[],chosen=null,context=null,searchVersion=0,selectionVersion=0,opening=0,editingId=null,binding=null;
  const status=text=>$('#place-search-status').textContent=text;
  function assignmentOptions(){
    context=bridge.context();
    for(const id of ['#personal-from-day','#personal-to-day']){
      const select=$(id);select.replaceChildren();for(let i=1;i<=context.days;i++){const option=make('option','','Day '+String(i).padStart(2,'0'));option.value=String(i);select.append(option);}
    }
    $('#personal-to-day').value=String(context.days);
    const kind=$('#place-kind').value;dialog.querySelectorAll('.place-assignment>label').forEach(label=>label.hidden=false);$('#personal-to-label').hidden=kind!=='hotel';$('#personal-slot-label').hidden=kind==='hotel';
    const options=kind==='restaurant'?[['lunch','午餐'],['dinner','晚餐']]:[['morning','上午'],['afternoon','下午'],['evening','傍晚']];
    $('#personal-slot').replaceChildren(...options.map(([value,label])=>{const option=make('option','',label);option.value=value;return option;}));
  }
  function resetSelection(){chosen=null;selectionVersion++;$('#place-confirm').hidden=true;$('#confirm-personal-place').disabled=true;}
  function clearMarkers(){if(map&&markers.length)map.remove(markers);markers=[];}
  async function ensureMap(){
    const version=++opening;status('正在连接高德地图…');
    try{
      const AMap=await service.load();if(version!==opening||!dialog.open)return;
      if(!map){map=new AMap.Map('place-search-map',{zoom:11,mapStyle:'amap://styles/whitesmoke',viewMode:'2D',resizeEnable:true,animateEnable:false});}
      // Use a regional camera centre only; markers always use the actual provider POI.
      map.setZoomAndCenter(10,window.RoamDestinations.get(context.area).coordinates);map.resize?.();
      status('搜索范围：'+service.cityFor(context.area)+'。请输入名称，选择正确的门店。');
      $('#run-place-search').disabled=false;
    }catch(error){if(version===opening)status(error.message+' 点击“搜索地点”可重试。');$('#run-place-search').disabled=false;}
  }
  function open(kind='hotel',existing=null,bindRequest=null,initialKeyword=''){
    binding=bindRequest;$('#place-kind').disabled=Boolean(binding);
    context=bridge.context();$('#place-kind').value=kind;$('#place-keyword').value='';$('#place-search-results').replaceChildren(make('p','place-empty','输入名称后，这里会列出真实搜索结果。'));resetSelection();clearMarkers();assignmentOptions();
    editingId=existing?.id||null;
    $('#place-search-title').textContent=binding?'确认“'+binding.spot.name+'”的地图位置':'把喜欢的地方，放进这一程。';
    $('#confirm-personal-place').textContent=binding?'使用这个地图位置':'加入我的行程 ↗';
    if(binding){context={...context,area:binding.spot.area};dialog.querySelectorAll('.place-assignment>label').forEach(label=>label.hidden=true);}
    dialog.showModal();$('#run-place-search').disabled=true;
    const ready=ensureMap();$('#place-keyword').focus();
    if(existing){
      chosen=existing;$('#place-confirm').hidden=false;$('#place-confirm-name').textContent=existing.name;$('#place-confirm-address').textContent=existing.city+' · '+existing.address;$('#place-coordinate-note').textContent='已保存的高德 POI，可调整适用日期；位置与营业状态请出发前核实。';
      $('#personal-from-day').value=String(Math.min(context.days,existing.fromDay));$('#personal-to-day').value=String(Math.min(context.days,existing.toDay));$('#personal-slot').value=existing.slot;$('#confirm-personal-place').disabled=false;
      const editOpen=opening;
      ready.then(async()=>{if(!dialog.open||!map||editOpen!==opening)return;const AMap=await service.load();if(!dialog.open||editOpen!==opening)return;const marker=new AMap.Marker({position:existing.coordinates,title:existing.name});map.add(marker);markers=[marker];map.setZoomAndCenter(15,existing.coordinates);}).catch(()=>{});
    }
    if(binding){$('#place-keyword').value=rootQuery(binding.spot);const version=opening;ready.then(()=>{if(dialog.open&&version===opening)$('#place-query-form').requestSubmit();});}
    else if(initialKeyword){$('#place-keyword').value=initialKeyword.slice(0,100);const version=opening;ready.then(()=>{if(dialog.open&&version===opening)$('#place-query-form').requestSubmit();});}
  }
  function rootQuery(spot){return window.RoamJourneyRouting.queries(spot)[0];}
  function close(){dialog.close();opening++;searchVersion++;selectionVersion++;$('#run-place-search').disabled=false;}
  $('#close-place-search').addEventListener('click',close);
  dialog.addEventListener('cancel',()=>{opening++;searchVersion++;selectionVersion++;});
  $('#place-keyword').addEventListener('input',()=>{searchVersion++;resetSelection();clearMarkers();$('#run-place-search').disabled=false;$('#place-search-results').replaceChildren(make('p','place-empty','输入完成后点击搜索，结果以当前关键词为准。'));});
  $('#place-kind').addEventListener('change',()=>{searchVersion++;resetSelection();clearMarkers();assignmentOptions();$('#place-search-results').replaceChildren(make('p','place-empty','已切换类型，请重新搜索。'));$('#run-place-search').disabled=false;});
  $('#personal-from-day').addEventListener('change',()=>{if(Number($('#personal-to-day').value)<Number($('#personal-from-day').value))$('#personal-to-day').value=$('#personal-from-day').value;});
  async function choose(candidate,button){
    const version=++selectionVersion;chosen=null;$('#place-confirm').hidden=false;$('#place-confirm-name').textContent=candidate.name;$('#place-confirm-address').textContent=candidate.address||'正在确认地址…';$('#place-coordinate-note').textContent='正在核对地点所在地区…';$('#confirm-personal-place').disabled=true;
    document.querySelectorAll('.place-result').forEach(row=>row.classList.toggle('is-selected',row===button));
    if(map){map.setZoomAndCenter(15,candidate.coordinates);}
    try{
      const place=await service.resolve(candidate);if(version!==selectionVersion||!dialog.open)return;
      chosen=place;$('#place-confirm-address').textContent=place.city+' · '+place.address;$('#place-coordinate-note').textContent='高德 POI 坐标（GCJ-02）：'+place.coordinates.map(n=>n.toFixed(6)).join(', ')+'；请核对地图上的门店。';$('#confirm-personal-place').disabled=false;
      status('已确认 '+place.name+'，选择日期后加入行程。');
    }catch(error){if(version===selectionVersion){$('#place-coordinate-note').textContent=error.message;status(error.message);}}
  }
  $('#place-query-form').addEventListener('submit',async event=>{
    event.preventDefault();const keyword=$('#place-keyword').value.trim();if(keyword.length<2){status('请输入至少两个字的地点名称。');return;}
    const version=++searchVersion;resetSelection();$('#run-place-search').disabled=true;status('正在搜索真实地点…');$('#place-search-results').replaceChildren();clearMarkers();
    try{
      const rows=await service.search(keyword,context.area,$('#place-kind').value);if(version!==searchVersion||!dialog.open)return;
      if(!map){const AMap=await service.load();if(version!==searchVersion||!dialog.open)return;map=new AMap.Map('place-search-map',{zoom:11,mapStyle:'amap://styles/whitesmoke',resizeEnable:true,animateEnable:false});}
      const AMap=await service.load();if(version!==searchVersion||!dialog.open)return;
      status(rows.length?'找到 '+rows.length+' 个结果，请确认具体分店。':'没有找到匹配地点，请尝试完整店名或更换关键词。');
      if(!rows.length)$('#place-search-results').append(make('p','place-empty','未找到地点。不会把未匹配的文字当作已确认位置。'));
      rows.forEach((row,index)=>{
        const button=make('button','place-result');button.type='button';button.dataset.poiId=row.poiId;button.append(make('span','place-result-number',String(index+1).padStart(2,'0')));
        const copy=make('span','place-result-copy');copy.append(make('strong','',row.name),make('small','',row.address||'地址待确认'));button.append(copy);button.addEventListener('click',()=>choose(row,button));$('#place-search-results').append(button);
        const marker=new AMap.Marker({position:row.coordinates,title:row.name,label:{content:String(index+1),direction:'top'}});marker.on('click',()=>choose(row,button));markers.push(marker);
      });
      map.add(markers);if(markers.length)map.setFitView(markers,false,[35,35,35,35]);map.resize?.();
    }catch(error){if(version===searchVersion)status(error.message);}
    finally{if(version===searchVersion)$('#run-place-search').disabled=false;}
  });
  $('#confirm-personal-place').addEventListener('click',()=>{
    if(!chosen)return;
    if(binding){const callback=binding.confirm,poi={...chosen,match:'user-confirmed',queriedAt:new Date().toISOString()};close();callback(poi);return;}
    const place={...chosen,kind:$('#place-kind').value,fromDay:Number($('#personal-from-day').value),toDay:Number($('#personal-to-day').value),slot:$('#personal-slot').value};
    const result=bridge.add(place,editingId);if(!result.ok){status(result.message);return;}window.RoamWorkbench?.personalAdded?.(place,editingId);close();
  });
  for(const button of document.querySelectorAll('[data-open-place-search]'))button.addEventListener('click',()=>open(button.dataset.openPlaceSearch||'hotel'));
  window.RoamPlaceSearch=Object.freeze({open,edit:place=>open(place.kind,place),bind:(spot,confirm)=>open('other',null,{spot,confirm})});
})();
