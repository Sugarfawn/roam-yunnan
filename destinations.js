(function () {
  'use strict';

  // The map points identify destinations, not the exact camera positions of the photographs.
  const places = {
    meili: {
      shortName: '梅里雪山', region: '迪庆 · 德钦', county: '迪庆藏族自治州德钦县', prefectureAdcode:533400,
      coordinates: [98.869, 28.436], coordinateLabel: '飞来寺观景区域', coordinatePrecision: '区域代表点',
      category: '雪山与晨光', english: 'MEILI SNOW MOUNTAINS',
      lead: '把第一缕光，留给雪山。',
      introduction: '在德钦，群峰沿着高原天际线展开。从观景区域望向梅里，让山的轮廓和光线替旅程写下开场。',
      story: '梅里雪山位于云南西北部。这里的风景不只有雪峰，也有云层、峡谷与藏地村落。与其追赶一张标准照片，不如留足时间，等待属于当天的光。',
      highlights: ['在观景区域等待山峰显露', '观察云层与雪线的变化', '用相机记录高原天际线'],
      practical: '高原地区天气变化快。观景前核实天气和当地道路状况，量力安排活动；本页不提供登山或徒步线路。',
      labelOffset: [-180, -32],
      source: 'https://baike.baidu.com/item/梅里雪山/251340'
    },
    erhai: {
      shortName: '大理洱海', region: '大理 · 洱海', county: '大理白族自治州大理市', prefectureAdcode:532900,
      coordinates: [100.197, 25.779], coordinateLabel: '洱海中部水域', coordinatePrecision: '湖区代表点',
      category: '湖泊与夕光', english: 'ERHAI LAKE',
      lead: '看一场日落，慢慢认识大理。',
      introduction: '苍山与洱海之间，村落、小路和水面的光共同构成大理。把行程放慢，让一段沿湖的漫步成为目的本身。',
      story: '洱海是大理山水景观的重要组成部分。不同湖岸有不同的生活节奏：有开阔的水面，也有安静的村落。照片里的夕光是一种邀请，实际行程则从选择一段合适的湖岸开始。',
      highlights: ['沿开放的湖岸步道散步', '观察水面与远山的光影', '走进湖边村落与街巷'],
      practical: '图中标记位于湖区中部，用于省域定位，并非上车点或游览入口。请按实际选择的岸线核实交通与开放范围。',
      labelOffset: [42, 15],
      source: 'https://baike.baidu.com/item/洱海'
    },
    yulong: {
      shortName: '玉龙雪山', region: '丽江 · 玉龙', county: '丽江市玉龙纳西族自治县', prefectureAdcode:530700,
      coordinates: [100.176, 27.100], coordinateLabel: '玉龙雪山山体', coordinatePrecision: '山体代表点',
      category: '雪峰与倒影', english: 'JADE DRAGON SNOW MOUNTAIN',
      lead: '往山的方向，遇见更开阔的自己。',
      introduction: '雪线映着高原长空，山峰的倒影留在水面。玉龙雪山让丽江的旅行多了一种尺度：从街巷走向群峰。',
      story: '玉龙雪山位于丽江北侧。晴天、云雾、晨光，会让同一片山体呈现完全不同的表情。选一处合适的观景位置，给这份开阔留一点时间。',
      highlights: ['远望雪峰与高原天际线', '记录晨光中的山体色彩', '感受丽江山地景观的层次'],
      practical: '山体标记不是景区检票口。索道、景区预约及天气限制请以官方实时信息为准，高海拔活动应考虑个人身体状况。',
      labelOffset: [-175, 8],
      source: 'https://baike.baidu.com/item/玉龙雪山'
    },
    shangri: {
      shortName: '阿布吉措', region: '香格里拉 · 小中甸', county: '迪庆藏族自治州香格里拉市小中甸镇', prefectureAdcode:533400,
      coordinates: [99.907616, 27.668792], coordinateLabel: '阿布吉措湖区', coordinatePrecision: '地点 POI',
      category: '高山湖泊与草坡', english: 'ABUJI CUO · SHANGRI-LA',
      lead: '在群山之间，遇见一抹湖光。',
      introduction: '群山围拢着绿松石色的湖水，草坡延向远处。阿布吉措的安静，属于愿意慢下来观察的人。',
      story: '阿布吉措位于香格里拉小中甸镇的山地环境中，与普达措是不同地点。这里的高山湖泊、岩壁和草坡构成层次鲜明的风景，也需要对自然条件保持尊重。',
      highlights: ['欣赏湖水与山体的色彩对比', '观察草甸、岩壁与雪线层次', '在合适条件下记录高山湖景'],
      practical: '高山野外环境对天气、体能和向导条件有要求。请出发前核实当地管理要求；本页是目的地介绍，不是徒步导航或安全路线。',
      labelOffset: [43, -24],
      source: 'https://www.poi86.com/poi/amap/71096.html'
    },
    banna: {
      shortName: '西双版纳雨林', region: '西双版纳 · 勐仑', county: '西双版纳傣族自治州勐腊县勐仑镇', prefectureAdcode:532800,
      coordinates: [101.252, 21.929], coordinateLabel: '勐仑热带植物园区域', coordinatePrecision: '雨林体验区域代表点',
      category: '热带森林与植物', english: 'TROPICAL XISHUANGBANNA',
      lead: '走进绿色，让感官重新出发。',
      introduction: '热带叶片、层叠树影与湿润空气，让云南的南端呈现另一种风景。在西双版纳，慢下来认识植物与森林。',
      story: '西双版纳的热带森林分布于多个区域，并非一个单独景点。地图以勐仑热带植物园区域作为探索入口，展示雨林体验的地理位置，不代表 Jack Wu 这张照片的精确拍摄位置。',
      highlights: ['在开放的游览区域认识热带植物', '观察叶片、藤本与林下层次', '用照片收集森林里的绿色'],
      practical: '此标记为区域代表点。选择实际游览地点后，再核实开放时间、园区预约及交通；请留在允许进入的游览范围内。',
      labelOffset: [43, 12],
      source: 'https://www.xtbg.ac.cn/'
    }
  };

  // Presentation copy stays beside destination data; itinerary facts remain in attractions.js.
  const journals = {
    erhai: {region:'大理白族自治州 · 云南',overviewTitle:'在苍山与洱海之间，慢下来。',catalogueTitle:'挑几处，放进你的大理。',catalogueIntro:'古城、湖岸、村落，各有各的节奏。选择你真正想去的地方。',photoPosition:'50% 52%'},
    yulong: {region:'丽江 · 玉龙 · 云南',displayName:'丽江 · 玉龙雪山',overviewTitle:'从石板街巷，走向雪山。',overviewText:'大研古城的水巷、白沙的村落与雪山南麓，构成丽江不同的旅行片段。先挑选真正感兴趣的片区，再给街巷、山景和休息各留一些时间。',catalogueTitle:'挑几处，放进你的丽江。',catalogueIntro:'古城、村落与雪山，按片区认识丽江，不必一次走遍。',photoPosition:'50% 10%',riskTitle:'雪山体验，需要单独留白。',riskNote:'玉龙雪山、云杉坪涉及高海拔与景区接驳。预约、索道、天气和个人身体状态出发前另行确认，不与多个远距离片区塞进同一天。'},
    meili: {region:'迪庆 · 德钦 · 云南',overviewTitle:'等一束光，也给旅途留些空白。',overviewText:'观景区域、县城与冰川山地，是德钦不同的旅行片段。观景不等于登山；等待雪峰显露时，也给天气变化、山路接驳和身体适应留出余量。',catalogueTitle:'挑几处，放进你的德钦。',catalogueIntro:'把观景、休息与山地体验分开考虑，按当天条件决定走多远。',photoPosition:'50% 35%',riskTitle:'先适应高原，再决定走多远。',riskNote:'德钦涉及高海拔和山路。明永冰川属于山地步行体验，需单独考虑体力、天气及当地管理要求；本页不提供登山或徒步导航。'},
    shangri: {region:'迪庆 · 香格里拉 · 云南',displayName:'香格里拉 · 阿布吉措',overviewTitle:'在高原，把脚步交给风景。',overviewText:'古城街巷、寺院建筑与季节性湿地，是认识香格里拉的不同方式。阿布吉措则属于另需准备的高山徒步体验，选择前先了解天气、管理与向导要求。',catalogueTitle:'挑几处，放进你的香格里拉。',catalogueIntro:'城区人文、湿地与高山湖泊，各留适合自己的时间。',photoPosition:'50% 62%',riskTitle:'高山湖泊，不等于普通城区散步。',riskNote:'阿布吉措涉及高海拔徒步，应独立安排并核实进山管理与向导要求。纳帕海水位和开放道路随季节变化；寺院参观请遵循当地礼仪。'},
    banna: {region:'西双版纳 · 云南',overviewTitle:'从一片叶子，认识云南的南端。',overviewText:'在开放园区认识热带植物，在村寨和江岸感受日常。勐仑、橄榄坝、勐远与景洪属于不同片区，选择一两种感兴趣的体验，再按片区留出接驳与休息。',catalogueTitle:'挑几处，放进你的西双版纳。',catalogueIntro:'植物、村寨、江岸与雨林体验，选你真正想停留的地方。',photoPosition:'50% 55%',riskTitle:'雨林体验，以开放范围为边界。',riskNote:'园区开放、预约和户外活动受天气与现场管理影响。雨季及山地活动需核实管理要求，只进入允许游览的区域；顶部摄影不代表具体园区或拍摄入口。'}
  };
  const plannerPhotoPositions={meili:'50% 12%',erhai:'50% 34%',yulong:'50% 5%',shangri:'50% 60%',banna:'50% 50%'};
  // Regions without editorial content remain valid planning entry points. They deliberately have
  // no borrowed photo or invented catalogue; users start with an empty trip and real POIs.
  const regionalEntries=[
    ['kunming','昆明','昆明市',530100,'KUNMING'],['qujing','曲靖','曲靖市',530300,'QUJING'],
    ['yuxi','玉溪','玉溪市',530400,'YUXI'],['baoshan','保山','保山市',530500,'BAOSHAN'],
    ['zhaotong','昭通','昭通市',530600,'ZHAOTONG'],['puer','普洱','普洱市',530800,"PU'ER"],
    ['lincang','临沧','临沧市',530900,'LINCANG'],['chuxiong','楚雄','楚雄彝族自治州',532300,'CHUXIONG'],
    ['honghe','红河','红河哈尼族彝族自治州',532500,'HONGHE'],['wenshan','文山','文山壮族苗族自治州',532600,'WENSHAN'],
    ['dehong','德宏','德宏傣族景颇族自治州',533100,'DEHONG'],['nujiang','怒江','怒江傈僳族自治州',533300,'NUJIANG']
  ];
  const featuredItems = Object.entries(places).map(([id,place])=>{
    const photo=place.photo||window.HomePhotos.find(item=>item.id===id);
    if(!photo)throw Error('Destination photo record missing: '+id);
    return Object.freeze({...photo,...place,id,source:photo.source,locationSource:place.source,hasPhoto:true,hasCatalogue:true,
      journal:Object.freeze({...(place.journal||journals[id]||{region:place.region,overviewTitle:place.lead,catalogueTitle:'挑选想去的地方。',catalogueIntro:place.introduction,photoPosition:photo.position||'50% 50%'}),plannerPhotoPosition:place.journal?.plannerPhotoPosition||plannerPhotoPositions[id]||photo.position||'50% 50%'}),
      mapUrl:'/explore/yunnan/?place='+id,detailUrl:'/destinations/detail.html?id='+id});
  });
  const regionalItems=regionalEntries.map(([id,city,region,prefectureAdcode,english])=>Object.freeze({
    id,city,shortName:city,region,county:region,prefectureAdcode,english,category:'自由规划',hasPhoto:false,hasCatalogue:false,
    introduction:'这里已经开放为旅行目的地。专属图片和景点内容稍后补充，现在可以先建立空白行程，再通过真实地图搜索添加想去的地点。',
    mapUrl:'/explore/yunnan/?place='+id,detailUrl:'/explore/yunnan/?place='+id
  }));
  const items=[...featuredItems,...regionalItems];
  window.RoamDestinations = Object.freeze({
    items: Object.freeze(items),
    get(id) { return items.find(item => item.id === id) || null; }
  });
})();
