# 漫游云南 / ROAM YUNNAN

云南旅行摄影轮播封面。

当前完成：全屏风景背景、五张竖版摄影卡片、背景与文案联动、上一张 / 下一张、自动播放与暂停、键盘切换、图片署名和手机布局。

默认首屏为梅里雪山，依次展示大理洱海、丽江玉龙雪山、香格里拉阿布吉措、西双版纳热带雨林。背景和卡片采用对应同一摄影作品，所有展示图片保存在本地，无需联网加载图片。

地图、目的地攻略与旅行规划将继续开发。“开启旅程”按钮目前弹出后续页面说明。

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
```

Windows PowerShell 如果拦截 `npm.ps1`，可用 `npm.cmd` 代替 `npm`。浏览器测试检查轮播、自动播放、导航按钮、单屏及多尺寸布局，截图和报告生成到 `tests/artifacts/`。也可通过 `PLAYWRIGHT_EXECUTABLE_PATH` 指定本机 Chrome / Edge。

## 摄影

五张作品的作者与来源见 [PHOTO-CREDITS.md](PHOTO-CREDITS.md)。图片使用范围以各来源许可为准，公开源码不改变第三方摄影许可。
