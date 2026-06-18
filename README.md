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

