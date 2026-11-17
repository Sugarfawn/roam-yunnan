# 漫游 ROAM

## 当前规划页：顶部宽幅摄影与半透明工作区

根据用户确认，将原右侧小照片移动为规划编辑页顶部的宽幅摄影横图；导航叠在照片上，下面是淡化同张照片衬托的米白半透明工作区。右侧只保留地点清单，避免重复照片。照片标题、英文、摄影署名和裁切随目的地切换；裁切位于 `destinations.js` 的 `journal.plannerPhotoPosition`。结果页继续突出路线与地图，进入编辑时恢复横幅。

新增 `planner-banner.css`，更新 `planner-workflow.js` 和规划入口样式版本；原先“先选地点→自动安排”的两步、数据保存与AI/地图服务没有改动。首页轮播和省域沉浸地图保持各自原样。

验收 `node work/verify-planner-banner.cjs` 覆盖五地区照片/署名切换、清单无重复图片、透明底层、两步选择保留、1920/1366/1093/768/390窗口不溢出、历史结果恢复和返回编辑，以及首页/地图隔离。此视觉检查没有调用付费AI或真实地图服务。报告 `验证截图/planner-banner-verification.json`，截图以 `规划横幅-` 开头。

## 当前探索页：全屏风景与16州、市边界

云南地图页改为当前目的地摄影的全屏背景，地图框收紧并使用半透明墨绿底板；右侧只保留地点介绍与规划入口。重复的右侧照片、地点列表已移除。新增本地16州、市真实GeoJSON边界，点击地区或编号联动当前风景，未收录地区明确提示。页面仍为一屏，首页轮播未改。

分区几何、排版配置和目的地记录按行政代码分开，后续新增目的地可复用州界，并可使用独立摄影记录而不扩展首页五张轮播。开放新地区的规划仍需补充其真实景点和规划数据。文件、来源和验收见 [data/ATLAS-REGIONS.md](data/ATLAS-REGIONS.md)。运行 `node work/atlas-data-check.cjs` 与 `node work/verify-cinematic-regions.cjs`；旧地图测试中的“右侧独立照片/列表”等断言以本阶段精简结构为准。

## 当前体验：先选地点，再自动安排

按用户最新确认的流程重排页面：地图直接进入地点选择，攻略可选；第一步挑景点/酒店/餐厅，第二步补天数与偏好，随后由DeepSeek自动分天。结果页以每日卡片和真实道路地图为主，长说明与资料折叠，支持地图卡片联动、排序、删除、改期、交通切换和点位确认。

已接入实际高德驾车、步行及公交查询；只显示返回的道路距离和预计耗时，未查到则标待确认。地图使用POI参考位置，原景区入口仍标未知，不伪造入口或道路。AI首次返回不合格时自动校正一次，修复了免责声明被文字校验误拒的问题，并提供具体失败原因与重试。

主要实现为 `planner-workflow.js`、`planner-view.js`、`planner-workspace.css` 和 `journey-routing.js`；更新主规划脚本、地图、POI绑定、AI校验与后端。当前不加载旧 `journey-editorial.js` 的长表单重排流程。完整使用逻辑、数据边界、官方来源和测试见 [data/PLANNING-EXPERIENCE.md](data/PLANNING-EXPERIENCE.md)。历史阶段的表单顺序和未接道路说明以本节为准。

## 当前生成方式：统一 DeepSeek AI 规划

按用户最新要求，页面仅保留“生成我的路线”一个入口，实际生成使用DeepSeek。额外旅行期待、偏好、已有景点与用户酒店餐厅一起参与规划；目录、日期、分组、必去和预算规则留在内部做双重校验。失败或取消不会用规则路线伪装AI结果，也不覆盖已有保存。旧行程可继续查看，演示A/B改为预填偏好。

### 启动与配置

需要Node.js 20以上，无需安装生产依赖。在项目根目录运行：

```powershell
node server.cjs
```

打开 `http://127.0.0.1:4174/`。已有4173静态预览也可以访问本地4174后端。后端默认只绑定127.0.0.1。

访问DeepSeek开放平台申请API key，填写项目根目录 `.env.local` 的 `DEEPSEEK_API_KEY=`，无需填进前端。`.env.example` 是空模板，`.env.local` 已被Git忽略且禁止静态下载。配置文件按请求读取，修改后刷新页面即可。完整新手说明：[data/DEEPSEEK.md](data/DEEPSEEK.md)。

