/* Multiple journeys and explicit user revisions. Old regional storage remains compatible. */
(function(root){
  'use strict';
  const key='roam.yunnan.journeys.v1',clone=x=>JSON.parse(JSON.stringify(x));let available=true;
  let data={version:1,trips:{}};
  try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.version===1&&raw.trips&&typeof raw.trips==='object'&&!Array.isArray(raw.trips))data=raw;}catch{available=false;}
  const id=()=>root.crypto?.randomUUID?.()||'trip-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  function write(){try{localStorage.setItem(key,JSON.stringify(data));available=true;return true;}catch{available=false;return false;}}
  function cleanPayload(payload){const p=clone(payload);if(p.plan){for(const day of p.plan.days){delete day.traffic;}p.plan.savedAt=null;}return p;}
  function save(value,{revision=false,label='更新行程'}={}){if(!value?.id||!value.settings)return false;const before=clone(data);const old=data.trips[value.id],history=old?.history||[];if(revision&&old?.plan){history.push({at:new Date().toISOString(),label:String(label).slice(0,100),payload:cleanPayload({settings:old.settings,plan:old.plan,mode:old.mode,title:old.title,startDate:old.startDate})});}data.trips[value.id]={...old,...clone(value),title:String(value.title||'我的云南旅行').slice(0,70),updatedAt:new Date().toISOString(),createdAt:old?.createdAt||new Date().toISOString(),history:history.slice(-10)};if(!write()){data=before;return false;}return true;}
  function get(tripId){const t=Object.hasOwn(data.trips,tripId)?data.trips[tripId]:null;return t?clone(t):null;}
  function list(){return Object.values(data.trips).filter(t=>t&&typeof t.id==='string'&&typeof t.updatedAt==='string'&&t.settings&&root.RoamDestinations.get(t.settings.area)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(t=>({id:t.id,title:t.title,area:t.settings.area,days:t.settings.days,startDate:t.startDate||'',mode:t.mode,updatedAt:t.updatedAt,hasPlan:Boolean(t.plan),revisions:t.history?.length||0}));}
  function remove(tripId){const before=clone(data);delete data.trips[tripId];if(!write()){data=before;return false;}return true;}
  function restore(tripId,index){const t=get(tripId),entry=t?.history?.[index];if(!entry)return null;const payload=clone(entry.payload);if(!save({...t,...payload},{revision:true,label:'恢复之前的版本'}))return null;return get(tripId);}
  root.RoamTripLibrary=Object.freeze({id,save,get,list,remove,restore,available:()=>available});
})(typeof window!=='undefined'?window:globalThis);
