(function(){
  'use strict';
  const {items,get}=window.RoamDestinations,config=window.RoamAtlasConfig,$=selector=>document.querySelector(selector),svg=$('#province-map');
  const NS='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const regionSettings=new Map(config.regions.map(region=>[region.adcode,region]));
  let selected=get(new URLSearchParams(location.search).get('place'))||items[0],renderVersion=0,geometry=null,regionNames=new Map();
  const element=(tag,attributes={},text)=>{const node=document.createElementNS(NS,tag);Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));if(text!==undefined)node.textContent=text;return node;};
  const labelWidth=text=>Math.max(84,text.length*13+26);
  const regionPlaces=code=>items.filter(place=>place.prefectureAdcode===Number(code));
  function announce(message){$('#atlas-message').textContent=message;}
  function syncSelection(){
    svg.querySelectorAll('[data-place]').forEach(node=>{const active=node.dataset.place===selected.id;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active));});
    svg.querySelectorAll('.atlas-region').forEach(node=>{const active=Number(node.dataset.adcode)===selected.prefectureAdcode;node.classList.toggle('is-selected',active);node.setAttribute('aria-pressed',String(active));});
    svg.querySelectorAll('.prefecture-label').forEach(node=>node.classList.toggle('is-selected',Number(node.dataset.adcode)===selected.prefectureAdcode));
    $('#map-selected-name').textContent=selected.shortName;
    $('#explore-place').href='/explore/yunnan/planner/?place='+selected.id+'&view=edit';
  }
  function updatePanel(place){
    const image=$('#selected-image');image.src='/'+place.background;image.alt='';image.style.objectPosition=place.position||'50% 50%';
    $('#selected-category').textContent=place.category;$('#selected-author').textContent=place.author;$('#selected-source').href=place.source;
    $('#selected-region').textContent=place.region;$('#selected-number').textContent=place.number;$('#selected-total').textContent=String(items.length).padStart(2,'0');
    $('#selected-name').textContent=place.shortName;$('#selected-english').textContent=place.english;$('#selected-introduction').textContent=place.introduction;
    $('#selection-status').textContent='当前探索：'+place.shortName+'，'+place.region;
    announce((regionNames.get(place.prefectureAdcode)||place.region)+' · 点击地图标记切换风景');
  }
  async function select(id,updateUrl=true){
    const place=get(id);if(!place)return;selected=place;const version=++renderVersion;syncSelection();
    if(updateUrl){const url=new URL(location.href);url.searchParams.set('place',place.id);history.replaceState(null,'',url);}
    const backdrop=$('.atlas-background'),feature=$('#destination-feature');backdrop.classList.add('is-changing');feature.classList.add('is-changing');
    const preload=new Image();preload.src='/'+place.background;try{await preload.decode();}catch{announce('摄影资源暂时未能加载，请刷新重试。');}
    if(!reduce.matches)await new Promise(resolve=>setTimeout(resolve,120));if(version!==renderVersion)return;
    updatePanel(place);backdrop.classList.remove('is-changing');feature.classList.remove('is-changing');
  }
  function chooseRegion(code){
    const places=regionPlaces(code),name=regionNames.get(Number(code))||'此地区';
    if(!places.length){announce(name+' · 暂未收录旅行地点，当前风景继续保留。');$('#selection-status').textContent=name+'，暂未收录旅行地点。';return;}
    const place=places.includes(selected)?selected:places[0];select(place.id);announce(name+' · '+places.length+' 处风景可探索');
  }
  function renderMap(province,regions){
    const {width,height,padding}=config.projection;geometry=window.RoamGeometry.create(province,width,height,padding);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.querySelectorAll('.map-generated').forEach(node=>node.remove());
    const defs=element('defs',{class:'map-generated'}),clip=element('clipPath',{id:'province-clip'});
    geometry.features.forEach(feature=>clip.append(element('path',{d:geometry.path(feature.geometry)})));defs.append(clip);svg.append(defs);
    const base=element('g',{class:'map-generated','aria-hidden':'true'});
    geometry.features.forEach(feature=>base.append(element('path',{class:'province-shape',d:geometry.path(feature.geometry),'fill-rule':'evenodd'})));svg.append(base);
    regionNames=new Map();
    if(regions){
      const layer=element('g',{class:'map-generated prefecture-layer','clip-path':'url(#province-clip)','aria-label':'云南各州、市行政分区'});
      const labels=element('g',{class:'map-generated prefecture-labels','aria-hidden':'true'});
      for(const feature of regions.features){
        const code=Number(feature.properties.adcode),name=feature.properties.name,setting=regionSettings.get(code)||{shortName:name},places=regionPlaces(code);regionNames.set(code,name);
        const region=element('path',{class:'atlas-region'+(places.length?' has-destinations':''),'data-adcode':code,d:geometry.path(feature.geometry),'fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':name+(places.length?'，'+places.length+'处旅行目的地':'，暂未收录旅行地点'),'aria-pressed':'false'});
        region.append(element('title',{},name));region.addEventListener('click',()=>chooseRegion(code));
        region.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseRegion(code);}});
        const hover=()=>announce(name+(places.length?' · '+places.length+' 处风景可探索':' · 暂未收录旅行地点'));
        region.addEventListener('mouseenter',hover);region.addEventListener('focus',hover);layer.append(region);
        const coordinate=feature.properties.centroid||feature.properties.center;
        if(Array.isArray(coordinate)){
          const [x,y]=geometry.project(coordinate),[dx,dy]=setting.labelOffset||[0,0];
          labels.append(element('text',{class:'prefecture-label','data-adcode':code,x:(x+dx).toFixed(2),y:(y+dy).toFixed(2),'text-anchor':'middle','dominant-baseline':'central'},setting.shortName));
        }
      }
      svg.append(layer,labels);
    }
    const outline=element('g',{class:'map-generated province-outline-layer','aria-hidden':'true'});
    geometry.features.forEach(feature=>outline.append(element('path',{class:'province-outline',d:geometry.path(feature.geometry),'fill-rule':'evenodd'})));svg.append(outline);
    const markers=element('g',{class:'map-generated map-markers'});
    for(const place of items){
      const [x,y]=geometry.project(place.coordinates),[dx,dy]=place.labelOffset||[40,0];
      const marker=element('g',{class:'map-marker',role:'button',tabindex:'0','data-place':place.id,'data-lng':place.coordinates[0],'data-lat':place.coordinates[1],transform:`translate(${x.toFixed(3)},${y.toFixed(3)})`,'aria-label':place.number+' '+place.shortName+'，'+place.region,'aria-pressed':'false'});
      marker.append(element('title',{},place.shortName+' · '+place.region),element('circle',{r:30,class:'marker-target'}),element('circle',{r:28,class:'marker-breath'}),element('circle',{r:17,class:'marker-border'}),element('text',{y:.4,class:'marker-number'},place.number));
      const textX=dx<0?dx+labelWidth(place.shortName):dx;
      const tooltip=element('g',{class:'marker-tooltip',transform:`translate(${dx},${dy-15})`});tooltip.append(element('rect',{x:-9,y:-8,width:labelWidth(place.shortName),height:29,rx:3}),element('text',{x:3,y:11},place.shortName));
      const connector=element('path',{class:'marker-connector',d:`M${dx<0?-19:19},0 L${dx<0?-30:30},${dy} L${textX},${dy}`});marker.insertBefore(connector,marker.firstChild);marker.append(tooltip);
      marker.addEventListener('click',()=>select(place.id));
      marker.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();select(place.id);}
        if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(event.key)){event.preventDefault();const direction=['ArrowDown','ArrowRight'].includes(event.key)?1:-1,next=items[(items.indexOf(place)+direction+items.length)%items.length];svg.querySelector('[data-place="'+next.id+'"]').focus();select(next.id);}
      });markers.append(marker);
    }
    svg.append(markers);syncSelection();announce((regionNames.get(selected.prefectureAdcode)||selected.region)+' · 点击标记选择风景');
  }
  async function loadMap(){
    const status=$('#map-status');status.hidden=false;status.textContent='正在展开云南…';$('#retry-region-boundaries').hidden=true;
    const fetchData=async url=>{const response=await fetch(url);if(!response.ok)throw Error('Boundary unavailable');return response.json();};
    const result=await Promise.allSettled([fetchData(config.provinceURL),fetchData(config.regionsURL)]);
    try{
      if(result[0].status!=='fulfilled')throw Error('Province boundary unavailable');const province=result[0].value;
      if(province.features?.[0]?.properties?.adcode!==530000)throw Error('Unexpected province');
      let regions=result[1].status==='fulfilled'?result[1].value:null;
      if(!Array.isArray(regions?.features)||!regions.features.length||regions.features.some(feature=>!String(feature.properties?.adcode).startsWith('53')))regions=null;
      renderMap(province,regions);status.hidden=true;
      if(!regions){$('#retry-region-boundaries').hidden=false;announce('州、市边界暂未加载，仍可选择五处风景。');}
    }catch{status.textContent='地图暂未加载。';const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.addEventListener('click',loadMap);status.append(retry);}
  }
  $('#retry-region-boundaries').addEventListener('click',loadMap);$('#map-source-button').addEventListener('click',()=>$('#open-sources').click());
  window.addEventListener('popstate',()=>select(new URLSearchParams(location.search).get('place')||items[0].id,false));
  updatePanel(selected);syncSelection();loadMap();
})();
