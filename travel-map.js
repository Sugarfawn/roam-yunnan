(function(root){
  'use strict';
  let boundaryPromise;const liveMaps=new WeakMap();
  const NS='http://www.w3.org/2000/svg';
  const element=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  root.RoamTravelMap={async render(container,area,stops,personal=[]){
    const token=String(Number(container.dataset.version||0)+1);container.dataset.version=token;
    if(liveMaps.has(container)){liveMaps.get(container).destroy();liveMaps.delete(container);}
    container.textContent='正在展开地区位置…';
    if(personal.length&&root.RoamAMap){
      container.setAttribute('aria-label','酒店和餐厅的高德地图位置');
      try{
        const AMap=await root.RoamAMap.load();if(container.dataset.version!==token)return;
        const canvas=document.createElement('div');canvas.className='personal-day-map';container.replaceChildren(canvas);
        const map=new AMap.Map(canvas,{zoom:12,center:personal[0].coordinates,viewMode:'2D',resizeEnable:true});liveMaps.set(container,map);
        const markers=personal.map((place,index)=>new AMap.Marker({position:place.coordinates,title:place.name,label:{content:String(index+1)+' · '+(place.kind==='hotel'?'住宿':place.kind==='restaurant'?'用餐':'地点'),direction:'top'}}));
        map.add(markers);map.setFitView(markers,false,[35,40,35,40]);return;
      }catch{
        if(container.dataset.version!==token)return;
        container.replaceChildren();const message=document.createElement('p');message.className='personal-map-error';message.textContent='高德地图暂时无法加载，地点已保存在下面的顺序清单。';const retry=document.createElement('button');retry.type='button';retry.className='personal-map-retry';retry.textContent='重试地图';retry.addEventListener('click',()=>root.RoamTravelMap.render(container,area,stops,personal));container.append(message,retry);return;
      }
    }
    container.setAttribute('aria-label','云南地区参考地图');
    try{
      if(!boundaryPromise)boundaryPromise=fetch('/data/yunnan-province.geojson').then(r=>{if(!r.ok)throw Error('local boundary');return r.json();}).catch(e=>{boundaryPromise=null;throw e;});
      const boundary=await boundaryPromise;if(container.dataset.version!==token)return;
      const projection=root.RoamGeometry.create(boundary,900,760,55),svg=element('svg',{viewBox:'0 0 900 760',role:'img','aria-label':root.RoamDestinations.get(area).shortName+'地区参考位置'});
      boundary.features.forEach(f=>svg.append(element('path',{d:projection.path(f.geometry),class:'travel-province', 'fill-rule':'evenodd'})));
      const location=root.RoamDestinations.get(area),[x,y]=projection.project(location.coordinates);
      svg.append(element('circle',{cx:x,cy:y,r:14,class:'region-anchor'}),element('text',{x:x+25,y:y+4,class:'region-anchor-label'},location.shortName+' · 地区参考'));
      const points=stops.map((spot,index)=>({spot,index})).filter(({spot})=>Array.isArray(spot.entrance?.coordinates));
      if(points.length>1)svg.append(element('polyline',{points:points.map(p=>projection.project(p.spot.entrance.coordinates).join(',')).join(' '),class:'travel-sequence-line'}));
      points.forEach(({spot,index})=>{const [px,py]=projection.project(spot.entrance.coordinates);svg.append(element('circle',{cx:px,cy:py,r:17,class:'travel-location-pin'}),element('text',{x:px,y:py+1,class:'travel-location-number'},String(index+1)));});
      container.replaceChildren(svg);
    }catch{if(container.dataset.version===token)container.textContent='地区地图暂未加载，下面的景点顺序仍可查看。';}
  },async renderRoad(container,points,legs,onSelect){
    const token=String(Number(container.dataset.version||0)+1);container.dataset.version=token;
    container.setAttribute('aria-label','当日地点与高德道路路线');
    try{
      const AMap=await root.RoamAMap.load();if(container.dataset.version!==token)return;
      let map=liveMaps.get(container);
      if(!map){const canvas=document.createElement('div');canvas.className='personal-day-map';container.replaceChildren(canvas);map=new AMap.Map(canvas,{zoom:11,center:points[0]?.poi.coordinates||root.RoamDestinations.get(container.dataset.area||'erhai').coordinates,mapStyle:'amap://styles/whitesmoke',viewMode:'2D',resizeEnable:true,animateEnable:false});liveMaps.set(container,map);}
      map.clearMap();const markers=[],byPoint=new Map();
      for(const point of points){const key=point.poi.poiId;if(!byPoint.has(key))byPoint.set(key,[]);byPoint.get(key).push(point);}
      for(const group of byPoint.values()){
        const first=group[0],content=document.createElement('button');content.type='button';content.className='journey-map-marker';content.textContent=group.map(p=>p.index+1).join('·');content.title=first.name;content.setAttribute('aria-label','在行程中查看'+first.name);
        const marker=new AMap.Marker({position:first.poi.coordinates,content,anchor:'center'});marker._journeyKeys=group.map(p=>p.key);marker._journeyContent=content;marker.on('click',()=>onSelect?.(first.key));markers.push(marker);
      }
      const lines=[];for(const leg of legs)for(const path of leg.result?.paths||[])if(path.length>1)lines.push(new AMap.Polyline({path,strokeColor:leg.result.mode==='walk'?'#b79762':'#3d6b54',strokeWeight:5,strokeOpacity:.85,lineJoin:'round',lineCap:'round',showDir:true}));
      map.add([...lines,...markers]);map._journeyMarkers=markers;
      const frame=points.map(p=>p.key+':'+p.poi.poiId).join('|')+'|'+legs.map(l=>l.result?.paths?.length?l.result.mode+':'+l.result.distanceMeters:'').join(',');if(map._journeyFrame!==frame){if(markers.length)map.setFitView([...markers,...lines],false,[50,45,50,45]);map._journeyFrame=frame;}
    }catch{if(container.dataset.version!==token)return;container.textContent='地图暂时无法加载，左侧地点与已查交通仍可查看。';}
  },focus(container,key){
    const map=liveMaps.get(container);if(!map)return;
    for(const marker of map._journeyMarkers||[]){const active=marker._journeyKeys.includes(key);marker._journeyContent.classList.toggle('is-active',active);if(active&&!map.getBounds().contains(marker.getPosition()))map.setCenter(marker.getPosition());}
  }};
})(window);