2026-10-29：已使用用户提供的密钥完成一次真实DeepSeek调用，`deepseek-flash`返回成功；大理三天慢旅行、必去古城、片区分日、保存与刷新恢复均通过，刷新没有重复调用付费接口。报告为 `验证截图/deepseek-live-verification.json`，实际截图为 `DeepSeek-真实生成-大理三日.png`。密钥只存于忽略提交的本地后端配置，报告和截图不记录密钥。

`node work/verify-deepseek-live.cjs` 会发起一次真实生成请求，仅在需要真实验收时运行。`node work/deepseek-check.cjs` 与 `node work/verify-deepseek-ui.cjs` 使用明确标记的模拟上游验证接口契约、错误、校验、取消、保存恢复，与真实调用报告分开。原有360组规则和自选地点纯数据测试继续通过。一次案例成功不代表所有行程均可行，交通、开放和预约仍需核实。

新增 `server.cjs`、`ai-plan.js`、`ai-service.js`、`ai-planning.css`、环境变量模板和申请指南，更新规划入口与生成展示逻辑。以下为之前阶段记录；旧浏览器测试中“点击后无需密钥即可生成”的预期已被本阶段统一AI入口替代，当前AI闭环以新测试为准，基础规则测试仍可独立运行。

### 参赛方向核对

2026-10-29核对官方 `id=10039`“AI创新应用挑战赛”：选题重真实需求、AI协同开发与过程复现，技术栈不限。云南旅行规划在选题方向上可行，仍需补齐真实Git演进历史、至少3组完整核心Prompt链、复现指南和视频/PDF材料。此记录不是官方资格认证，不伪造此前缺失的提交历史。官方来源及当前日期见DeepSeek接入指南。

## 当前新增：真实地图搜索与酒店 / 餐厅

规划表单第04项可真实搜索酒店、餐厅和其他地点，确认具体位置后选择日期；酒店用于当天出发与返回，餐厅安排午餐或晚餐。支持跨日住宿、调整日期、删除、生成后添加、保存与刷新恢复。右侧结果地图在有自选地点时显示真实高德地图及对应标记。省域探索页面继续保持一屏。

已接入用户提供的本地开发凭证（不在说明中复述），真实高德搜索和反向地理编码均通过浏览器验证。配置文件 `map-config.local.js` 被 `.gitignore` 排除，示例为 `map-config.example.js`。公开部署前按官方方式将安全密钥改为服务端代理。详细结构、限制、官方资料及测试见 `data/MAP-SEARCH.md`。

新增 `amap-service.js`、`travel-personal-places.js`、`place-search.js`、`place-search.css`，更新规划入口、`travel-planner.js`、`travel-map.js`、`travel-rules.js` 和编辑排版脚本。原有目录景点规则保持，用户自选地点单独储存在 `settings.personalPlaces`；尚未按真实道路重新优化，不显示虚构路程或车程。

## 当前景点配图：26 / 29

已新增18个景点的配图，所有地区共26个景点有具体实景摄影。大理7/8、丽江8/9、德钦4/4、香格里拉4/4、西双版纳3/4。还缺龙龛码头、云杉坪、勐远仙境，页面明确标注待补。白沙壁画仅采用景区入口外景并标明非内景，避免把现代东巴文字墙当历史壁画。17张Commons照片已下载至 `assets/attractions/` 并保留下载字节和 SHA256；阿布吉措由既有用户指定原图另制3:2图片。

`attraction-photo-data.js` 保存新图片与元数据，`attraction-photos.js` 统一合并既有大理图和丽江古城图。攻略卡片/放大窗口、规划勾选区、每日结果共享对应图片；版权记录见 `assets/attractions/CREDITS.md`、清单和根目录 `PHOTO-CREDITS.md`。不调整地图一屏布局、首页摄影或规划规则。

验收 `node work/verify-all-attraction-images.cjs` 逐张解码26张照片，检查署名、许可、放大、规划选择与结果使用同图，以及390/768/1093/1440窗口不溢出、保存刷新恢复；截图为 `验证截图/景点配图-<地区>-清单.png`，报告 `all-attraction-images-verification.json`。既有窗口、规则和流程回归继续适用。

## 当前布局修正：地图适配整个窗口

