# Quantumult X YouTube移动网页去广告

这是给 Quantumult X（圈 X）使用的远程重写资源，目标是通过 Safari 或其他浏览器访问的 YouTube 移动网页。它不覆盖 YouTube 原生应用、电视客户端或 YouTube Music。

## 当前处理范围

- 在 /youtubei/v1/player 的 JSON 响应中，清理 adPlacements、adSlots、playerAds、adBreaks、adBreakHeartbeatParams 等播放器广告字段。
- 拦截 YouTube 明确用于广告加载、广告追踪和广告统计的接口。
- 脚本只在本地处理播放器响应，不向第三方服务发送响应内容或账号数据。
- 如果响应格式异常、不是预期的播放器 JSON，脚本会原样放行，避免因解析失败破坏播放。

## 安装与使用

1. 在 Quantumult X 的重写资源中添加以下订阅地址：

   https://raw.githubusercontent.com/waynekke/QuantumultX-YouTube-Adblock/refs/heads/main/youtube_adblock.qxrewrite

2. 开启重写，并确保 YouTube 网页使用的 m.youtube.com、www.youtube.com、s.youtube.com 已纳入 Quantumult X 的 HTTPS 中间人解密范围。
3. 首次使用 HTTPS 中间人解密时，按 Quantumult X 的说明安装并信任证书，然后更新重写资源。

## 适用范围与限制

- 规则针对 YouTube 移动网页的播放器 JSON 接口，不会拦截 googlevideo.com 视频流，也不会修改原生应用的二进制响应。
- YouTube 会调整接口和广告投放方式，不能保证所有广告类型、所有地区和所有版本始终都能拦截。
- 如果视频异常，先关闭这条重写资源确认是否恢复；若确认与规则有关，可反馈 Quantumult X 版本、浏览器类型、出现问题的页面及脱敏后的请求路径。不要公开 Cookie、授权令牌或完整播放链接。

## 资料来源

- [Quantumult X 官方重写示例](https://github.com/crossutility/Quantumult-X/blob/master/rewrite.md)：确认响应体脚本的处理方式。
- [Quantumult X 官方配置示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)：确认脚本对象与 HTTPS 中间人主机名设置。
- [ddgksf2013 YouTube 重写规则](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/YoutubeAds.conf)：参考广告统计、广告追踪接口以及播放器响应字段。
- [Ender-Wang YouTube 重写项目](https://github.com/Ender-Wang/YouTubeAds-PiP-BackgroundPlay)：对照 YouTube 播放接口规则。
- [Maasea YouTube 模块讨论区](https://github.com/Maasea/sgmodule/issues)：查看接口变动、规则失效及播放异常的维护者与用户报告。

原生应用规则涉及不同的二进制接口与视频流域名，兼容方式和隐私边界不同，因此没有并入本网页资源。
