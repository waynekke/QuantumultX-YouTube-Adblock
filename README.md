# QuantumultX YouTube 广告跳过规则

针对 **YouTube 移动网页版**（m.youtube.com）的去广告重写规则，基于实际抓包数据编写。

## 文件说明

| 文件 | 用途 |
|------|------|
| `youtube_adblock.qxrewrite` | 远程重写规则（圈 X 直接引用此文件） |
| `youtube_no_ads.js` | 修改 YouTube player 响应体、移除广告心跳参数 |

## 使用方法

### 1. 导入远程重写规则

打开 Quantumult X → 点击右下角**三菱按钮** → **Rewrite（重写）** → **引用** → 右上角 **+** → 粘贴以下链接：

```
https://raw.githubusercontent.com/waynekke/QuantumultX-YouTube-Adblock/main/youtube_adblock.qxrewrite
```

标签随意填写（如"YouTube去广告"），保存后返回主页面更新资源即可。

### 2. 信任 MITM 证书

Quantumult X → 设置 → MitM → 生成并安装证书 → 系统设置中完全信任。

> `.qxrewrite` 文件里已经声明了 `hostname = m.youtube.com, www.youtube.com`，圈 X 会自动添加，不需要手动改 MITM 配置。

## 原理

通过三条规则协同工作：

1. **拦截 `pagead/` 请求** → Google AdSense 广告内容无法加载
2. **拦截 `api/stats/ads`** → 广告统计上报被阻断
3. **修改 `/youtubei/v1/player` 响应体** → 删除 `adBreakHeartbeatParams`，播放器不触发广告请求

## 注意事项

- 本规则针对 **YouTube 移动网页版**（m.youtube.com），适用于各类内嵌 WebView 浏览器场景
- 如果你是 YouTube Premium 会员，请不要使用此规则，可能导致播放异常
- 规则基于 2026 年 6 月抓包数据编写，YouTube 接口如有变动可能需要更新