地图 `/explore/yunnan/` 现在使用 `100dvh` 与上下网格分配导航、标题和主体的空间；左右栏共享剩余高度，地图 SVG 自动保持比例，右侧照片使用可伸缩行，五个地点和探索入口都在一屏内。窗口较矮时缩减装饰间距、把地点清单排成两列，不依靠藏住内容或内部滚动来保持一屏。地图页禁止纵向滚动仅作用于自身，资料弹窗可正常打开。

移除了内页 `min-width:1280px` 以及规划页固定 820px / 300px 列宽。攻略和规划页保留最大 1200px 版心，宽度不足时按窗口缩小并在合适断点重排，继续正常纵向滚动。地图则使用整个窗口的宽度，保留少量边距。首页摄影和行程规则不变。修复了从已保存结果进入编辑时，横幅署名可能沿用默认地区的问题。

验收：`node work/verify-window-layout.cjs`，覆盖 1920×1080、1440×900、1366×768、1280×720、1093×614、1024×640、960×540、390×844 的五地区地图。验证轮廓、标记、全部地点按钮及探索入口位于视口内，左右栏没有隐藏溢出文字，滚轮 / PageDown 不让地图页下滚；同时检查攻略、表单、结果的窄窗口布局和保存恢复。报告 `验证截图/window-layout-verification.json`，截图以 `窗口适配-` 开头。历史阶段中的固定最小宽度说明以本节为准。

## 视觉分阶段试样 · 第三阶段

已将大理确认的杂志式攻略模板推广到丽江、梅里雪山、香格里拉和西双版纳：五页共用摄影横幅、透明导航、暖米白正文、1200px 桌面版心、景点心愿单与折叠资料。每页标题、简介、心愿单、摄影裁切和出行提醒来自 `destinations.js` 的 `journal` 配置，不再硬编码大理名称。页面最小宽度仍为 1280px。

未取得对应实景的景点采用编号与文字，不重复地区主图或堆叠空图片框。大理保留七张实景及龙龛待补框；丽江古城复用项目已存在的 chensiyuan 实景及原许可。统一摄影索引为 `attraction-photos.js`，攻略放大窗口与行程结果共享此索引。新增配图复用，不替换首页五张作品，不新增下载，不改变路线规则或存储结构。

四个扩展地区在景点旁直接展示高海拔、徒步、宗教礼仪和保护范围等相关提醒；缺失、空或无效目的地 ID 有统一浅色返回界面。各地区选择与取消可独立保存，规划链接及返回地图保持相应地区。

验收：`node work/verify-editorial-stage-three.cjs` 覆盖五地区地图到攻略、选取、规划、生成、保存、刷新恢复和无效链接，检查 1280 / 1440 / 1920 桌面宽度。`work/verify-editorial-stage-two.cjs`、`work/verify-dali-attraction-photos.cjs` 已更新第三阶段的预期；`node work/travel-rules-check.cjs` 保留 360 组规则回归。报告为 `验证截图/editorial-stage-three-verification.json`，截图以 `第三阶段-` 开头。以下第一、二阶段文字是阶段记录，其中“仅大理试样”“丽江无图”等限制已被本阶段覆盖。

主要文件：`destinations/detail.html`、`destinations.js`、`guide-editorial.js`、`guide-editorial.css`、新增 `attraction-photos.js`；规划入口和 `travel-planner.js` 仅接入共享摄影索引。

## 视觉分阶段试样 · 第二阶段

云南探索地图、规划表单、每日行程已复用第一阶段的暖米白、深绿与细线风格，样式限定于这两条路由，不改首页和攻略页。地图采用固定 1200px 版心，地图高度收敛，五个标记完整可见。页面最小宽度 1280px；窄窗口保留桌面布局并允许横向滚动，不自动切换为手机卡片布局。

规划表单保留一处目的地摄影横幅，抵离时间与跨地区选项收入可展开设置；所有原表单字段、事件、规划规则及存储继续使用。结果页不重复展示目的地横幅，直接突出每日路线，资料说明与时间预算可展开；预算偏紧/超额及硬冲突会自动展开相应提醒。大理结果卡片复用已核实实景及署名，其他没有独立照片的站点显示文字，不重复地区氛围图。

入口：`/explore/yunnan/`、`/explore/yunnan/planner/?place=erhai&view=edit`、`/explore/yunnan/planner/?demo=dali`。新增 `journey-editorial.css` / `journey-editorial.js`，更新两条路由 HTML 和 `travel-planner.js` 的展示逻辑。没有增加生产依赖或构建工具。

