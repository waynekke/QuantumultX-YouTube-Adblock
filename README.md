# 圈 X 的油管网页去广告

这条远程重写资源适用于在苹果浏览器等浏览器打开的 YouTube（油管）网页，覆盖 `m.youtube.com` 和 `www.youtube.com`。

## 覆盖范围

| 使用场景 | 处理内容 |
| --- | --- |
| 直接打开首页、视频、搜索、播放列表或短视频网页 | 清理网页内嵌的初始播放器数据及广告卡片 |
| 从推荐点开视频或预加载下一个视频 | 清理 `player`、`get_watch`、`resolve_url` 中的播放器广告字段 |
| 刷新首页、继续滚动或搜索 | 从 `browse`、`next`、`search` 的列表里移除带明确广告类型的卡片，保留普通内容及分页项 |
| 打开或滑动短视频 | 清理短视频播放响应，并移除序列中明确标记为广告的条目 |

重写还会拦截广告加载、广告追踪及广告统计请求。脚本在圈 X 本地处理响应，解析失败时沿用原响应。

## 安装与更新

1. 已订阅的用户在圈 X 手动更新这条资源。首次使用时，在「重写 → 资源」添加[订阅地址](https://raw.githubusercontent.com/waynekke/QuantumultX-YouTube-Adblock/refs/heads/main/youtube_adblock.qxrewrite)。
2. 开启重写与中间人解密，确认 `m.youtube.com`、`www.youtube.com`、`s.youtube.com` 已加入解密范围。首次使用中间人解密时，按圈 X 的说明安装并信任证书。

覆盖效果取决于油管向当前浏览器及账号下发的广告形式。服务端安排的插播与等待时段需要在设备上确认。若出现播放异常，可暂时关闭这条重写，再打开同一页面对比。反馈时请提供圈 X 版本、浏览器类型及脱敏后的请求路径。

## 资料来源

- 圈 X 的响应体脚本及中间人解密设置。[官方重写示例](https://github.com/crossutility/Quantumult-X/blob/master/rewrite.md) · [官方配置示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)
- 播放器、短视频序列及预加载接口中的广告字段。[uBlock Origin（浏览器广告拦截器）过滤规则](https://github.com/uBlockOrigin/uAssets/blob/master/filters/filters.txt) · [快速修正规则](https://github.com/uBlockOrigin/uAssets/blob/master/filters/quick-fixes.txt)
- 网页内嵌数据的格式。[yt-dlp（视频解析工具）网页解析源码](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/youtube/_base.py)
- 广告卡片类型。[YouTube.js（油管接口客户端）解析源码](https://github.com/LuanRT/YouTube.js/blob/main/src/parser/parser.ts) · [网页去广告实现](https://gist.github.com/oiiogong/3b2f171141b54027e5db9a543b09b194)
- 广告统计及广告追踪路径。[ddgksf2013 重写规则](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/YoutubeAds.conf) · [Ender-Wang 重写项目](https://github.com/Ender-Wang/YouTubeAds-PiP-BackgroundPlay)
