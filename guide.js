(function(){
  'use strict';
  const data=window.RoamDestinations,area=new URLSearchParams(location.search).get('id'),place=data.get(area);
  const section=document.querySelector('#attraction-catalog'),toolbar=document.querySelector('#guide-toolbar');
  if(!place){section.hidden=true;toolbar.hidden=true;return;}
  const store=window.RoamTravelStore,items=window.RoamAttractions.byRegion[area];
  let selected=new Set(store.selection(area));
  const grid=document.querySelector('#guide-spots');
  const labels={nature:'自然风光',town:'古镇',culture:'人文',photo:'摄影',food:'美食',highland:'高海拔',hike:'徒步',dedicated:'独立片区'};
  function sync(){
    document.querySelectorAll('[data-select-spot]').forEach(button=>{const active=selected.has(button.dataset.selectSpot);button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));button.textContent=active?'✓ 已加入 · 点击取消':'＋ 加入我的行程';button.closest('.guide-spot').classList.toggle('is-selected',active);});
    const query=new URLSearchParams({place:area,view:'edit'});
    if(selected.size)query.set('spots',[...selected].join(','));
    const url='/explore/yunnan/planner/?'+query;
    document.querySelectorAll('[data-start-plan]').forEach(link=>link.href=url);
    document.querySelectorAll('[data-selection-count]').forEach(node=>node.textContent=String(selected.size));
    document.querySelector('#guide-status').textContent=`已选择 ${selected.size} 个景点，开始规划时会带入。`;
  }
  document.querySelector('#guide-area-label').textContent=place.shortName+' · 目的地攻略';
  document.querySelector('#guide-map-link').href=place.mapUrl;
  for(const spot of items){
    const article=document.createElement('article');article.className='guide-spot';
    if(!document.documentElement.classList.contains('guide-editorial-preview')){
      const image=document.createElement('img');image.src='/'+spot.image;image.alt=place.shortName+'地区摄影氛围图，非'+spot.name+'独立实拍';image.loading='lazy';
      const visual=document.createElement('figure');visual.className='guide-spot-image';visual.append(image);
      const caption=document.createElement('figcaption');caption.textContent='地区氛围图';visual.append(caption);article.append(visual);
    }
    const copy=document.createElement('div');copy.className='guide-spot-copy';
    const zone=document.createElement('span');zone.className='spot-zone';zone.textContent=spot.zone;
    const name=document.createElement('h3');name.textContent=spot.name;
    const description=document.createElement('p');description.textContent=spot.intro;
    const tags=document.createElement('div');tags.className='spot-tags';
    for(const kind of spot.kind.filter(k=>['nature','town','culture','highland','hike'].includes(k))){const tag=document.createElement('span');tag.textContent=labels[kind];tags.append(tag);}
    const more=document.createElement('details');more.className='spot-notes';const summary=document.createElement('summary');summary.textContent='停留建议与资料';more.append(summary);
    const stay=document.createElement('p');stay.textContent=spot.estimate?`建议停留 ${spot.estimate.min}-${spot.estimate.max} 分钟（编辑估算，非官方用时，不含交通）。${spot.estimate.basis}`:spot.stayNote+' 具体停留时长未核实。';more.append(stay);
    const coord=document.createElement('p');coord.textContent='入口坐标：'+(spot.entrance?.coordinates?spot.entrance.coordinates.join(', '):'未知，不使用地区中心坐标代替。');more.append(coord);
    const updated=document.createElement('p');updated.textContent='资料整理更新：'+spot.dataUpdatedAt+'；开放与预约条件尚未完成当前核实。';more.append(updated);
    if(spot.caution){const caution=document.createElement('p');caution.className='spot-caution';caution.textContent=spot.caution;more.append(caution);}
    const source=document.createElement('a');source.href=spot.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='地区资料入口 ↗';more.append(source);
    const select=document.createElement('button');select.type='button';select.dataset.selectSpot=spot.id;select.className='spot-select';
    select.addEventListener('click',()=>{if(selected.has(spot.id))selected.delete(spot.id);else selected.add(spot.id);const ok=store.select(area,[...selected]);sync();if(!ok)document.querySelector('#guide-status').textContent='当前浏览器无法保存选择，但开始规划链接仍会携带已选景点。';});
    copy.append(zone,name,description,tags,more,select);article.append(copy);grid.append(article);
  }
  sync();
})();