验收：工作区根目录运行 `node work/verify-editorial-stage-two.cjs` 和 `node work/travel-rules-check.cjs`。第二阶段使用桌面宽度契约，旧浏览器测试中的 390px 手机自适应断言不适用。报告为 `验证截图/editorial-stage-two-verification.json`，三页截图以 `第二阶段-` 开头。此阶段供用户评审，未自动扩展其他目的地攻略样式。

## 视觉分阶段试样 · 第一阶段

大理景点清单现有七张对应实景照片，支持点击放大查看，并显示摄影署名、来源与许可。龙龛码头明确标注照片待补；本阶段不扩展其他地区。摄影记录见 `assets/dali-attractions/CREDITS.md`，配图验收可运行 `node work/verify-dali-attraction-photos.cjs`（从工作区根目录）。

按用户要求，当前只将大理攻略页 `/destinations/detail.html?id=erhai` 作为视觉试样：摄影横幅与透明导航、暖米白正文、固定桌面版心、较大的文字及无重复照片的景点清单。新样式和 DOM 重排位于 `guide-editorial.css` / `guide-editorial.js`，通过 `guide-editorial-preview` 条件类仅作用于大理。

原勾选、已选数量、规划链接和本地保存逻辑继续复用。首页、地图、规划脚本及其他目的地样式保持本阶段前的内容，等待用户评审后再决定后续视觉修改。验收截图是 `验证截图/第一阶段-大理-after-首屏.png` 与 `第一阶段-大理-after-整页.png`，可运行 `node work/phase-one-preview.cjs after` 检查选取、资料折叠、规划跳转及其他地区隔离。

## 2026-10-29：约束式规划 v2

规划已由固定景点数量分日，升级为**人工整理模板＋必去优先＋起终片区＋抵离窗口＋时间预算＋风险校验**。本次保留首页与省域地图设计，没有新增 AI 服务或后端。

- 演示 A：`/explore/yunnan/planner/?demo=dali`，大理 3 天、轻松、自驾/打车；古城与三塔、喜洲与严家大院、洱海西岸分日。
- 演示 B：`/explore/yunnan/planner/?demo=lijiang`，丽江 2 天、标准、公共交通；古城与黑龙潭、白沙与壁画分日。
- 表单可填起终片区（区域参考，非景区入口）、半日抵离、可选抵离时刻、必去星标和额外地区。默认采用完整游玩日假设。
- 结果含主题、分组原因、上午/下午建议、明确标记的游览估算、用餐/休息预留与未知交通说明。不用直线距离生成里程或车程。
- 真实交通和整日总时长保持未知；片区衔接缓冲是编辑预算，不能视作真实公交或自驾时间。
- 具体入口全部未知，不以城市中心或山体代表点代替。地图保留地区锚点，入口未知的站点只在顺序列表展示。
- 跨区要单独预留转场和必要返程日，天数不足明确保留待安排地区；手动编辑与恢复都会重新校验。旧 plan version 1 能迁移并显示提示。
- 保持原 localStorage key，保留旧用户选择与计划。原有生产依赖未增加。

完整审查结果、数据来源、两案例实际输出、测试与限制说明：[data/ROUTE-V2.md](data/ROUTE-V2.md)。实际规则快照：`data/route-v2-demo-output.json`。

本次主要变更：`attractions.js`、新增 `travel-templates.js`、重构 `travel-rules.js`、`travel-store.js`、`travel-planner.js`、`travel-map.js`、`guide.js`，更新规划/攻略入口 HTML 和 `travel.css`。两个演示按钮位于规划表单顶部。

验收命令：`node work/travel-rules-check.cjs`（360 组约束组合及关键边界场景）、`node work/verify-route-v2.cjs`（真实 Edge 浏览器），另保留 `work/verify-travel-mvp.cjs` 端到端回归与地图、首页原测试。项目无构建器，因此执行 JavaScript 语法检查、HTTP 资源检查和浏览器测试，不能声称执行了不存在的构建脚本。

以下为前一版本功能记录；若“固定每天 2/3 站”或“无时长估算”等描述与 v2 不一致，以上述 v2 规则为准。

原生 HTML、CSS、JavaScript 云南旅行摄影首页；没有前端框架、路由或 package.json。首页固定在视口内，显示实景轮播，不出现地图、规划表单、景点列表或页脚。

首页是沉浸式摄影封面：全屏照片、透明叠加导航、左侧主标题与“开启旅程”按钮、右侧风景轮播卡片。支持自动轮播、暂停/继续、上一张/下一张、卡片选择、方向键及手机横划。

