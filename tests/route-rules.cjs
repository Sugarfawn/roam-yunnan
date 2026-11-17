require('node:fs').mkdirSync(require('node:path').join(__dirname,'artifacts'),{recursive:true});
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const file of ['home-photos.js','destinations.js','attractions.js','travel-templates.js','travel-rules.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const R=ctx.window.RoamRules,A=ctx.window.RoamAttractions,serial=object=>JSON.parse(JSON.stringify(object));
const a=R.generate({area:'erhai',days:3,pace:'slow',transport:'drive'}),b=R.generate({area:'yulong',days:2,pace:'standard',transport:'public'});
assert.deepEqual(serial(a.days.map(d=>d.stops)),[['dali-old-city','dali-three-pagodas'],['dali-xizhou','dali-yan-courtyard'],['dali-longkan','dali-caicun']]);
assert.deepEqual(serial(b.days.map(d=>d.stops)),[['lijiang-old-city','lijiang-black-dragon'],['lijiang-baisha','lijiang-mural']]);
assert.ok(a.validation.valid&&b.validation.valid);
const must=R.generate({area:'erhai',days:1,selected:['dali-old-city','dali-shuanglang'],mustVisit:['dali-shuanglang']});assert.ok(must.days[0].stops.includes('dali-shuanglang'));assert.ok(must.unassigned.includes('dali-old-city'));
const half=R.generate({area:'erhai',days:1,arrivalWindow:'half'});assert.ok(half.days[0].stops.length<a.days[0].stops.length);assert.equal(half.days[0].assessment.usableMinutes,240);
const late=R.generate({area:'erhai',days:1,arrivalTime:'17:00'});assert.equal(late.days[0].assessment.usableMinutes,60);assert.equal(late.days[0].stops.length,0);
const early=R.generate({area:'erhai',days:2,departureTime:'12:00'});assert.equal(early.days[1].assessment.usableMinutes,180);
const trip=R.generate({area:'erhai',areas:['banna'],days:4});assert.equal(trip.days.filter(d=>d.type==='transfer').length,2);assert.deepEqual(serial(trip.days.filter(d=>d.type==='transfer').map(d=>d.stops)),[[],[]]);
const tooShort=R.generate({area:'erhai',areas:['banna'],days:2,selected:['banna-botanical'],mustVisit:['banna-botanical']});assert.ok(tooShort.unassigned.includes('banna-botanical'));assert.ok(tooShort.unassignedRegions.includes('banna'));
const hike=R.generate({area:'shangri',days:1,arrivalWindow:'half',selected:['shangri-abuji'],mustVisit:['shangri-abuji']});assert.ok(hike.unassigned.includes('shangri-abuji'));assert.equal(hike.days[0].stops.length,0);
const changed=serial(a);changed.days[0].stops.reverse();assert.ok(R.recheck(changed).warnings.some(w=>w.includes('偏离人工模板')));
changed.days[0].stops.push('dali-shuanglang');assert.equal(R.recheck(changed).valid,false);
const over=serial(a);over.settings.arrivalTime='17:00';assert.equal(R.recheck(over).valid,false);assert.equal(over.days[0].assessment.status,'over');
const unknown=R.generate({area:'banna',days:1});assert.equal(unknown.days[0].assessment.status,'unknown');assert.equal(unknown.days[0].assessment.totalDurationMinutes,null);
assert.ok(R.warnings(b).some(w=>w.includes('公共交通')));assert.ok(R.warnings(a).some(w=>w.includes('自驾')));
assert.ok(A.all.every(s=>s.entrance.status==='unknown'&&s.entrance.coordinates===null));assert.ok(A.all.every(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.dataUpdatedAt)&&s.openingHours===null));
for(const spot of A.all){const p=R.generate({area:spot.area,days:1,pace:'standard',selected:[spot.id],mustVisit:[spot.id]});assert.ok(p.days.some(d=>d.stops.includes(spot.id))||p.unassigned.includes(spot.id),spot.id+' must be assigned or explicitly pending');assert.ok(ctx.window.RoamTravelTemplates.areas[spot.area].days.some(t=>t.clusters.includes(spot.cluster)),spot.id+' has an editable region template');}
let runs=0;for(const area of ['erhai','yulong','meili','shangri','banna'])for(const days of [1,2,3,4])for(const pace of ['slow','standard','full'])for(const transport of ['public','drive','undecided'])for(const arrivalWindow of ['full','half']){
 const input={area,days,pace,transport,arrivalWindow},plan=R.generate(input);assert.equal(JSON.stringify(plan),JSON.stringify(R.generate(input)));assert.equal(plan.days.length,days);const ids=plan.days.flatMap(d=>d.stops);assert.equal(ids.length,new Set(ids).size);
 plan.days.filter(d=>d.type==='sightseeing').forEach(d=>{const clusters=[...new Set(d.stops.map(id=>A.get(id).cluster))];assert.ok(clusters.length<=1||(area==='erhai'&&days===4&&ctx.window.RoamTravelTemplates.areas.erhai.days.some(t=>t.id.startsWith('dali4-')&&clusters.every(c=>t.clusters.includes(c)))));assert.equal(d.assessment.realTrafficMinutes,null);assert.equal(d.assessment.totalDurationMinutes,null);});assert.ok(R.validatePlan(plan));runs++;
}
const old={version:1,settings:{area:'erhai',days:1,selected:['dali-old-city']},days:[{zone:'古城片区',stops:['dali-old-city'],notes:[]}],savedAt:'2026-10-28'};assert.equal(R.validatePlan(old).version,2);
const originalCatalog=ctx.window.RoamAttractions;
ctx.window.RoamAttractions={...originalCatalog,get(id){const spot=originalCatalog.get(id);return id==='dali-old-city'?{...spot,openingHours:{verified:true,open:'09:00',close:'10:00'}}:spot;}};
assert.equal(R.recheck(JSON.parse(JSON.stringify(a))).valid,false,'Known opening window too short conflicts with visit requirement');
ctx.window.RoamAttractions=originalCatalog;
const mustConflict=R.generate({area:'erhai',days:1,selected:['dali-shuanglang','dali-xizhou'],mustVisit:['dali-shuanglang','dali-xizhou']});assert.equal(mustConflict.unassigned.length,1,'Conflicting mandatory regions are visible in pending choices');
const fromXizhou=R.generate({area:'erhai',days:3,pace:'slow',transport:'drive',startLocation:'dali-xizhou'});assert.ok(fromXizhou.days[0].stops.includes('dali-xizhou'),'Origin cluster shapes the first day');
const wrongClock=R.normalize({arrivalTime:'<script>',departureTime:'99:99'});assert.equal(wrongClock.arrivalTime,'');assert.equal(wrongClock.departureTime,'');
const snapshot={caseA:serial(a),caseB:serial(b)};fs.writeFileSync(path.join(__dirname,'artifacts','route-v2-demo-output.json'),JSON.stringify(snapshot,null,2));
const storage={};ctx.localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v};vm.runInContext(fs.readFileSync(path.join(root,'travel-store.js'),'utf8'),ctx);assert.ok(ctx.window.RoamTravelStore.setPlan(changed));const restored=ctx.window.RoamTravelStore.plan('erhai');assert.equal(restored.validation.valid,false,'Restoring recomputes feasibility, not trusting the prior status');
const output={passed:true,cases:runs,checks:['classic Dali 3 days','classic Lijiang 2 days public','must visits priority and conflict pending list','half day arrival','late arrival','early departure','cross region return transfer','insufficient days','hike independent full day','manual reorder backtracking review','manual overload validation','known opening window conflicts','origin cluster selection','invalid clock fields','unknown real traffic degrades','data distinction for entrances','legacy restore and storage revalidation']};
fs.writeFileSync(path.join(__dirname,'artifacts','route-v2-unit.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
