(function (root) {
  'use strict';
  const attractions = [
    { id:'dali-old-city', area:'erhai', name:'大理古城', zone:'古城片区', kind:['town','culture','photo','food'], intro:'从城门与古街巷之间开始，留意白族院落、老街生活和远处的苍山。', stayNote:'古城片区，可按兴趣慢逛；不预设游览时长。' },
    { id:'dali-three-pagodas', area:'erhai', name:'崇圣寺三塔文化旅游区', zone:'古城片区', kind:['culture','photo'], intro:'大理古城西北侧的历史建筑与文化游览片区，可在现场了解当日开放区域。', stayNote:'古城西侧片区；入园时间与范围以现场公告为准。' },
    { id:'dali-longkan', area:'erhai', name:'龙龛码头与湖岸', zone:'古城南侧湖岸', kind:['nature','photo'], intro:'靠近大理古城南侧的洱海西岸，适合观察湖面、苍山和岸边村落。', stayNote:'洱海西岸；海边步行与停留安排按当天状况调整。' },
    { id:'dali-caicun', area:'erhai', name:'才村与洱海西岸', zone:'古城北侧湖岸', kind:['nature','photo','food'], intro:'从古城北侧前往湖岸与村落，感受洱海边的日常节奏。', stayNote:'古城北侧湖岸片区；不预设精确交通时间。' },
    { id:'dali-xizhou', area:'erhai', name:'喜洲古镇', zone:'洱海北岸 · 喜洲', kind:['town','culture','photo','food'], intro:'沿街巷观察白族民居与当地生活，可把逛巷、休息和用餐节奏留得宽松一些。', stayNote:'喜洲片区；从古城往返属于跨片区移动，另留路上时间。' },
    { id:'dali-yan-courtyard', area:'erhai', name:'严家大院博物馆', zone:'洱海北岸 · 喜洲', kind:['culture','photo'], intro:'喜洲古镇内的院落与展陈空间，可结合古镇街巷一并游览。', stayNote:'喜洲片区；展览及院落开放信息出行前核实。' },
    { id:'dali-shuanglang', area:'erhai', name:'双廊古镇湖岸', zone:'洱海东北岸 · 双廊', kind:['town','nature','photo','food'], intro:'洱海东北岸的村镇与湖岸风景，适合把一天的主题留给水岸与街巷。', stayNote:'位于洱海东北岸，与古城、喜洲为不同片区；建议单独安排片区游览。' },
    { id:'dali-erhai-park', area:'erhai', name:'洱海公园', zone:'下关 · 洱海南岸', kind:['nature','photo'], intro:'下关一侧的洱海南岸公园，可从城市视角观察湖岸与苍山。', stayNote:'下关南岸片区；与古城、喜洲、双廊不视作步行相邻。' },

    { id:'lijiang-old-city', area:'yulong', name:'丽江古城', zone:'大研古城片区', kind:['town','culture','photo','food'], intro:'沿水巷与石板街慢慢走，观察纳西民居、街巷和城市生活。', stayNote:'大研古城片区，可按兴趣慢逛；不预设游览时长。' },
    { id:'lijiang-black-dragon', area:'yulong', name:'黑龙潭公园', zone:'大研古城北侧', kind:['nature','culture','photo'], intro:'古城北侧的公园水景，可结合古城安排，留意远山与水面的景观。', stayNote:'古城北侧片区；公园开放与景观条件以现场为准。' },
    { id:'lijiang-shuhe', area:'yulong', name:'束河古镇', zone:'古城北侧 · 束河', kind:['town','culture','photo','food'], intro:'在古镇街巷、溪边与小店之间放慢脚步。', stayNote:'束河片区；与大研古城属于不同街区，不编造往返时长。' },
    { id:'lijiang-baisha', area:'yulong', name:'白沙古镇', zone:'玉龙雪山南麓 · 白沙', kind:['town','culture','photo'], intro:'玉龙雪山南麓的纳西古镇，可从村落街巷望向雪山。', stayNote:'白沙片区；建议同片区游览，出发前核实开放情况。' },
    { id:'lijiang-mural', area:'yulong', name:'白沙壁画', zone:'玉龙雪山南麓 · 白沙', kind:['culture','photo'], intro:'白沙古镇周边的历史壁画与文化遗存，可与白沙古镇合并安排。', stayNote:'白沙片区；文物点开放状态与参观要求出行前核实。' },
    { id:'lijiang-yuhu', area:'yulong', name:'玉湖村', zone:'玉龙雪山山麓 · 玉湖', kind:['nature','culture','photo'], intro:'玉龙雪山山麓的村落风景，可根据体力与天气决定是否加入行程。', stayNote:'山麓村落；从城镇跨片区前往，另留交通余量。' },
    { id:'lijiang-yulong-mountain', area:'yulong', name:'玉龙雪山景区', zone:'玉龙雪山景区', kind:['nature','photo','highland','dedicated'], intro:'高海拔山地景区，雪山观景与景区活动依开放安排和天气变化。', stayNote:'高海拔，适合单独安排一天；具体景区预约、索道与开放以官方当天信息为准。', caution:'高海拔提示：留意身体状态与天气，不将此景点与多个远距离片区塞进同一天。' },
    { id:'lijiang-yunshanping', area:'yulong', name:'云杉坪', zone:'玉龙雪山景区', kind:['nature','photo','highland','dedicated'], intro:'玉龙雪山景区内的高山草甸观景区域，按景区开放和预约安排游览。', stayNote:'景区内高海拔区域；需先确认当日开放与交通接驳信息。', caution:'高海拔提示：建议与同一景区行程合并，避免再组合远距离景点。' },
    { id:'lijiang-yushui', area:'yulong', name:'玉水寨', zone:'玉龙雪山南麓', kind:['nature','culture','photo'], intro:'玉龙雪山南麓的水景与民族文化游览区域。', stayNote:'山麓片区；可与白沙或周边景点协商安排，实际路况以现场为准。' },

    { id:'meili-feilai', area:'meili', name:'飞来寺观景区域', zone:'德钦 · 飞来寺', kind:['nature','photo','highland'], intro:'在德钦面向梅里雪山的观景区域，等待天气与云层露出卡瓦格博峰线。', stayNote:'德钦观景片区；山路、天气和高原状态需留余量。', caution:'高海拔与山路提示：不据此推算车程；核实路况和天气，按个人身体状态安排。' },
    { id:'meili-moon-bend', area:'meili', name:'金沙江大湾观景区域', zone:'德钦 · 金沙江沿线', kind:['nature','photo'], intro:'在安全开放的观景点远望金沙江转弯和两侧山势。', stayNote:'德钦沿线片区；需依据现场道路与观景点开放情况安排。' },
    { id:'meili-mingyong', area:'meili', name:'明永冰川', zone:'德钦 · 冰川山地', kind:['nature','photo','highland','hike','dedicated'], intro:'梅里雪山区域的冰川与山地步行体验，实际可达范围受天气和管理安排影响。', stayNote:'高海拔徒步类体验，单独安排并预留体力与天气余量。', caution:'高海拔／徒步提示：不建议与长距离跨片区项目拼作轻松的一日游；当地管理或向导要求以官方信息为准。' },
    { id:'meili-deqin-town', area:'meili', name:'德钦县城周边', zone:'德钦县城', kind:['culture','food'], intro:'旅途中在县城停留，了解当地日常并补充休息。', stayNote:'县城活动；商户与服务信息请现场核实。' },

    { id:'shangri-abuji', area:'shangri', name:'香格里拉阿布吉措', zone:'小中甸镇 · 阿布吉措', kind:['nature','photo','highland','hike','dedicated'], intro:'在高山草甸与湖岸之间感受阿布吉措的山地风光。', stayNote:'高海拔徒步型目的地，单独安排并预留天气、向导与体力余量。', caution:'高海拔徒步提示：进山管理与向导要求会变化，出发前核实官方要求；不与其他远距离行程硬凑同日。' },
    { id:'shangri-songzanlin', area:'shangri', name:'噶丹·松赞林寺', zone:'香格里拉城区北侧', kind:['culture','photo'], intro:'了解藏传佛教建筑与香格里拉的人文环境，参观范围遵循现场规定。', stayNote:'城区周边文化景点；开放安排与着装、拍摄要求出发前确认。', caution:'尊重当地宗教礼仪，进入开放区域时遵循管理提示。' },
    { id:'shangri-napahai', area:'shangri', name:'纳帕海周边', zone:'香格里拉城区西北', kind:['nature','photo'], intro:'高原湖盆与季节性湿地风景，可从开放的道路和观景区域感受草甸变化。', stayNote:'季节性湿地；水位、观景区域与道路情况会变化，现场核实。', caution:'请留在开放道路和观景区，避免进入保护区域或驶离允许路线。' },
    { id:'shangri-oldtown', area:'shangri', name:'独克宗古城', zone:'香格里拉城区', kind:['town','culture','food','photo'], intro:'走过古城街巷，了解香格里拉的城市生活与地方文化。', stayNote:'城区步行片区；按兴趣安排，不预设具体游览时长。' },

    { id:'banna-botanical', area:'banna', name:'中国科学院西双版纳热带植物园', zone:'勐仑镇 · 雨林体验区', kind:['nature','photo','dedicated'], intro:'在开放的园区游览区域认识热带植物、林下环境和雨林景观。', stayNote:'园区面积较大；开放区、预约和游览要求请查看园方当天公告。', caution:'本项采用勐仑园区作为雨林体验代表地点，不代表 Jack Wu 照片的实际机位。' },
    { id:'banna-gasa', area:'banna', name:'西双版纳傣族园', zone:'橄榄坝 · 傣族村寨', kind:['culture','photo','food'], intro:'通过村寨空间与地方文化了解傣族生活，尊重当地活动及拍摄规范。', stayNote:'橄榄坝片区；具体开放和活动安排以园区信息为准。' },
    { id:'banna-mengyuan', area:'banna', name:'勐远仙境', zone:'勐腊县 · 山地雨林', kind:['nature','photo','hike','dedicated'], intro:'雨林保护与自然体验区域，户外项目受天气与运营管理影响。', stayNote:'自然体验项目；是否开放、是否需预约或向导以官方当日信息为准。', caution:'雨季、山地及雨林环境变化较快；只参加开放并有管理的活动。' },
    { id:'banna-menghai', area:'banna', name:'景洪市区与澜沧江沿岸', zone:'景洪城区', kind:['food','culture','photo'], intro:'在城区与江岸间放慢节奏，留意本地生活、饮食和水岸景观。', stayNote:'城区片区；商户、活动和公共空间以现场信息为准。' }
  ];
  const coordinates = {
    'meili-feilai':{value:[98.869,28.436],note:'飞来寺观景区域代表点，非具体机位',source:'/data/SOURCES.md'},
    'lijiang-yulong-mountain':{value:[100.176,27.100],note:'玉龙雪山山体代表点，非景区入口',source:'/data/SOURCES.md'},
    'shangri-abuji':{value:[99.907616,27.668792],note:'阿布吉措公开 POI，非徒步路线',source:'https://www.poi86.com/poi/amap/71096.html'},
    'banna-botanical':{value:[101.252,21.929],note:'勐仑热带植物园区域代表点，非入口',source:'/data/SOURCES.md'}
  };
  const sources={erhai:'https://www.dalitravel.cn/',yulong:'https://www.lijiang.gov.cn/',meili:'https://www.diqing.gov.cn/',shangri:'https://dct.yn.gov.cn/',banna:'https://www.xsbn.gov.cn/'};
  const specificSources={
    'dali-old-city':'https://www.dalitravel.cn/content/read/233.html',
    'dali-three-pagodas':'https://www.dalitravel.cn/content/read/162.html',
    'lijiang-old-city':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-black-dragon':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-shuhe':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-baisha':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-yuhu':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-yushui':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'lijiang-yulong-mountain':'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml',
    'banna-botanical':'https://www.xsbn.gov.cn/lfw/84148.news.detail.dhtml?news_id=2914471',
    'banna-mengyuan':'https://www.xsbn.gov.cn/lfw/84148.news.detail.dhtml?news_id=2914471'
  };
  const clusters={'dali-old-city':'dali-west','dali-three-pagodas':'dali-west','dali-longkan':'dali-west-shore','dali-caicun':'dali-west-shore','dali-xizhou':'dali-xizhou','dali-yan-courtyard':'dali-xizhou','dali-shuanglang':'dali-shuanglang','dali-erhai-park':'dali-south','lijiang-old-city':'lijiang-ancient','lijiang-black-dragon':'lijiang-ancient','lijiang-baisha':'lijiang-baisha','lijiang-mural':'lijiang-baisha','lijiang-shuhe':'lijiang-shuhe','lijiang-yulong-mountain':'lijiang-yulong','lijiang-yunshanping':'lijiang-yulong','lijiang-yushui':'lijiang-south'};
  const estimates={
    'dali-wuhua':{min:30,max:60,basis:'编辑游览参考'},'dali-panxi':{min:40,max:70,basis:'编辑湖岸停留参考'},'dali-wase':{min:40,max:70,basis:'编辑镇区停留参考'},'dali-xiaoputuo':{min:30,max:60,basis:'编辑岸边观景参考，不含乘船'},'dali-wenbi':{min:40,max:80,basis:'编辑村落停留参考'},'dali-ideal':{min:40,max:80,basis:'编辑街区停留参考'},'dali-fengyangyi':{min:60,max:100,basis:'编辑村落慢行参考'},'dali-jizhao':{min:60,max:100,basis:'编辑山麓步行参考'},'dali-canger':{min:20,max:40,basis:'编辑短暂停留参考'},
    'dali-old-city':{min:120,max:180,basis:'编排估算：古城街巷慢逛，不含交通。'},'dali-three-pagodas':{min:90,max:150,basis:'编排估算：含主要开放区步行，不含交通。'},'dali-longkan':{min:60,max:90,basis:'编排估算：湖岸停留，不含交通。'},'dali-caicun':{min:60,max:90,basis:'编排估算：村落与湖岸漫步，不含交通。'},'dali-xizhou':{min:90,max:150,basis:'编排估算：古镇街巷与村落游览，不含交通。'},'dali-yan-courtyard':{min:45,max:90,basis:'编排估算：院落与展陈参观，不含交通；开放状态另核。'},'dali-shuanglang':{min:120,max:180,basis:'编排估算：镇区与湖岸漫步，不含交通。'},'dali-erhai-park':{min:60,max:90,basis:'编排估算：公园与湖岸活动，不含交通。'},
    'lijiang-old-city':{min:120,max:180,basis:'编排估算：古城街巷慢逛，不含交通。'},'lijiang-black-dragon':{min:60,max:90,basis:'编排估算：公园水景停留，不含交通。'},'lijiang-shuhe':{min:90,max:150,basis:'编排估算：古镇街巷慢逛，不含交通。'},'lijiang-baisha':{min:90,max:150,basis:'编排估算：古镇街巷慢逛，不含交通。'},'lijiang-mural':{min:45,max:90,basis:'编排估算：展陈参观，不含交通；开放状态另核。'},'lijiang-yuhu':{min:90,max:150,basis:'编排估算：村落漫步，不含交通。'},'lijiang-yulong-mountain':{min:240,max:360,basis:'编排估算：景区体验；索道排队、预约与接驳不含在内。'},'lijiang-yunshanping':{min:90,max:150,basis:'编排估算：景区内观景；索道与接驳不含在内。'}
  };
  Object.assign(clusters,{'lijiang-yuhu':'lijiang-yuhu','meili-feilai':'meili-feilai','meili-moon-bend':'meili-river','meili-mingyong':'meili-glacier','meili-deqin-town':'meili-town','shangri-oldtown':'shangri-urban','shangri-songzanlin':'shangri-urban','shangri-napahai':'shangri-wetland','shangri-abuji':'shangri-abuji','banna-botanical':'banna-garden','banna-gasa':'banna-dai','banna-mengyuan':'banna-hike','banna-menghai':'banna-city'});
  const catalogue=attractions.map(item=>Object.freeze({...item,cluster:clusters[item.id]||item.zone,estimate:estimates[item.id]?Object.freeze({...estimates[item.id],kind:'editorial-estimate',source:'项目组保守游览预算；不是官方耗时或道路数据',updatedAt:'2026-10-29'}):null,entrance:Object.freeze({coordinates:null,status:'unknown',note:'未能确认具体开放入口，暂不定位；地图地区锚点不是景点入口。'}),openingHours:null,reservation:Object.freeze({status:'unverified',note:item.kind.includes('highland')||item.kind.includes('dedicated')?'景区票务、索道、园内交通与预约需官方当天核实。':'具体开放与预约条件未核实。',source:specificSources[item.id]||sources[item.area]}),transport:Object.freeze({status:'unverified',public:item.kind.includes('hike')?'山地起点或向导接驳未核实，不承诺公交可达':'未核实当前公交、换乘或景区接驳班次',drive:item.kind.includes('hike')?'自驾仅可能覆盖道路接驳，不代替徒步或向导':'停车点、开放入口和道路时间待确认'}),preferredPeriods:Object.freeze(item.kind.includes('hike')?['完整游玩日']:item.id==='meili-feilai'?['清晨观景，须提前入住并确认天气']:['上午','下午']),coordinates:coordinates[item.id]?.value||null,coordinateRole:'destination-reference-only',coordinateNote:coordinates[item.id]?.note||'坐标尚未确认，暂不在地图定位',coordinateSource:coordinates[item.id]?.source||null,source:specificSources[item.id]||sources[item.area],dataUpdatedAt:'2026-10-29',image:root.HomePhotos.find(photo=>photo.id===item.area).card,photoContext:'使用该地区旅行摄影作为氛围配图，并非此景点的独立实拍。'}));
  const additions=[
    ['dali-wuhua','五华楼','大理古城街巷','dali-west',['town','culture','photo'],'与古城街巷一起慢逛；登楼开放以现场为准。'],
    ['dali-panxi','磻溪村S湾','海西湖岸','dali-west-shore',['nature','photo'],'沿开放湖岸慢行；生态廊道交通准入以现场管理为准。'],
    ['dali-wase','挖色镇','洱海东岸','dali-east',['town','photo','food'],'海东镇区与岸边分段停留，勿在通行道路随意停车。'],
    ['dali-xiaoputuo','小普陀','洱海东岸','dali-east',['nature','culture','photo'],'先以岸边观景安排；登岛船班、开放与费用另行确认。'],
    ['dali-wenbi','文笔村','洱海东岸','dali-east',['town','photo'],'村路与商户空间分开看待，拍摄点准入和消费条件需现场确认。'],
    ['dali-ideal','理想邦旅游度假小镇','海东南侧','dali-east',['photo','food'],'作为海东备选停留，不默认包含商户、酒店内部空间。'],
    ['dali-fengyangyi','凤阳邑','苍山山麓','dali-foothill',['town','culture','photo'],'沿村落街巷慢行，留意居民生活和实际开放区域。'],
    ['dali-jizhao','寂照庵','苍山山麓','dali-foothill',['nature','culture'],'山麓步行按体力与天气决定；不预设用餐和开放承诺。'],
    ['dali-canger','苍洱大道','苍山山麓','dali-foothill',['photo'],'仅在允许安全停留的位置观景，不能在车行道路拍摄。']
  ];
  for(const [id,name,zone,cluster,kind,intro] of additions)catalogue.push(Object.freeze({id,area:'erhai',name,zone,cluster,kind,intro,stayNote:'停留为编辑估算，交通另查。',estimate:{...estimates[id],kind:'editorial-estimate',source:'项目组游览参考；非官方时长'},entrance:{coordinates:null,status:'unknown'},coordinates:null,openingHours:null,reservation:{status:'unverified'},transport:{status:'unverified'},source:'https://www.yndali.gov.cn/',dataUpdatedAt:'2026-11-17'}));
  window.RoamAttractions = Object.freeze({
    all: Object.freeze(catalogue),
    byRegion: Object.freeze(Object.fromEntries(['meili','erhai','yulong','shangri','banna'].map(area => [area, Object.freeze(catalogue.filter(item => item.area === area))]))),
    get(id) { return catalogue.find(item => item.id === id) || null; }
  });
})(window);