“开启旅程”和“风景灵感”通过原生链接进入 `/explore/yunnan/`。原旅行规划 HTML 以未渲染的 `#planning-view-template` 保存在首页文件中；`app.js`、`planner.js`、`cities.js`、原 `styles.css` 与原 `cover.js` 均未删除或加载。

## 云南探索地图与目的地详情

当前技术栈仍为原生 HTML/CSS/JavaScript，没有项目级 package.json、构建器、框架路由或 ECharts。采用静态文件路由，Python 静态服务与常见静态托管均可直接运行，无需新增生产依赖。

- `/`：原摄影首页，保留布局与五张用户指定作品。
- `/explore/yunnan/`：SVG 交互式云南省地图，地图约占桌面区域 65%，右侧为摄影介绍与目的地列表；移动端上下排列。
- `/explore/yunnan/?place=shangri`：直达并选中指定景点；支持 `meili`、`erhai`、`yulong`、`shangri`、`banna`。
- `/destinations/detail.html?id=meili`：五个目的地共用详情模板；无效 id 有回退界面，详情链接可返回地图并保留选择。

地图以本地 `data/yunnan-province.geojson` 为真实省界，来源、范围和标记含义见 `data/SOURCES.md`。`map-geometry.js` 统一投影边界与地点；地图点与列表共享当前景点状态，支持鼠标、触控与键盘。右侧摄影与文案柔和切换，减少动态效果偏好得到尊重。

数据分层：`home-photos.js` 保留用户指定照片、作者及许可；`destinations.js` 按图片 id 合并地点名称、区域、坐标、介绍和详情地址。`site-shell.js` 是地图及详情共用导航与来源弹窗；`explore.js` 与 `destination-detail.js` 分别渲染两页，样式在 `journey.css`。

本版本为 10 月 31 日预作品准备的可演示功能；地图展示不提供道路导航、实时天气、票务或预约。区域标记不是照片拍摄机位、入口或徒步线路。本地规则旅行规划见下节。

验证：真实 Edge 浏览器覆盖两个首页入口、五个地图点和列表双向联动、悬停名称、键盘选择、五个详情页、详情返回恢复选择、错误 ID 回退及 390px 手机横向溢出检查，无控制台错误。`验证截图/map-verification.json` 为报告。`work/map-geometry-check.cjs` 验证五个点位在真实云南轮廓内，首页摄影回归由 `work/verify-selected-photos.cjs` 验证。

## 目的地攻略与旅行计划 MVP

新增流程：

`地图选择 → /destinations/detail.html?id=erhai → 勾选景点 → /explore/yunnan/planner/?place=erhai&view=edit → 生成 → 每日结果 → 编辑 / 保存 / 刷新恢复`

- 地图、详情与首页目的地通过同一个地区 ID 传递；`?place=<id>&spots=<id,id>&view=edit` 可直接恢复攻略页的预选项。
- `attractions.js` 集中管理地点名称、片区、类型、简介、停留建议和可选的已确认坐标。大理和丽江清单较完整；其余地区使用相同结构的基础清单。
- 未核实的地点没有图片坐标标记、精确停留时长、票价、开放时间或车程。景点卡片复用地区摄影时会显示“地区氛围图”。详见 `data/GUIDE-SOURCES.md`。
- `travel-rules.js` 对同一输入总是生成相同结果：主动选择优先、兴趣推荐、按片区分天、徒步单独安排、超量时显示未排入列表；不调用虚构 AI 或道路 API。
- 每日结果支持切换 Day、删除当天景点、调整同一天顺序、确认后重生成。右侧地图只显示有数据依据的已确认点位，其余景点保留在顺序清单；虚线只示意顺序，页面明确说明不是道路导航。
- `travel-store.js` 用单独 key `roam.yunnan.travel.v1` 保存地区选择、草稿和计划。支持离线单浏览器刷新恢复；不是账号或跨设备同步，关闭本地存储时有明确提示。
- 地图、详情、规划页会正常纵向滚动；手机实测视口宽度无横向溢出。

新增访问地址：

- 攻略：`/destinations/detail.html?id=erhai`，其他地区使用 `meili`、`yulong`、`shangri`、`banna`。
- 规划表单：`/explore/yunnan/planner/?place=erhai&view=edit`。
- 规划结果：`/explore/yunnan/planner/?place=erhai&view=result`；本地无已保存草稿时安全返回表单并提示。

