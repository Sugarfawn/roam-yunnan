/* Import the third-stage wishlist once without replacing existing full-version drafts. */
(function(root){
  'use strict';
  const key='roam.yunnan.selection-migration.v1';
  try{
    const legacy=JSON.parse(localStorage.getItem('roam.attractions.v1')||'null');
    if(!legacy||typeof legacy!=='object'||Array.isArray(legacy))return;
    const current=JSON.parse(localStorage.getItem('roam.yunnan.travel.v1')||'null');
    const previous=JSON.parse(localStorage.getItem(key)||'[]'),done=new Set(Array.isArray(previous)?previous:[]);
    for(const place of root.RoamDestinations.items){
      if(done.has(place.id)||!Object.hasOwn(legacy,place.id))continue;
      if(current?.drafts?.[place.id]||current?.plans?.[place.id]||Object.hasOwn(current?.selections||{},place.id)){done.add(place.id);continue;}
      const value=legacy[place.id];if(!value||typeof value!=='object')continue;
      const ids=[...new Set((Array.isArray(value.selected)?value.selected:[]).filter(id=>root.RoamAttractions.get(id)?.area===place.id))];
      const must=[...new Set((Array.isArray(value.must)?value.must:[]).filter(id=>ids.includes(id)))];
      const draft=root.RoamRules.normalize({area:place.id,selected:ids,mustVisit:must});
      if(root.RoamTravelStore.setDraft(draft))done.add(place.id);
    }
    localStorage.setItem(key,JSON.stringify([...done]));
  }catch{
    const note=document.querySelector('#travel-notice');if(note){note.hidden=false;note.textContent='旧版清单暂未迁移。请检查浏览器存储；旧数据仍保留。';}
  }
})(window);
