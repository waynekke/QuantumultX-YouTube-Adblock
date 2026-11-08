# 去广告30

这是从你提供的圈叉配置中整理出的广告专用资源包，使用圈叉可导入的远程分流与重写格式。当前包含 1 条广告分流订阅和 3 条广告重写资源。

## 一键加入圈叉

[点此将去广告30加入圈叉](https://quantumult.app/x/open-app/add-resource?remote-resource=%7B%22filter_remote%22%3A%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fblackmatrix7%2Fios_rule_script%2Fmaster%2Frule%2FQuantumultX%2FAdvertisingLite%2FAdvertisingLite.list%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-%E9%BB%91%E7%9F%A9%E9%98%B5%E7%B2%BE%E7%AE%80%E5%B9%BF%E5%91%8A%E5%88%86%E6%B5%81%2C%20force-policy%3Dreject%2C%20update-interval%3D172800%2C%20opt-parser%3Dfalse%2C%20enabled%3Dtrue%22%5D%2C%22rewrite_remote%22%3A%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fwaynekke%2FQuantumultX-YouTube-Adblock%2Fmain%2Fyoutube_adblock.qxrewrite%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-YouTube%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%2C%22https%3A%2F%2Fraw.githubusercontent.com%2Fblackmatrix7%2Fios_rule_script%2Fmaster%2Frewrite%2FQuantumultX%2FAdvertisingLite%2FAdvertisingLite.conf%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-%E9%BB%91%E7%9F%A9%E9%98%B5%E7%B2%BE%E7%AE%80%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%2C%22https%3A%2F%2Fraw.githubusercontent.com%2Fwaynekke%2FQuantumultX-YouTube-Adblock%2Fmain%2F%25E5%258E%25BB%25E5%25B9%25BF%25E5%2591%258A30%2F%25E5%258E%25BB%25E5%25B9%25BF%25E5%2591%258A30.qxrewrite%2C%20tag%3D%E5%8E%BB%E5%B9%BF%E5%91%8A30-%E5%85%AC%E4%BC%97%E5%8F%B7%E5%B9%BF%E5%91%8A%E9%87%8D%E5%86%99%2C%20update-interval%3D172800%2C%20opt-parser%3Dtrue%2C%20enabled%3Dtrue%22%5D%7D)

圈叉会通过“添加资源”把这些条目加入现有配置，不会替换其他配置。导入后可在远程资源列表中查看、更新或停用每项规则。

## 包含内容

| 类型 | 资源 | 作用 |
|---|---|---|
| 广告分流 | 黑矩阵精简广告列表 | 按广告域名拦截请求 |
| 广告重写 | YouTube（优兔）专用规则 | 处理视频平台广告请求 |
| 广告重写 | 黑矩阵精简广告重写 | 处理应用广告接口 |
| 广告重写 | 微信公众号 | 修改公众号文章广告接口的响应内容 |

## 范围说明

只保留广告分流与广告重写内容，没有把隐私保护专用规则并入新包。原配置中的 Limbo 列表合并了广告、隐私追踪等多个来源；anti-AD（反广告）项目也说明会屏蔽部分日志收集与统计域名，因此这两类混合列表没有纳入。广告规则本身仍可能拦截广告展示统计请求。

如果原配置仍启用了旧的 Limbo、anti-AD、anti-ad.net 或 NobyDa 订阅，添加资源不会自动移除它们；为了只使用这个广告包并避免重复规则，可在圈叉中停用旧订阅。相同来源的旧黑矩阵或 YouTube 资源也建议只保留一份。

## 使用说明

- 分流规则按域名拦截广告请求，重写规则修改指定广告接口。它不会识别屏幕并自动点击“跳过”按钮。
- HTTPS 响应重写需要圈叉中间人证书已安装并在系统中信任。请在圈叉内单独生成和管理证书。
- 远程规则由各上游维护，可能随上游更新或应用版本变化而变化。本包已核对导入结构与微信公众号重写模块引用地址，尚未在你的设备上实测。

资源清单见 `resources.json`；微信公众号广告重写模块见 `去广告30.qxrewrite`。
