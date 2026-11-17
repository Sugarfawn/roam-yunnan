(function(root){
  'use strict';
  const areas={
    meili:{label:'德钦 · 梅里雪山',origins:[['meili-deqin-town','德钦县城片区'],['meili-feilai','飞来寺观景区域']],
      classic:[{pace:'slow',transport:'drive',days:2,sequence:['meili-view-day','meili-river-day']},{pace:'standard',transport:'drive',days:2,sequence:['meili-view-day','meili-glacier-day']},{pace:'full',transport:'drive',days:3,sequence:['meili-view-day','meili-river-day','meili-glacier-day']}],
      days:[
        {id:'meili-view-day',zone:'德钦 · 飞来寺观景区域',cluster:'meili-feilai',clusters:['meili-feilai'],theme:'雪山观景 · 留白等云',ids:['meili-feilai'],periods:['清晨 / 上午'],why:'观景受云层、天气与山路影响；把梅里作为当天主题，不塞入远距离项目。',mobility:'住宿与观景处接驳按当日路况核实，非道路导航。',buffer:'为天气变化预留弹性，不预设日照金山出现时刻。',source:'https://www.diqing.gov.cn/'},
        {id:'meili-river-day',zone:'德钦 · 金沙江沿线',cluster:'meili-river',clusters:['meili-river'],theme:'山谷与河流风景',ids:['meili-moon-bend'],periods:['上午 / 下午'],why:'沿线观景与县城、飞来寺属于不同点位，按开放观景处选择。',mobility:'观景点之间道路可达性未核验。',buffer:'留足山路机动时间。'},
        {id:'meili-glacier-day',zone:'德钦 · 冰川山地',cluster:'meili-glacier',clusters:['meili-glacier'],theme:'高山步行 · 独立留日',ids:['meili-mingyong'],periods:['完整一天 · 按当地管理要求'],why:'冰川山地与高海拔步行需要单独预留体力、天气和向导安排。',mobility:'不提供徒步路线或车程；需先核实当地管理、向导和道路条件。',buffer:'高海拔与步行强度需现场评估。'}
      ]},
    erhai:{label:'大理 · 苍山洱海',origins:[['dali-old-city','大理古城片区住宿'],['dali-xizhou','喜洲片区住宿'],['dali-shuanglang','双廊片区住宿'],['dali-erhai-park','下关片区住宿']],
      classic:[{pace:'slow',transport:'drive',days:3,sequence:['dali-3d-oldtown-west','dali-3d-xizhou','dali-3d-west-shore']},{pace:'slow',transport:'undecided',days:3,sequence:['dali-3d-oldtown-west','dali-3d-xizhou','dali-3d-west-shore']},{pace:'standard',transport:'drive',days:3,sequence:['dali-3d-oldtown-west','dali-3d-xizhou','dali-3d-west-shore']},
        ...['slow','standard','full'].flatMap(pace=>['drive','public','undecided'].map(transport=>({pace,transport,days:4,sequence:['dali-3d-oldtown-west','dali-3d-west-shore','dali-3d-xizhou','dali-3d-shuanglang']})))],
      days:[
        {id:'dali-3d-oldtown-west',zone:'古城片区 · 城区西侧',cluster:'dali-west',clusters:['dali-west'],theme:'古城文化 · 历史建筑',ids:['dali-old-city','dali-three-pagodas'],periods:['上午','下午'],meal:'在古城片区安排午餐与休息，不预设餐厅。',why:'大理古城与其西北侧的崇圣寺三塔可按城区西侧关联景点分段游览。官方景点资料称三塔位于古城西北约 1.5 公里。',mobility:'接驳依住宿点、交通方式与当天路况变化；未接入道路 API，不提供车程。',buffer:'保留午餐和片区内机动余量。',source:'https://www.dalitravel.cn/content/read/233.html'},
        {id:'dali-3d-xizhou',zone:'喜洲片区 · 洱海北岸',cluster:'dali-xizhou',clusters:['dali-xizhou'],theme:'白族古镇 · 院落与街巷',ids:['dali-xizhou','dali-yan-courtyard'],periods:['上午','下午'],meal:'在喜洲片区留出午餐与休息。',why:'喜洲古镇与严家大院同处喜洲片区，以街巷为主线慢游。',mobility:'古城与喜洲往返接驳需按当天交通核实；该日不再叠加其他湖岸片区。',buffer:'院落开放情况出发前确认，预留村镇步行时间。',source:'https://www.dalitravel.cn/'},
        {id:'dali-3d-west-shore',zone:'洱海西岸 · 湖边村落',cluster:'dali-west-shore',clusters:['dali-west-shore'],theme:'湖岸漫步 · 随心取景',ids:['dali-longkan','dali-caicun'],periods:['上午 / 下午','弹性'],meal:'在湖岸附近安排午餐与休息，具体地点现场选择。',why:'龙龛与才村都在洱海西岸大理城区一侧；按住宿位置就近选择一处或两处。',mobility:'湖岸开放入口和点间接驳未核实；不声称有直连步行路线。',buffer:'可删去其中一处，给湖边留白。'},
        {id:'dali-3d-shuanglang',zone:'洱海东北岸 · 双廊',cluster:'dali-shuanglang',clusters:['dali-shuanglang'],theme:'北岸水乡 · 湖边慢游',ids:['dali-shuanglang'],periods:['上午 / 下午','弹性'],meal:'双廊片区午餐，安排休息。',why:'双廊位于洱海东北岸，与古城和喜洲为不同片区；以独立湖岸日避免环湖折返。',mobility:'自驾或公共交通接驳、当日路况与船班未核实。',buffer:'跨岸活动单独留日，不估算往返时间。'},
        {id:'dali-3d-south',zone:'下关 · 洱海南岸',cluster:'dali-south',clusters:['dali-south'],theme:'城市湖岸 · 轻松漫步',ids:['dali-erhai-park'],periods:['半日 / 弹性'],meal:'按住宿和离开时间安排。',why:'洱海公园位于下关侧南岸，可作为抵达或离开缓冲日。',mobility:'与其他湖岸片区之间交通未核实。'}
      ]},
    yulong:{label:'丽江 · 玉龙雪山与古城',origins:[['lijiang-old-city','大研古城片区住宿'],['lijiang-shuhe','束河片区住宿'],['lijiang-baisha','白沙片区住宿'],['lijiang-yulong-mountain','玉龙雪山景区周边住宿']],
      classic:[{pace:'standard',transport:'public',days:2,sequence:['lijiang-2d-city','lijiang-2d-baisha']},{pace:'standard',transport:'undecided',days:2,sequence:['lijiang-2d-city','lijiang-2d-baisha']},{pace:'slow',transport:'public',days:2,sequence:['lijiang-2d-city','lijiang-2d-baisha']}],
      days:[
        {id:'lijiang-2d-city',zone:'大研古城 · 城区北侧',cluster:'lijiang-ancient',clusters:['lijiang-ancient'],theme:'古城街巷 · 黑龙潭公园',ids:['lijiang-old-city','lijiang-black-dragon'],periods:['上午','下午'],meal:'古城城区午餐与休息。',why:'丽江市文旅局的城区旅游环线串联大研古城与黑龙潭，作为城区主题日参考。',mobility:'当前公交班次、步行接驳未核实；不照搬政府旧环线的历史里程。',buffer:'给古城街巷与城区接驳留余量。',source:'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml'},
        {id:'lijiang-2d-baisha',zone:'白沙片区 · 玉龙山麓',cluster:'lijiang-baisha',clusters:['lijiang-baisha'],theme:'纳西古镇 · 壁画与街巷',ids:['lijiang-baisha','lijiang-mural'],periods:['上午','下午'],meal:'白沙片区午餐与休息。',why:'白沙古镇和白沙壁画同在白沙片区，以古镇人文为当日主线。',mobility:'古城、束河到白沙的公交班次需出发前确认。',buffer:'当日不追加玉龙雪山景区或南麓其他片区。',source:'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml'},
        {id:'lijiang-2d-shuhe',zone:'束河片区 · 古镇水巷',cluster:'lijiang-shuhe',clusters:['lijiang-shuhe'],theme:'水巷古镇 · 慢慢闲逛',ids:['lijiang-shuhe'],periods:['上午 / 下午'],meal:'束河片区休息与午餐。',why:'束河为独立古镇片区；住宿在附近或偏好慢游时，可替换白沙日。',mobility:'大研与束河交通未核实，不与白沙拼成精确时刻表。'},
        {id:'lijiang-2d-yulong',zone:'玉龙雪山景区 · 高海拔区域',cluster:'lijiang-yulong',clusters:['lijiang-yulong'],theme:'雪山景区 · 完整预留一天',ids:['lijiang-yulong-mountain','lijiang-yunshanping'],periods:['按景区官方预约时段'],meal:'按景区官方运行时段安排休息与用餐。',why:'玉龙雪山与云杉坪同属景区体系，必须独立留日；两日游中应替换其他一日，不叠加。',mobility:'预约、索道、天气和园内接驳以官方当日信息为准，不估算排队和车程。',buffer:'该日作为唯一主题，留足高海拔适应时间。',source:'https://lijiang.gov.cn/ljsrmzf/c101869/202012/6f8f0b40269c452085a58408b7197c46.shtml'},
        {id:'lijiang-2d-yuhu',zone:'玉龙雪山南麓 · 玉湖片区',cluster:'lijiang-south',clusters:['lijiang-south'],theme:'山麓村落 · 留一点旷野',ids:['lijiang-yuhu','lijiang-yushui'],periods:['上午','下午'],meal:'按村落和园区的实际开放安排。',why:'玉湖与玉水寨位于山麓不同点位，作为机动替换组，不与高海拔景区日强行组合。',mobility:'点间接驳和开放情况出发前核实。'}
      ]},
    shangri:{label:'香格里拉 · 高原湖泊与古城',origins:[['shangri-oldtown','独克宗古城片区'],['shangri-songzanlin','松赞林寺周边'],['shangri-abuji','小中甸方向住宿']],classic:[],days:[
      {id:'shangri-urban',zone:'香格里拉城区',cluster:'shangri-urban',clusters:['shangri-urban'],theme:'高原古城 · 城区人文',ids:['shangri-oldtown','shangri-songzanlin'],periods:['上午','下午'],meal:'城区午餐与休息。',why:'独克宗古城与松赞林寺分属城区内不同位置，按一个城区主题日作为参考，接驳未核实。',mobility:'公共交通、开放时段和宗教礼仪要求出发前确认。'},
      {id:'shangri-wetland',zone:'香格里拉 · 纳帕海周边',cluster:'shangri-wetland',clusters:['shangri-wetland'],theme:'高原湿地 · 季节风景',ids:['shangri-napahai'],periods:['上午 / 下午'],meal:'按当日天气和住宿位置安排。',why:'纳帕海风景随季节变化，独立留出弹性时间。',mobility:'开放观景点与道路随季节和管理情况变化。'},
      {id:'shangri-abuji',zone:'小中甸 · 阿布吉措山地',cluster:'shangri-abuji',clusters:['shangri-abuji'],theme:'高山湖泊 · 徒步一日',ids:['shangri-abuji'],periods:['完整一天 · 按向导及管理要求'],meal:'按当地向导和活动安排准备补给。',why:'高海拔徒步目的地单独一天，避免与城区和湿地拼成不现实的一日线。',mobility:'不提供徒步路线、接驳时间或天气保证；先核实当地管理、向导与体能要求。',buffer:'远程山地活动应留出较大安全余量。'}
    ]},
    banna:{label:'西双版纳 · 雨林与傣乡',origins:[['banna-botanical','勐仑植物园片区'],['banna-gasa','橄榄坝傣族园片区'],['banna-menghai','景洪市区片区']],classic:[],days:[
      {id:'banna-garden',zone:'勐仑 · 热带植物园片区',cluster:'banna-garden',clusters:['banna-garden'],theme:'热带植物 · 雨林生态',ids:['banna-botanical'],periods:['按园区开放时间安排'],meal:'按园区开放和游览范围留出休息。',why:'园区面积大、分区多，独立安排更便于慢游。',mobility:'开放区域、园内接驳和预约以园方当日公告为准。',source:'https://www.xtbg.ac.cn/'},
      {id:'banna-dai',zone:'橄榄坝 · 傣族园',cluster:'banna-dai',clusters:['banna-dai'],theme:'村寨文化 · 傣乡生活',ids:['banna-gasa'],periods:['按园区开放安排'],meal:'以景区及村寨开放时间为准。',why:'村寨、文化活动与景区安排作为同一片区主题。',mobility:'活动时段和交通信息请现场核实。'},
      {id:'banna-hike',zone:'勐腊 · 勐远山地雨林',cluster:'banna-hike',clusters:['banna-hike'],theme:'雨林徒步 · 自然体验',ids:['banna-mengyuan'],periods:['按向导与项目安排'],meal:'按项目服务安排，并自行准备所需补给。',why:'山地雨林体验独立分日，活动取决于园区开放、向导和天气。',mobility:'不自动组合其它县市景点，不生成车程；只参加开放且有组织的线路。',buffer:'注意雨季、山地与林下环境变化。'},
      {id:'banna-city',zone:'景洪 · 澜沧江城区',cluster:'banna-city',clusters:['banna-city'],theme:'城市生活 · 江岸慢游',ids:['banna-menghai'],periods:['上午 / 下午 / 傍晚'],meal:'城区用餐与休息选择丰富，具体营业情况现场确认。',why:'城区较适合作为轻松主题或抵离缓冲日。',mobility:'商户和江岸活动开放状态按现场信息核实。'}
    ]}
  };
  const classic=[
    {id:'dali-three-day-relaxed',area:'erhai',days:3,pace:'slow',transports:['drive','undecided'],region:'erhai',sequence:['dali-3d-oldtown-west','dali-3d-xizhou','dali-3d-west-shore'],anchor:'dali-old-city',reason:'大理三日舒缓参考模板：古城及西侧、喜洲、洱海西岸分日。不是实时车路线，尽量减少跨湖岸折返。'},
    ...['slow','standard','full'].map(pace=>({id:'dali-four-day-'+pace,area:'erhai',days:4,pace,transports:['drive','public','undecided'],region:'erhai',sequence:['dali-3d-oldtown-west','dali-3d-west-shore','dali-3d-xizhou','dali-3d-shuanglang'],anchor:'dali-old-city',reason:'大理四日按古城、海西、喜洲、双廊分日，减少跨岸折返并给洱海停留留出空间。'})),
    {id:'lijiang-two-day-standard-public',area:'yulong',days:2,pace:'standard',transports:['public','undecided'],region:'yulong',sequence:['lijiang-2d-city','lijiang-2d-baisha'],anchor:'lijiang-old-city',reason:'丽江两日公共交通参考模板：城区环线一天、白沙人文片区一天。束河可替换白沙日；玉龙景区建议替换其中一日并单独预留。'}
  ];
  areas.meili.days.push({id:'meili-town-day',zone:'德钦县城',cluster:'meili-town',clusters:['meili-town'],theme:'县城生活 · 休息补给',ids:['meili-deqin-town'],periods:['弹性 / 抵离缓冲'],meal:'按县城商户实际营业安排用餐休息。',why:'县城停留作为独立轻量片区，不与山地徒步拼成一日。',mobility:'到县城的实际道路接驳待核实。'});
  const foothill=areas.yulong.days.find(day=>day.id==='lijiang-2d-yuhu');
  if(foothill)Object.assign(foothill,{cluster:'lijiang-yuhu',clusters:['lijiang-yuhu'],ids:['lijiang-yuhu'],why:'玉湖村单独作为山麓村落主题，未核实交通时不与玉水寨或雪山景区拼接。'});
  areas.yulong.days.push({id:'lijiang-yushui-day',zone:'玉龙山麓 · 玉水寨',cluster:'lijiang-south',clusters:['lijiang-south'],theme:'山麓水景 · 文化游览',ids:['lijiang-yushui'],periods:['上午 / 下午'],meal:'根据园区当日开放安排。',why:'玉水寨作为独立山麓点位，不假设与玉湖村存在已核实接驳。',mobility:'园区入口、接驳与开放安排需官方核实。'});
  const editorialDays=[
    {id:'dali4-city',zone:'古城 · 抵达适应',clusters:['dali-west'],theme:'抵达古城，慢逛街巷',ids:['dali-old-city','dali-wuhua'],why:'把抵达与古城街巷放在同一天，给入住和晚餐留白。'},
    {id:'dali4-west',zone:'海西 · 喜洲',clusters:['dali-west-shore','dali-xizhou'],theme:'海西湖岸，到喜洲慢游',ids:['dali-longkan','dali-panxi','dali-xizhou'],why:'从海西湖岸向北走到喜洲；才村作为替换，避免重复湖岸停留。'},
    {id:'dali4-east',zone:'双廊 · 海东',clusters:['dali-shuanglang','dali-east'],theme:'双廊与海东，分段停留',ids:['dali-shuanglang','dali-xiaoputuo','dali-wenbi'],why:'海东独立一天；挖色或理想邦择一替换，不强行走满所有村镇。'},
    {id:'dali4-return',zone:'三塔 · 山麓 · 返程',clusters:['dali-west','dali-foothill'],theme:'人文山麓，留足返程',ids:['dali-three-pagodas','dali-fengyangyi'],why:'返程日保留主要人文停留；离开较早时删减，苍山索道不默认加入。'}
  ].map(d=>({...d,cluster:d.clusters[0],periods:['上午','下午'],mobility:'道路接驳由高德另行查询；湖岸和山麓内部通行条件需要现场确认。',meal:'用餐与休息留白，不指定未确认商户。'}));
  areas.erhai.days.push(...editorialDays);
  areas.erhai.days.push({id:'dali4-west-direction',zone:'古城至海西北岸',clusters:['dali-west','dali-west-shore','dali-xizhou'],ids:[],periods:['上午','下午'],theme:'沿海西向北，减少折返',why:'可选同侧行进方向，地点数量受抵离和节奏限制。',mobility:'古城至湖岸为道路接驳，生态廊道内部通行另行确认。'});
  areas.erhai.days.push({...editorialDays[2],id:'dali-east-options',clusters:['dali-east'],ids:['dali-wase','dali-xiaoputuo','dali-wenbi','dali-ideal']},{...editorialDays[3],id:'dali-foothill-options',clusters:['dali-foothill'],ids:['dali-fengyangyi','dali-jizhao','dali-canger']});
  for(const item of classic)if(item.area==='erhai'&&item.days===4){item.sequence=editorialDays.map(d=>d.id);item.reason='古城抵达、海西喜洲、海东、山麓返程分日。实际安排按抵离、体力和已查道路调整。';}
  const defaultStart={meili:'meili-feilai',erhai:'dali-old-city',yulong:'lijiang-old-city',shangri:'shangri-oldtown',banna:'banna-botanical'};
  for(const place of root.RoamDestinations.items){
    if(areas[place.id])continue;
    const arrival=place.id+'-arrival';
    areas[place.id]={label:place.city+' · 自由规划',origins:[[arrival,place.city+'抵达片区']],classic:[],days:[]};
    defaultStart[place.id]=arrival;
  }
  root.RoamTravelTemplates=Object.freeze({areas:Object.freeze(areas),classic:Object.freeze(classic.map(Object.freeze)),defaultStart:Object.freeze(defaultStart),paceBudget:Object.freeze({slow:480,standard:540,full:540}),buffer:Object.freeze({meal:60,rest:{slow:45,standard:30,full:20},mobility:60}),preferenceNames:Object.freeze({nature:'自然风光',culture:'古镇人文',photo:'摄影',food:'美食'})});
})(window);
