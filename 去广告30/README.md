# 去广告30

这是从你提供的圈叉配置中整理出的广告专用资源包，使用圈叉可导入的远程分流与重写格式。包含 1 条广告分流订阅、1 条 12306 直连例外，以及 3 条广告重写资源。

## 一键加入圈叉

[点此将去广告30加入圈叉](https://quantumult.app/x/open-app/add-resource?remote-resource=%7B%22filter_remote%22%3A%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fwaynekke%2FQuantumultX-YouTube-Adblock%2Fmain%2F%25E5%258E%25BB%25E5%25B9%25BF%25E5%2591%258A30%2F12306-direct.list%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-12306%E7%9B%B4%E8%BF%9E%E4%BE%8B%E5%A4%96%2C%20update-interval%3D172800%2C%20opt-parser%3Dfalse%2C%20enabled%3Dtrue%22%2C%22https%3A%2F%2Fraw.githubusercontent.com%2Fblackmatrix7%2Fios_rule_script%2Fmaster%2Frule%2FQuantumultX%2FAdvertisingLite%2FAdvertisingLite.list%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-%E9%BB%91%E7%9F%A9%E9%98%B5%E7%B2%BE%E7%AE%80%E5%B9%BF%E5%91%8A%E5%88%86%E6%B5%81%2C%20force-policy%3Dreject%2C%20update-interval%3D172800%2C%20opt-parser%3Dfalse%2C%20enabled%3Dtrue%22%5D%2C%22rewrite_remote%22%3A%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fwaynekke%2FQuantumultX-YouTube-Adblock%2Fmain%2Fyoutube_adblock.qxrewrite%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-YouTube%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%2C%22https%3A%2F%2Fraw.githubusercontent.com%2Fblackmatrix7%2Fios_rule_script%2Fmaster%2Frewrite%2FQuantumultX%2FAdvertisingLite%2FAdvertisingLite.conf%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-%E9%BB%91%E7%9F%A9%E9%98%B5%E7%B2%BE%E7%AE%80%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%2C%22https%3A%2F%2Fraw.githubusercontent.com%2Fwaynekke%2FQuantumultX-YouTube-Adblock%2Fmain%2F%25E5%258E%25BB%25E5%25B9%25BF%25E5%2591%258A30%2F%25E5%258E%25BB%25E5%25B9%25BF%25E5%2591%258A30.qxrewrite%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-12306%E4%B8%8E%E5%85%AC%E4%BC%97%E5%8F%B7%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%5D%7D)

圈叉会通过“添加资源”把这些条目加入现有配置，不会替换其他配置。导入后可以在远程资源列表中查看、更新或停用每项规则。

## 包含内容

| 类型 | 资源 | 作用 |
|---|---|---|
| 广告分流 | 黑矩阵精简广告列表 | 按广告域名拦截请求，精简版可单独使用 |
| 直连例外 | `ad.12306.cn` | 让 12306 广告接口能到达重写脚本 |
| 广告重写 | YouTube（优兔）专用规则 | 处理视频平台广告请求 |
| 广告重写 | 黑矩阵精简广告重写 | 处理应用广告接口 |
| 广告重写 | 12306 与微信公众号 | 修改指定广告接口的响应内容 |

## 从原配置中筛选的范围

保留了专门用于广告的分流与重写内容，没有把隐私保护专用规则并入新包。原配置中的 Limbo 列表同时合并广告、隐私追踪等多个来源；anti-AD（反广告）项目也说明会屏蔽部分日志收集与统计域名，因此没有把这两类混合列表作为独立资源加入。广告规则本身仍可能拦截广告展示统计请求。

黑矩阵精简广告列表的数据源已包含多个广告规则项目，不建议再和原配置里的独立 NobyDa、anti-AD、anti-ad.net 或 Limbo 列表叠加。尤其旧的 NobyDa 列表会拒绝 `ad.12306.cn`，可能在重写前拦截 12306 请求。导入后建议停用这些旧广告订阅及原有相同来源的重复项。

YouTubeAds 的重复条目还带有画中画、后台播放或自动翻译等额外功能；lhie1 重写混合多类规则，所以没有整份纳入，只留下可单独识别的广告处理内容。`udp_drop_list=443` 会影响全局 UDP 443 流量，也没有纳入。

## 使用说明

- 分流规则按域名拦截广告请求，重写规则修改指定广告接口。它不会识别屏幕并自动点击“跳过”按钮。
- 12306 重写依赖 `ad.12306.cn` 可直连访问。新包里的直连例外排在广告分流规则前面；如果已有本地规则或旧订阅更早拒绝该域名，请停用旧规则或将该域名设为直连。
- HTTPS 响应重写需要圈叉中间人证书已安装并在系统中信任。请在圈叉内单独生成和管理证书。
- 远程规则由各上游维护，可能随上游更新或应用版本变化而变化。本包已核对导入结构与自写模块引用地址，尚未在你的设备上实测。

资源清单见 `resources.json`；12306 直连例外见 `12306-direct.list`；原生重写模块见 `去广告30.qxrewrite`。
