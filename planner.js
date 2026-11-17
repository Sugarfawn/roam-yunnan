(function(root){
  'use strict';
  const cities=typeof module!=='undefined'&&module.exports?require('./cities.js'):root.RoamCities;
  const places=cities.flatMap(c=>c.places),byId=Object.fromEntries(places.map(p=>[p.id,p]));
  function getCity(value){const city=cities.find(c=>c.id===value||c.name===value);if(!city)throw new Error('请选择已开放的云南目的地');return city;}
  function distance(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
  function generate(settings){
    const city=getCity(settings.city),days=Math.max(1,Math.min(3,Number(settings.days)||2));
    const interests=Array.isArray(settings.interests)?settings.interests:[];
    const count=settings.pace==='slow'?3:settings.pace==='full'?5:4;
    return Array.from({length:days},(_,i)=>{
      const route=city.routes[i];
      const ranked=route.ids.map((id,index)=>({id,index,score:interests.includes(byId[id].kind)?1:0})).sort((a,b)=>b.score-a.score||a.index-b.index);
      const ids=ranked.slice(0,count).sort((a,b)=>a.index-b.index).map(x=>x.id);
      return {cityId:city.id,title:route.title,subtitle:route.subtitle,stops:ids};
    });
  }
  function schedule(day,pace){
    let minute=9*60,km=0;
    const rows=day.stops.map((id,i)=>{
      const p=byId[id];let travel=0;
      if(i){const d=distance(byId[day.stops[i-1]],p);km+=d;travel=Math.max(10,Math.ceil((d<1.3?d/4*60:d/25*60+15)/5)*5);minute+=travel;}
      if(i===2)minute+=60;
      const start=minute,duration=p.duration+(pace==='slow'?15:0);minute+=duration;
      return {...p,duration,start,end:minute,travel};
    });
    const tickets=rows.reduce((sum,p)=>sum+p.fee,0),transit=rows.length?Math.max(15,Math.ceil(km*4)):0,food=rows.length?100:0;
    return {rows,km,tickets,transit,food,cost:tickets+transit+food,end:minute};
  }
  function alternatives(plan,dayIndex,stopIndex){
    const day=plan[dayIndex],city=getCity(day.cityId),ids=day.stops;
    const current=byId[ids[stopIndex]]||byId[ids[ids.length-1]]||city.places[0];
    const used=new Set(plan.flatMap(d=>d.stops));
    return city.places.filter(p=>!used.has(p.id)).sort((a,b)=>distance(current,a)-distance(current,b)).slice(0,6);
  }
  function mapPoints(plan){
    const ids=[...new Set(plan.flatMap(d=>d.stops))];if(!ids.length)return [];
    const pts=ids.map(id=>byId[id]),city=getCity(plan[0].cityId);
    const xs=pts.map(p=>p.lng*Math.cos(city.places[0].lat*Math.PI/180)),ys=pts.map(p=>p.lat);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const scale=Math.min(760/Math.max(maxX-minX,.015),250/Math.max(maxY-minY,.015));
    return pts.map((p,i)=>({...p,x:480+(xs[i]-(minX+maxX)/2)*scale,y:198-(ys[i]-(minY+maxY)/2)*scale,index:i+1,day:plan.findIndex(d=>d.stops.includes(p.id))}));
  }
  function clock(n){const days=Math.floor(n/1440);n=((n%1440)+1440)%1440;return `${days>0?'次日 ':''}${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
  function dayDate(start,index){const d=new Date(start+'T12:00:00');if(Number.isNaN(d.getTime()))return '';d.setDate(d.getDate()+index);return `${d.getMonth()+1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`;}
  const api={cities,places,byId,getCity,distance,generate,schedule,alternatives,mapPoints,clock,dayDate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TripPlanner=api;
})(typeof window!=='undefined'?window:globalThis);
