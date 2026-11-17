# 第三版：景点选择与心愿清单

本次按“功能模块落地”提交，范围是地图进入对应地区选景点、搜索筛选、已选清单、必去及本地保存。没有加入酒店、AI 生成或交通查询。

## 实现来源与调整

- 沿用用户 DeepSeek 工作区已生成的 `attractions.html`、`attractions.css`、`assets/js/attractions.js` 作为选择界面与基础交互。
- 接入既有完整版 `attractions.js` 的 29 个目录景点和稳定 ID；通过适配脚本匹配地区及图片，避免地区 ID 不一致或额外引入未经核实的时间数字。
- 增加名称搜索、对应实景照片、缺图说明、摄影来源入口、地图与选点双向跳转、存储异常提示和后续阶段说明。
- 测试覆盖从首页到地图再到大理选择，搜索无结果、必去自动加入、移除时清除必去、每地区独立保存、刷新恢复、返回地图、键盘、窗口排版和存储不可用。

## 验证命令

```sh
node tests/check.cjs
npm run test:selection
npm run test:map
npm run test:browser
```

这些测试使用真实本地源码与图片，不调用付费模型或外部地图服务。报告和截图生成到被 Git 忽略的 `tests/artifacts/`。

## 对话材料

此前上传的 `deepseek-cover-map-session.md` 导出截至地图开发，不包含这次景点选择的完整 DeepSeek 对话。本说明是模块索引，不作为完整 Prompt 链替代。用户后续提供该阶段原始导出时再补充关联，不补写不存在的回复。
