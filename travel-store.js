(function(root){
  'use strict';
  const key='roam.yunnan.travel.v1';
  const blank=()=>({version:1,selections:{},mustVisits:{},drafts:{},plans:{},lastArea:'erhai'});
  let state=blank(),available=true;
  try{const stored=JSON.parse(localStorage.getItem(key)||'null');if(stored&&stored.version===1&&['selections','drafts','plans'].every(k=>stored[k]&&typeof stored[k]==='object'&&!Array.isArray(stored[k]))){state=stored;if(!state.mustVisits||typeof state.mustVisits!=='object'||Array.isArray(state.mustVisits))state.mustVisits={};}}catch{state=blank();}
  function write(){try{localStorage.setItem(key,JSON.stringify(state));available=true;return true;}catch{available=false;return false;}}
  function safeSelection(area,ids){return [...new Set((Array.isArray(ids)?ids:[]).filter(id=>root.RoamAttractions.get(id)?.area===area))];}
  root.RoamTravelStore=Object.freeze({
    selection(area){return safeSelection(area,state.selections[area]);},
    select(area,ids){state.selections[area]=safeSelection(area,ids);state.lastArea=area;return write();},
    mustVisits(area){return safeSelection(area,state.mustVisits?.[area]);},
    setMustVisits(area,ids){state.mustVisits[area]=safeSelection(area,ids);return write();},
    draft(area){const draft=state.drafts[area]||{};return root.RoamRules.normalize({...draft,area,selected:draft.areas?.length>1?draft.selected:this.selection(area),mustVisit:draft.mustVisit||this.mustVisits(area)});},
    setDraft(settings){const clean=root.RoamRules.normalize(settings);state.drafts[clean.area]=clean;for(const area of clean.areas){state.selections[area]=clean.selected.filter(id=>root.RoamAttractions.get(id)?.area===area);state.mustVisits[area]=clean.mustVisit.filter(id=>root.RoamAttractions.get(id)?.area===area);}state.lastArea=clean.area;return write();},
    plan(area){return root.RoamRules.validatePlan(state.plans[area]);},
    setPlan(plan){const valid=root.RoamRules.validatePlan(plan);if(!valid)return false;state.plans[valid.settings.area]=valid;state.lastArea=valid.settings.area;return write();},
    lastArea(){return root.RoamDestinations.get(state.lastArea)?state.lastArea:'erhai';},
    available(){return available;}
  });
})(typeof window !== 'undefined' ? window : globalThis);
