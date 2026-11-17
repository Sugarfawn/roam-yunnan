/* Preserve the model's dates and selected places; only remove same-shore zigzags. */
const chains=[['dali-old-city','dali-longkan','dali-caicun','dali-panxi','dali-xizhou'],['dali-ideal','dali-wenbi','dali-xiaoputuo','dali-wase','dali-shuanglang']];
function normalize(proposal,settings){
 if(settings.area!=='erhai')return [];
 const changed=[];
 for(const day of proposal.days){
  for(const chain of chains){
   const positions=day.stops.map((id,i)=>chain.includes(id)?i:-1).filter(i=>i>=0);
   const before=positions.map(i=>day.stops[i]);
   if(before.length<2)continue;
   const sorted=[...before].sort((a,b)=>chain.indexOf(a)-chain.indexOf(b));
   if(before.some((id,i)=>id!==sorted[i])){
    positions.forEach((p,i)=>day.stops[p]=sorted[i]);
    if(Array.isArray(day.order)){const slots=day.order.map((id,i)=>before.includes(id)?i:-1).filter(i=>i>=0);slots.forEach((p,i)=>day.order[p]=sorted[i]);}
    changed.push({day:day.dayNumber,reason:'当天地点按同侧行进方向整理，实际道路由高德核验。'});
   }
  }
 }
 return changed;
}
module.exports={normalize};