本阶段新增文件：`attractions.js`、`guide.js`、`travel-rules.js`、`travel-store.js`、`travel-map.js`、`travel-planner.js`、`travel.css`、`explore/yunnan/planner/index.html`、`data/GUIDE-SOURCES.md`。复用并更新 `destinations/detail.html`、`destinations.js`、`site-shell.js` 和本说明；首页及地图主体页面未重写。共用来源弹窗修正了深层路由下的本地图片路径。

验证：真实 Edge 测试已从首页完整走过“大理 → 勾选三个景点 → 三天舒缓 → 生成 Day 01/02/03 → 同日排序和删除 → 保存 → 刷新恢复 → 切换丽江 → 高海拔提示”。另测五个地区的直接攻略路由、手动／确认重新生成、过满时保留未排入景点、详情/地图回跳、错误存储回退、未确认地点不伪造坐标和手机布局。`验证截图/travel-mvp-verification.json` 记录通过项，截图位于 `验证截图/`。纯规则单测覆盖 1,440 组组合；`work/travel-rules-check.cjs` 可重新运行。地图原型的 216 组旧测试见 `work/planner-check.cjs`。

## 运行

无需安装生产依赖。请在当前目录启动 HTTP 服务（地图需要通过 HTTP 加载本地 GeoJSON，直接双击 HTML 不支持完整跨页功能）：

```powershell
python -m http.server 4173
```

然后访问 `http://localhost:4173`。

## 说明

- 这是可交互原型，不接入大模型、实时地图、交通/营业时间或票务服务。
- 首页只使用用户指定的五张 Pexels / Unsplash 真实摄影图片，默认显示 Lu Li 的梅里雪山。全部原图在 `assets/selected/originals/`，2560×1440 背景与 600×800 卡片来自对应的同一原图，运行时不请求图片外链。
- `home-photos.js` 是当前首页摄影配置。作者、来源、许可及原图哈希见“关于影像”、`PHOTO-CREDITS.md`、`assets/selected/manifest.json`。旧 Commons 文件保留但不被首页请求。
- 保存的计划放在当前浏览器的 `localStorage` 中，不会上传。
- `cities.js` 维护城市与地点，`planner.js` 维护规划规则，`cover.js` 维护轮播与署名，便于之后接地图 API 或扩展目的地。
- 首页不改变其他业务组件的源码；要重新接入旅行规划，需将其重新挂载到独立的页面入口。

## 本次文件变更

- 首页入口：`index.html`、`home.js`、`home.css`，仅调整探索跳转和链接样式，保留摄影与既有交互。
- 地图页面：`explore/yunnan/index.html`、`explore.js`、`map-geometry.js`。
- 详情模板：`destinations/detail.html`、`destination-detail.js`。
- 共用数据、导航、样式：`destinations.js`、`site-shell.js`、`journey.css`。
- 本地真实地图及来源：`data/yunnan-province.geojson`、`data/SOURCES.md`。
- 说明与验收：本文件及 `验证截图/map-verification.json`，截图同目录。

## 云南版验证记录

- 三座城市共 216 种天数、节奏和偏好组合：地点不重复、推荐不跨城市、地图坐标在视图内、时间顺序正确、费用分项一致。
- 检查了空行程添加、跨年和闰年日期、单个地图点及未知城市处理。
- JSDOM 模拟浏览器验证：首次渲染、切换城市、生成、替换、保存、封面自动/手动切换、暂停、目的地按钮和署名弹窗。
- 页面、脚本、样式和 8 张本地图片均通过 HTTP 加载检查，JavaScript 通过语法检查。
- 本次已用真实 Microsoft Edge 无头浏览器逐张点击验证新背景、对应卡片、摄影师署名；网络记录确认没有请求旧图。桌面 1440×900 与手机 390×844 的截图保存在 `验证截图/`。手机视口检查包含 PageDown / 滚轮不产生第二屏，未做物理手机真机测试。

## 参赛过程记录

当前是为 2026-10-31 预作品准备的可运行 MVP。项目没有构建步骤；work/ 内的测试依赖仅用于验收，不参与网站运行。请保留本次真实对话与逐次修改记录，本版本未伪造历史 Git 提交或 AI 对话。摄影、地图和攻略资料限制分别记录在 `PHOTO-CREDITS.md`、`data/SOURCES.md` 和 `data/GUIDE-SOURCES.md`。
