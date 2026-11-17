/* Multi-day map canvas: one AMap instance, day-coloured markers and real road paths. */
(function(root){
  'use strict';
  let instance=null, currentContainer=null;

  function colorFor(day,colors){return colors[(day-1)%colors.length];}

  async function ensure(container){
    if(!root.RoamAMap)throw new Error('地图模块未加载');
    const AMap=await root.RoamAMap.load();
    if(!instance||currentContainer!==container){
      if(instance&&currentContainer){try{instance.destroy();}catch{}}
      container.replaceChildren();
      const canvas=document.createElement('div');
      canvas.className='wb-map-canvas';
      container.append(canvas);
      instance=new AMap.Map(canvas,{zoom:10,center:[100.8,25.2],viewMode:'2D',mapStyle:'amap://styles/whitesmoke',resizeEnable:true,animateEnable:false,showLabel:true});
      currentContainer=container;
    }
    return {AMap,map:instance};
  }

  function markerContent(text,color,active){
    const button=document.createElement('button');
    button.type='button';
    button.className='wb-map-marker'+(active?' is-active':'');
    button.style.setProperty('--marker-color',color);
    const strong=document.createElement('strong');strong.textContent=text;
    button.append(strong);
    return button;
  }

  async function render(container,{days=[],mode='all',activeDay=1,activeKey=null,onMarker=null}={}){
    if(!container)return;
    const token=String(Number(container.dataset.mapToken||0)+1);container.dataset.mapToken=token;
    try{
      const {AMap,map}=await ensure(container);
      if(container.dataset.mapToken!==token)return;
      map.clearMap();
      const shown=days.filter(day=>mode==='all'||day.dayNumber===activeDay);
      const markers=[],lines=[];
      const groups=new Map();
      for(const day of shown){
        for(const point of day.points||[]){
          if(!point?.poi?.coordinates)continue;
          const key=point.poi.poiId+':'+point.poi.coordinates.join(',');
          if(!groups.has(key))groups.set(key,{poi:point.poi,items:[]});
          groups.get(key).items.push({day:day.dayNumber,color:day.color,point});
        }
      }
      for(const group of groups.values()){
        const first=group.items[0];
        const dayNumbers=[...new Set(group.items.map(item=>item.day))];
        const content=markerContent(mode==='single'?String(first.point.index+1):dayNumbers.map(d=>'D'+String(d).padStart(2,'0')).join('·'),first.color,group.items.some(item=>item.point.key===activeKey));
        content.title=first.poi.name;
        content.setAttribute('aria-label','查看'+first.poi.name);
        const marker=new AMap.Marker({position:first.poi.coordinates,content,anchor:'center'});
        marker._wb={group,dayNumbers,keys:group.items.map(item=>item.point.key)};
        marker._wbContent=content;
        marker.on('click',()=>{
          const preferred=dayNumbers.includes(activeDay)?activeDay:dayNumbers[0];
          const item=group.items.find(entry=>entry.day===preferred)||first;
          onMarker?.(preferred,item.point.key);
        });
        markers.push(marker);
      }
      for(const day of shown){
        for(const leg of day.legs||[]){
          for(const path of leg.result?.paths||[]){
            if(!Array.isArray(path)||path.length<2)continue;
            lines.push(new AMap.Polyline({path,strokeColor:day.color,strokeWeight:5,strokeOpacity:.88,lineJoin:'round',lineCap:'round',showDir:true}));
          }
        }
      }
      map.add([...lines,...markers]);
      map._wbMarkers=markers;
      map._wbActiveKey=activeKey;
      map._wbActiveDay=activeDay;
      if(markers.length){
        const frame=markers.length+':'+markers.map(m=>m.getPosition().toString()).join('|')+':'+shown.map(d=>d.dayNumber).join(',')+':'+lines.length;
        if(map._wbFrame!==frame){map.setFitView([...markers,...lines],false,[42,42,42,42]);map._wbFrame=frame;}
      }
      if(activeKey){
        const marker=markers.find(m=>m._wb.keys.includes(activeKey));
        if(marker){map.setZoomAndCenter(Math.max(map.getZoom(),12),marker.getPosition());}
      }
      setTimeout(()=>{try{map.resize();}catch{}},40);
    }catch(error){
      console.error('RoamWorkbenchMap',error);
      if(container.dataset.mapToken!==token)return;
      container.dataset.mapError=String(error&&error.stack||error);
      container.replaceChildren();
      const message=document.createElement('p');message.className='wb-map-error';
      message.textContent='高德地图暂时无法加载；每日距离与交通仍以已查结果为准。';
      container.append(message);
      instance=null;currentContainer=null;
    }
  }

  function focus(key){
    if(!instance)return;
    for(const marker of instance._wbMarkers||[]){
      marker._wbContent?.classList?.toggle('is-active',marker._wb.keys.includes(key));
    }
    const marker=(instance._wbMarkers||[]).find(m=>m._wb.keys.includes(key));
    if(marker)instance.setZoomAndCenter(Math.max(instance.getZoom(),12),marker.getPosition());
  }

  function resize(){try{instance?.resize();}catch{}}

  root.RoamWorkbenchMap=Object.freeze({render,focus,resize});
})(window);
