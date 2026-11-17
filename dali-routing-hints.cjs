/* Geographic directions are editorial advice, not measured roads or a fixed itinerary. */
function hints(settings){if(settings.area!=='erhai')return'';return `大理排序依据：用户攻略只作行进方向参考，不是固定日序或最短路线证明。
海西：大理古城→龙龛码头→才村（若选）→磻溪S湾→喜洲。海东：理想邦→文笔村→小普陀→挖色→双廊。结合住宿和抵达点可整体反向，但不要无理由在同一方向来回跳跃。洱海是范围，不要增加湖中心站点。
沙溪古镇、玉津桥、沙溪集市、欧阳大院、兴教寺只有用户搜索确认才安排；组成独立一日，不和洱海核心景点拼在同一天。不可擅自加入或编造集市日期。若某天已有沙溪个人POI，请把当天目录stops留空，用theme/reason解释沙溪游玩，而非称为休息日。
人文方向苍洱大道、寂照庵、三塔、凤阳邑、兴盛大桥需结合住宿、返程和实际位置取舍，不保证照抄就顺路。实际selected和个人POI优先，不补未选地点；时间不足留待安排并解释。
每个day可额外返回order数组：用本日目录stops的ID和本日非酒店personalPlaces的完整id表示综合顺序。提供order时必须完整覆盖这些地点，每个一次；不能改变个人POI日期，不能创造ID。酒店自动放在日首日尾，不放进order。只有个人POI的日期也要写具体theme/reason。不得声称道路已核实或已证明最优。`;}
module.exports={hints};
