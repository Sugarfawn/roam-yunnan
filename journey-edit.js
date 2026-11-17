/* Shared operations for drag editing and confirmed assistant proposals. */
(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function signature(p){const {poiBindings,...settings}=p.settings;return JSON.stringify({tripId:p.tripId,settings,days:p.days.map(({traffic,assessment,...day})=>day),profile:p.profile,lockedDays:p.lockedDays});}
  function apply(current,actions,{assistant=false}={}){
    const p=copy(current),changed=new Set();p.unassigned=p.unassigned||[];p.lockedDays=p.lockedDays||[];
    for(const d of p.days)if(!Array.isArray(d.entryOrder))d.entryOrder=root.RoamPersonalPlaces.sequence(d,p.settings).filter(e=>!e.role).map(e=>e.type==='attraction'?e.id:e.place.id+':'+e.place.slot);
    const touch=n=>{if(assistant&&p.lockedDays.includes(n+1))throw Error('这一天已锁定，请先解锁。');changed.add(n);};
    for(const a of actions){
      if(!a||typeof a!=='object')throw Error('修改格式无效。');
      if(a.type==='profile'){if(!a.values||typeof a.values!=='object')throw Error('偏好无效。');p.profile={...p.profile};for(const k of ['companions','mobility','startTime','transport','interests','avoid','notes'])if(typeof a.values[k]==='string')p.profile[k]=a.values[k].slice(0,300);if(/包车|自驾|打车/.test(a.values.transport||''))p.settings.transport='drive';else if(/公交|公共交通/.test(a.values.transport||''))p.settings.transport='public';if(/少走|轻松|慢游/.test(a.values.mobility||''))p.settings.pace='slow';continue;}
      if(a.type==='lock_day'){const n=Number(a.day);if(!p.days[n-1])throw Error('日期无效。');p.lockedDays=a.locked===false?p.lockedDays.filter(d=>d!==n):[...new Set([...p.lockedDays,n])];continue;}
      if(a.type==='swap_days'){const x=Number(a.dayA)-1,y=Number(a.dayB)-1;if(!p.days[x]||!p.days[y]||x===y)throw Error('交换日期无效。');touch(x);touch(y);[p.days[x],p.days[y]]=[p.days[y],p.days[x]];p.days[x].dayNumber=x+1;p.days[y].dayNumber=y+1;continue;}
      if(a.type==='update_day'){const n=Number(a.day)-1;if(!p.days[n])throw Error('日期无效。');touch(n);if(typeof a.note==='string')p.days[n].note=a.note.slice(0,500);if(typeof a.startTime==='string'&&root.RoamTripModel.clock(a.startTime))p.days[n].startTime=a.startTime;continue;}
      const id=String(a.stopId||''),spot=root.RoamAttractions.get(id);
      const from=p.days.findIndex(d=>d.stops.includes(id));
      if(['move_stop','add_stop','reorder_stop','defer_stop','remove_stop','must_visit'].includes(a.type)){
        if(!spot||!p.settings.areas.includes(spot.area))throw Error('地点不在本次旅行目录中。');
        if(a.type==='must_visit'){p.settings.selected=[...new Set([...p.settings.selected,id])];p.settings.mustVisit=[...new Set([...p.settings.mustVisit,id])];continue;}
        if(a.type==='defer_stop'||a.type==='remove_stop'){
          if(assistant&&p.settings.mustVisit.includes(id))throw Error('不能移出已确认的必去地点。');if(from>=0){touch(from);p.days[from].stops=p.days[from].stops.filter(x=>x!==id);p.days[from].entryOrder=(p.days[from].entryOrder||[]).filter(x=>x!==id);}
          if(a.type==='defer_stop')p.unassigned=[...new Set([...p.unassigned,id])];else{p.unassigned=p.unassigned.filter(x=>x!==id);p.settings.selected=p.settings.selected.filter(x=>x!==id);p.settings.mustVisit=p.settings.mustVisit.filter(x=>x!==id);}continue;
        }
        const to=a.type==='reorder_stop'?from:Number(a.toDay)-1,target=p.days[to];if(!target||target.type==='transfer'||target.area!==spot.area)throw Error('请选择同地区的游玩日。');
        if(from>=0){touch(from);p.days[from].stops=p.days[from].stops.filter(x=>x!==id);p.days[from].entryOrder=(p.days[from].entryOrder||[]).filter(x=>x!==id);}
        touch(to);target.type='sightseeing';const pos=Math.max(0,Math.min(target.stops.length,Number.isInteger(a.position)?a.position:target.stops.length));target.stops.splice(pos,0,id);
        const order=(target.entryOrder||[]).filter(x=>x!==id);if(a.beforeKey&&order.includes(a.beforeKey))order.splice(order.indexOf(a.beforeKey),0,id);else{const next=target.stops[pos+1];if(next&&order.includes(next))order.splice(order.indexOf(next),0,id);else order.push(id);}target.entryOrder=order;
        p.settings.selected=[...new Set([...p.settings.selected,id])];p.unassigned=p.unassigned.filter(x=>x!==id);continue;
      }
      if(a.type==='move_personal'){
        const place=p.settings.personalPlaces.find(x=>x.id===a.placeId),to=Number(a.toDay);if(!place||!p.days[to-1])throw Error('自选地点或日期无效。');if(place.kind==='hotel')throw Error('住宿日期请使用住宿编辑，保留每天的起终点。');
        const old=place.fromDay;touch(old-1);touch(to-1);place.fromDay=place.toDay=to;const normalized=root.RoamPersonalPlaces.normalize([place])[0];p.settings.personalPlaces=p.settings.personalPlaces.map(x=>x.id===place.id?normalized:x);
        const key=normalized.id+':'+normalized.slot;for(const d of p.days)d.entryOrder=(d.entryOrder||[]).filter(x=>!x.startsWith(place.id+':'));
        const order=p.days[to-1].entryOrder||[];const at=order.indexOf(a.beforeKey);if(at>=0)order.splice(at,0,key);else order.push(key);p.days[to-1].entryOrder=order;continue;
      }
      throw Error('暂不支持这个修改，请换一种描述。');
    }
    for(const i of changed){delete p.days[i].traffic;p.days[i].timings={};p.days[i].userEdited=true;}
    p.userEdited=true;p.savedAt=null;if(p.ai)p.ai.edited=true;
    const checked=root.RoamRules.validatePlan(p);if(!checked||!checked.validation.valid)throw Error(checked?.validation?.violations?.[0]||'修改后的行程未通过检查。');return checked;
  }
  root.RoamJourneyEdit=Object.freeze({apply,signature});
})(typeof window!=='undefined'?window:globalThis);
