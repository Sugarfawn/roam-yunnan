# 酒店、餐厅与自选地点接入

更新：规划已改为“先选地点，再自动安排”，结果地图同时支持目录景点的POI绑定和实际驾车/步行/公交路段。当前实现及限制以 [PLANNING-EXPERIENCE.md](PLANNING-EXPERIENCE.md) 为准；以下是最初酒店餐厅接入的阶段记录。

页面入口：`/explore/yunnan/planner/?place=erhai&view=edit`，第04项“住在哪里，吃点什么”。结果页保存状态旁也有添加入口。

## 实际接入

- 高德 JS API 2.0 在线加载，`AMap.PlaceSearch` 按当前目的地和类型查询真实 POI；不会把手动输入的名字当成查询成功。
- 查询列表可能不带行政区编码。用户选择后调用 `AMap.Geocoder.getAddress` 确认所属地区；只接收云南省内且有有效坐标的地点。
- 搜索框、结果列表、地图选中、日期与时段确认均使用实际接口。无结果、断网或鉴权失败明确提示，并允许重试。
- 酒店可覆盖多天，作为每天出发与返回的地点。支持不同日期选择不同酒店，同一天重复酒店会阻止添加。
- 餐厅选择具体日期和午餐/晚餐；其他地点选择上午、下午、傍晚。可调整日期、删除，生成后也可编辑。
- 当天酒店、餐厅在结果右侧使用真实高德底图显示。未核实具体入口的原景点不标到假位置，也不把省域代表点混作入口。

## 数据与恢复

`travel-personal-places.js` 负责自选地点的白名单规范化、日期分配、重复/重叠检查和日程顺序。地点字段包括来源、POI ID、名称、地址、城市、行政区编码、GCJ-02坐标、用途、日期和时段。位置角色明确为 `provider-poi-not-verified-entrance`。

新数据存在 `settings.personalPlaces` 中，沿用 `roam.yunnan.travel.v1` 本地存储，无需账号或数据库。旧景点目录、已选景点和原有计划可继续读取。原本的版本2计划无需作破坏性迁移。

缩短天数时不静默删除日期范围外的地点，会在表单和结果提醒中显示；回到编辑页可调整。各目的地草稿独立保存。离线仍能看到已保存的名称、日期和顺序，地图错误不影响恢复。

## 限制

此版本完成真实搜索、点位确认与行程加入，未接道路路径、实时交通、预订或营业状态核验。原景点仍使用人工模板；新增酒店和餐厅尚未据道路重新优化。基础预算不包含新增停留及接驳，界面直接提示这一点，不能把“规则校验可保存”等同于真实道路可行。

餐厅在第一站之后插入午餐、其余景点之后插入晚餐，仅表达编辑顺序。高海拔整日/徒步、跨地区、同一餐段多家餐厅会另外提醒，需由用户确认或改期。没有道路响应时不画导航路线、里程或预计车程。

## 本地配置

所有者提供的开发凭证写入 `map-config.local.js`，此文件已加入项目 `.gitignore`；公开示例为 `map-config.example.js`，不含凭证。高德SDK本身在线加载，不复制到本地。

当前为本地演示配置。公开部署前按高德官方安全配置接 `serviceHost` 代理并将安全密钥放到服务端；不要直接发布本地配置文件。此处不记录或复述真实凭证。

官方文档核对于2026-10-29：

- [创建 Web端 JS API Key](https://lbs.amap.com/api/javascript-api-v2/prerequisites)
- [JS API 加载](https://lbs.amap.com/api/javascript-api-v2/guide/abc/load)
- [地点搜索](https://lbs.amap.com/api/javascript-api-v2/guide/services/autocomplete)
- [安全密钥配置](https://lbs.amap.com/api/javascript-api-v2/guide/abc/prepare)

## 验证

- `node work/verify-amap-personal-live.cjs`：实际高德网络调用与浏览器地图，真实酒店与餐厅、位置确认、日期安排、保存刷新、移除和手机布局。报告 `验证截图/amap-personal-live-verification.json`。报告与截图不包含凭证。
- `node work/personal-places-check.cjs`：纯数据测试，明确使用测试夹具，覆盖边界/重复/重叠/跨地区/日期缩短/存储。
- `node work/verify-personal-places-offline.cjs`：明确阻断高德网络并使用测试夹具，验证错误提示、重试和离线恢复；不能用此报告声称真实搜索成功。
- 原有360组景点规则、窗口适配和地图到规划的流程继续回归。
