/**
 * YouTube移动网页广告字段清理
 * Quantumult X script-response-body
 *
 * 仅供 /youtubei/v1/player 的 JSON 响应使用。
 * 若响应不是预期的播放器JSON，或解析失败，则原样放行。
 */
(function () {
    const responseBody =
        typeof $response !== "undefined" && $response
            ? $response.body
            : undefined;

    function passThrough() {
        if (typeof responseBody === "string") {
            $done({ body: responseBody });
        } else {
            $done({});
        }
    }

    const adKeys = [
        "adBreakHeartbeatParams",
        "adPlacements",
        "adSlots",
        "adBreaks",
        "playerAds"
    ];

    const playerMarkers = [
        "playabilityStatus",
        "streamingData",
        "videoDetails",
        "playerResponse",
        "responseContext"
    ];

    function isObject(value) {
        return value !== null && typeof value === "object";
    }

    function looksLikePlayerResponse(value) {
        return isObject(value) && playerMarkers.some(function (key) {
            return Object.prototype.hasOwnProperty.call(value, key);
        });
    }

    function removeAdFields(value) {
        if (!isObject(value)) {
            return false;
        }

        let changed = false;

        adKeys.forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                delete value[key];
                changed = true;
            }
        });

        Object.keys(value).forEach(function (key) {
            if (removeAdFields(value[key])) {
                changed = true;
            }
        });

        return changed;
    }

    try {
        if (typeof responseBody !== "string" || responseBody.length === 0) {
            passThrough();
            return;
        }

        const payload = JSON.parse(responseBody);

        if (!looksLikePlayerResponse(payload)) {
            passThrough();
            return;
        }

        if (!removeAdFields(payload)) {
            passThrough();
            return;
        }

        $done({ body: JSON.stringify(payload) });
    } catch (error) {
        console.log("[YouTube去广告] 播放器响应无法处理，原样放行：" + String(error));
        passThrough();
    }
})();
