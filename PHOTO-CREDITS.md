# 云南轮播照片来源与署名

## 当前景点配图补充（2026-10-29）

现有29个景点中26个已有对应实景配图：大理7张、丽江8张、德钦4张、香格里拉4张、西双版纳3张。新增18个景点配图，其中17张从Commons下载并保留署名/许可及下载字节，阿布吉措复用用户指定 Sebastian S 原图。详情见 [新增景点摄影记录](assets/attractions/CREDITS.md) 与 [清单](assets/attractions/manifest.json)。

攻略、规划选择区与每日结果通过 `attraction-photos.js` 共享图片，主摄影和省域地图不变。白沙壁画使用景区入口外景，明确标注非壁画内景；玉湖村使用洛克故居院落。照片保留拍摄时状态，不表达当前开放或设施情况。龙龛码头、云杉坪、勐远仙境仍待补，不使用异地、AI或笼统地区照片替代。以下为历史阶段记录，数量以本节为准。

## 第三阶段：各目的地攻略与共享景点摄影

五个目的地攻略继续使用用户指定的对应主摄影，不搜索或替换首页作品。独立景点配图统一由 `attraction-photos.js` 管理：合并已记录的七张大理实景，并复用项目已有的 `assets/oldtown.webp` 作为「丽江古城」配图，也用于该站的行程结果。

丽江古城：chensiyuan，[原始作品](https://commons.wikimedia.org/wiki/File:1_lijiang_old_town_2012.jpg)，[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。复用已有 1920×630 宽幅 WebP，列表通过 CSS cover 取景，放大显示整幅；衍生图片继续采用原许可。既有来源记录见下方历史资源表。本阶段未重新下载或重新核实作品页面。

其余尚无对应独立实景照片的景点使用文字与编号，不使用地区主摄影冒充。大理龙龛码头保留此前明确的照片待补状态。

## 大理攻略页新增景点配图（2026-10-29）

七处景点采用各自对应的实景摄影，作者、作品页面、许可与裁切说明见 [景点摄影记录](assets/dali-attractions/CREDITS.md) 及 [资源清单](assets/dali-attractions/manifest.json)。龙龛码头照片待补，未用其他地点替代。本批新增图片不改变以下首页作品。

## 当前首页：用户指定的五张作品（2026-10-28）

本次没有重新选图。五个作品页面、摄影师与顺序均按用户提供的链接。直接读取作品页遇到 Pexels 403 / Unsplash 401；之后通过 Microlink 的对应页面元数据确认作者及图片 CDN 地址，再从 Pexels / Unsplash 图片 CDN 下载未指定缩放尺寸的原始分辨率文件。并非随机图片或旧照片调色。

| 顺序 | 作品与摄影师 | 用户指定作品页面 | 平台许可 |
|---|---|---|---|
| 01 默认首屏 | 梅里雪山 · Lu Li | [Pexels 10520915](https://www.pexels.com/photo/a-snow-covered-mountain-under-the-dark-sky-10520915/) | [Pexels License](https://www.pexels.com/license/) |
| 02 | 大理洱海 · Yubing Zhang | [Unsplash o1tFimzl2lk](https://unsplash.com/photos/the-sun-is-setting-over-a-body-of-water-o1tFimzl2lk) | [Unsplash License](https://unsplash.com/license) |
| 03 | 丽江玉龙雪山 · jony Y | [Unsplash XPF8T42BhxY](https://unsplash.com/photos/a-mountain-range-is-reflected-in-the-still-water-of-a-lake-XPF8T42BhxY) | [Unsplash License](https://unsplash.com/license) |
| 04 | 香格里拉阿布吉措 · Sebastian S | [Unsplash -EctH6zaHsQ](https://unsplash.com/photos/turquoise-lake-nestled-among-rugged-green-mountains--EctH6zaHsQ) | [Unsplash License](https://unsplash.com/license) |
| 05 | 西双版纳热带雨林 · Jack Wu | [Unsplash YdpzQY_nBF0](https://unsplash.com/photos/a-banana-tree-in-the-middle-of-a-forest-YdpzQY_nBF0) | [Unsplash License](https://unsplash.com/license) |

- 原始文件：`assets/selected/originals/`，保留下载字节及 SHA-256。
- 背景：`assets/selected/<id>-background.webp`，2560×1440（16:9）。
- 卡片：`assets/selected/<id>-card.webp`，600×800（3:4）。
- 处理：仅裁切、缩放及 WebP 编码，无调色、滤镜或 AI 重绘。阿布吉措背景裁切向下取景，保留湖面。
- 数据及原图对应关系：`home-photos.js` 和 `assets/selected/manifest.json`。
- 许可核实的范围：用户指定这些作品为免费摄影；作品元数据与作者已确认，Pexels 的免费下载描述与许可页元数据可读取。Unsplash 完整许可页在当前环境仍受访问限制，记录其官方许可链接，不声称已重新审阅页面全文。图片采用各平台许可，不再将这些新照片标为 CC BY-SA。

## 历史资源（保留文件，当前首页不再引用）

以下照片通过 Wikimedia Commons 公开 API 搜索并取得。授权以对应文件页面为准。照片下载后已缩放、转换为 WebP；卡片图经过中心裁切。照片本身及其衍生版本保留对应 CC BY-SA 授权，应用代码的授权不由照片授权推定。

| 本地文件 | 内容 | 摄影者 | 原始文件及授权 |
|---|---|---|---|
| assets/yulong.webp、assets/yulong-card.webp | 从丽江望玉龙雪山 | CEphoto, Uwe Aranas | [原图](https://commons.wikimedia.org/wiki/File:Lijiang_Yunnan_China_Jade-Dragon-Snow-Mountain-01.jpg) · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| assets/erhai.webp、assets/erhai-card.webp | 大理洱海 | Nishino Asuka | [原图](https://commons.wikimedia.org/wiki/File:Erhai_Lake_in_2023.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| assets/oldtown.webp、assets/oldtown-card.webp | 丽江古城全景 | chensiyuan | [原图](https://commons.wikimedia.org/wiki/File:1_lijiang_old_town_2012.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| assets/dianchi.webp、assets/dianchi-card.webp | 昆明滇池全景 | Ngguls（祝鱼贵） | [原图](https://commons.wikimedia.org/wiki/File:20260222_Kunming_Dianchi_Lake_PANO.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

下载与搜索日期：2026-10-28。照片用于目的地灵感封面，不表示页面的行程一定包含照片中景区。未使用 AI 生成照片。
