# QuantumultX YouTube 广告跳过规则

针对**沉浸式翻译 App 内嵌 YouTube** 场景的去广告重写规则，基于实际抓包数据编写。

## 文件说明

| 文件 | 用途 |
|------|------|
| `youtube_adblock.conf` | 重写规则配置（远程引用此文件） |
| `youtube_no_ads.js` | 修改 YouTube player 响应体、移除广告心跳参数 |

## 使用方法

### 1. 添加远程重写引用

在 Quantumult X 配置文件的 `[rewrite_remote]` 段落添加：

```
https://raw.githubusercontent.com/minionke0916/QuantumultX-YouTube-Adblock/main/youtube_adblock.conf, tag=YouTube去广告, update-interval=86400, opt-parser=false, enabled=true
```

### 2. 配置 MITM

确保 `[mitm]` 段包含：

```
hostname = m.youtube.com, www.youtube.com
```

### 3. 信任证书

Quantumult X → 设置 → MitM → 生成并安装证书 → 系统设置中完全信任。

## 原理

通过三条规则协同工作：

1. **拦截 `pagead/` 请求** → Google AdSense 广告内容无法加载
2. **拦截 `api/stats/ads`** → 广告统计上报被阻断
3. **修改 `/youtubei/v1/player` 响应体** → 删除 `adBreakHeartbeatParams`，播放器不触发广告请求

## 注意事项

- 本规则针对 **YouTube 移动网页版**（m.youtube.com），适用于沉浸式翻译 App 内嵌浏览器
- 如果你是 YouTube Premium 会员，请不要使用此规则，可能导致播放异常
- 规则基于 2026 年 6 月抓包数据编写，YouTube 接口如有变动可能需要更新
