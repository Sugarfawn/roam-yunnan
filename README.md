# 漫游云南 / ROAM YUNNAN

云南旅行摄影封面与交互式探索地图。

当前完成：全屏风景背景、五张竖版摄影卡片、背景与文案联动、上一张 / 下一张、自动播放与暂停、键盘切换、图片署名和手机布局。

默认首屏为梅里雪山，依次展示大理洱海、丽江玉龙雪山、香格里拉阿布吉措、西双版纳热带雨林。背景和卡片采用对应同一摄影作品，所有展示图片保存在本地，无需联网加载图片。

“开启旅程”和“风景灵感”进入云南探索地图。地图包含本地真实省界、16个州 / 市边界和五个目的地标记，支持鼠标与键盘选择，背景、名称、介绍和摄影署名同步切换。探索此地显示目的地介绍弹窗，可返回首页。未收录地区显示明确提示。

当前尚未加入景点选择与路线规划，也不需要地图或模型 API 密钥。

页面：首页 `/`；云南地图 `/explore/yunnan/`；也可用 `?place=erhai` 等查询参数直接选择目的地。

地图数据来源及地点定位边界见 [data/SOURCES.md](data/SOURCES.md)。坐标只代表目的地区域，不是景区开放入口，也不是道路导航。

## 运行

需要 Node.js 20 或以上。无需安装依赖：

```sh
node server.cjs
```

打开 **http://127.0.0.1:4175/**。也可使用任意静态 HTTP 服务运行。

## 文件

| 文件 | 用途 |
| --- | --- |
| `index.html` | 封面结构及对话框 |
| `home.css` | 桌面和手机布局、摄影过渡 |
| `home.js` | 轮播、键盘、自动播放和按钮交互 |
| `home-photos.js` | 五处风景及摄影数据 |
| `assets/selected/` | 本地背景、卡片和图片来源清单 |
| `PHOTO-CREDITS.md` | 作者、作品链接和许可 |
| `server.cjs` | 本地静态预览服务 |
| `explore/yunnan/index.html`、`explore.js` | 地图结构、选择与介绍弹窗 |
| `map-geometry.js`、`map-regions.js`、`data/` | 投影、分区配置、本地真实边界 |
| `destinations.js` | 地点、坐标、介绍与摄影的集中数据 |

## 检查

运行不需要第三方依赖的基础检查：

```sh
node tests/check.cjs
```

检查脚本语法、图片校验、默认顺序、封面范围和静态服务。

可选浏览器验证：

```sh
npm install
npx playwright install chromium
npm run test:browser
npm run test:map
```

Windows PowerShell 如果拦截 `npm.ps1`，可用 `npm.cmd` 代替 `npm`。浏览器测试检查轮播、自动播放、导航按钮、单屏及多尺寸布局，截图和报告生成到 `tests/artifacts/`。也可通过 `PLAYWRIGHT_EXECUTABLE_PATH` 指定本机 Chrome / Edge。

## 摄影

五张作品的作者与来源见 [PHOTO-CREDITS.md](PHOTO-CREDITS.md)。图片使用范围以各来源许可为准，公开源码不改变第三方摄影许可。
