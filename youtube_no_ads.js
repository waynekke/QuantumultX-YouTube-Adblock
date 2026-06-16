/**
 * YouTube 去广告 - Quantumult X script-response-body
 * 用于 m.youtube.com/youtubei/v1/player 接口
 * 移除响应中的广告相关字段，阻止播放器加载广告
 */

const body = JSON.parse($response.body);

// 移除顶层广告心跳参数 — 这是告诉播放器"有广告"的关键字段
delete body.adBreakHeartbeatParams;

// 移除可能的广告位配置
delete body.adPlacements;
delete body.playerAds;
delete body.adSlots;

// 处理嵌套在 playerResponse 中的广告字段
if (body.playerResponse) {
    delete body.playerResponse.adPlacements;
    delete body.playerResponse.playerAds;
    delete body.playerResponse.adBreakHeartbeatParams;
}

// 处理 nextResponse / continuation 中可能夹带的广告数据
if (body.continuationContents) {
    delete body.continuationContents.adBreakHeartbeatParams;
}

$done({ body: JSON.stringify(body) });
