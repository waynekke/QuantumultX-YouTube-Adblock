/**
 * Quantumult X（圈 X）油管网页响应重写
 * 处理播放器数据、列表中的广告项，以及网页内嵌的初始数据。
 */
(function () {
    const playerAdFields = new Set([
        "adBreakHeartbeatParams",
        "adPlacements",
        "adSlots",
        "adBreaks",
        "playerAds"
    ]);

    const playerMarkers = [
        "playabilityStatus",
        "streamingData",
        "videoDetails",
        "playerResponse",
        "responseContext"
    ];

    const adRenderers = new Set([
        "adSlotRenderer",
        "inFeedAdLayoutRenderer",
        "displayAdRenderer",
        "searchPyvRenderer",
        "promotedVideoRenderer",
        "compactPromotedVideoRenderer",
        "promotedSparklesWebRenderer",
        "promotedSparklesTextSearchRenderer",
        "companionAdRenderer",
        "playerOverlayAdsRenderer"
    ]);

    const listItemMetadata = new Set(["trackingParams", "clickTrackingParams", "loggingDirectives"]);
    const initialAssignment = /^\s*(?:(?:(?:var|let|const)\s+|window\s*\.\s*)?(ytInitialData|ytInitialPlayerResponse)|window\s*\[\s*(["'])(ytInitialData|ytInitialPlayerResponse)\2\s*\])\s*=\s*(?=\{)/;

    function isObject(value) {
        return value !== null && typeof value === "object";
    }

    function looksLikePlayerResponse(value) {
        return isObject(value) && playerMarkers.some(function (key) {
            return Object.prototype.hasOwnProperty.call(value, key);
        });
    }

    function isAdCard(value) {
        if (!isObject(value) || Array.isArray(value)) {
            return false;
        }
        const types = Object.keys(value).filter(function (key) {
            return !listItemMetadata.has(key);
        });
        if (types.length !== 1) {
            return false;
        }

        const type = types[0];
        if (type === "richItemRenderer" || type === "richSectionRenderer") {
            return isAdCard(value[type]?.content);
        }
        return adRenderers.has(type);
    }

    function removeAds(payload, playerPayload) {
        let changed = false;

        function visit(value, inPlayer, reelEntries) {
            if (!isObject(value)) {
                return;
            }

            if (Array.isArray(value)) {
                let kept = 0;
                for (const item of value) {
                    const reelAd = reelEntries && item?.command?.reelWatchEndpoint?.adClientParams?.isAd === true;
                    if (reelAd || isAdCard(item)) {
                        changed = true;
                        continue;
                    }
                    visit(item, inPlayer, false);
                    value[kept++] = item;
                }
                value.length = kept;
                return;
            }

            // 混合项保留普通字段。纯广告项在上面的列表处理中整项移除。
            for (const key of Object.keys(value)) {
                if (adRenderers.has(key) || (inPlayer && playerAdFields.has(key))) {
                    delete value[key];
                    changed = true;
                    continue;
                }
                visit(value[key], inPlayer || key === "playerResponse", key === "entries");
            }
        }

        visit(payload, playerPayload, false);
        return changed;
    }

    function rewriteJson(source, endpoint) {
        try {
            const data = JSON.parse(source);
            if (!isObject(data)) {
                return source;
            }

            if (endpoint === "player") {
                const player = Array.isArray(data)
                    ? data.some(looksLikePlayerResponse)
                    : looksLikePlayerResponse(data);
                if (!player) {
                    return source;
                }
            }

            const playerPayload = endpoint === "player" || endpoint === "get_watch"
                || endpoint === "reel/reel_item_watch";
            return removeAds(data, playerPayload) ? JSON.stringify(data) : source;
        } catch (_) {
            return source;
        }
    }

    function rewriteApiBody(body, endpoint) {
        // 保留接口可能附带的字节序标记或 JSON 防嵌入前缀。
        const prefix = /^(?:\uFEFF)?(?:\)\]\}',?\r?\n)?/.exec(body)[0];
        const json = body.slice(prefix.length);
        return prefix + rewriteJson(json, endpoint);
    }

    function rewriteEmbeddedJson(source, endpoint) {
        const result = rewriteJson(source, endpoint);
        if (result === source) {
            return source;
        }

        // 保持内嵌数据的脚本边界，避免字符串里的标签被当成网页标记。
        return result.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }

    function objectEnd(source, start) {
        let depth = 0;
        let quoted = false;
        for (let index = start; index < source.length; index++) {
            const char = source[index];
            if (quoted) {
                if (char === "\\") {
                    index++;
                } else if (char === '"') {
                    quoted = false;
                }
            } else if (char === '"') {
                quoted = true;
            } else if (char === "{") {
                depth++;
            } else if (char === "}" && --depth === 0) {
                return index + 1;
            }
        }
        return -1;
    }

    function rewriteInlineScript(script) {
        let offset = 0;
        let copied = 0;
        let result = "";

        // 只识别脚本开头的已知赋值，并允许这些赋值紧接在一起。
        while (offset < script.length) {
            const assignment = initialAssignment.exec(script.slice(offset));
            if (!assignment) {
                break;
            }
            const start = offset + assignment[0].length;
            const end = objectEnd(script, start);
            if (end === -1) {
                break;
            }
            const separator = /^\s*(?:;|$)/.exec(script.slice(end));
            if (!separator) {
                break;
            }

            const name = assignment[1] || assignment[3];
            const source = script.slice(start, end);
            const updated = rewriteEmbeddedJson(source, name === "ytInitialPlayerResponse" ? "player" : "page");
            if (updated !== source) {
                result += script.slice(copied, start) + updated;
                copied = end;
            }
            offset = end + separator[0].length;
        }

        return copied ? result + script.slice(copied) : script;
    }

    function rewriteHtml(body) {
        const tags = /<!--[\s\S]*?-->|(<script(?=[\s>])((?:[^<>"']|"[^"]*"|'[^']*')*)>)([\s\S]*?)(<\/script\s*>)/gi;
        return body.replace(tags, function (tag, open, attributes, script, close) {
            if (!open) {
                return tag;
            }

            const attribute = /\s+([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s="'<>]+)))?/g;
            let id;
            let match;
            while ((match = attribute.exec(attributes))) {
                const name = match[1].toLowerCase();
                if (name === "src") {
                    return tag;
                }
                if (name === "id" && id === undefined) {
                    id = match[2] ?? match[3] ?? match[4];
                }
            }

            const updated = id === "yt-initial-data"
                ? rewriteEmbeddedJson(script, "page")
                : rewriteInlineScript(script);
            return updated === script ? tag : open + updated + close;
        });
    }

    function rewriteResponse(url, response) {
        const body = response.body;
        if (typeof body !== "string" || body.length === 0
            || (response.statusCode != null && Number(response.statusCode) !== 200)) {
            return body;
        }

        const request = /^https?:\/\/(?:m|www)\.youtube\.com(\/[^?]*)(?:\?.*)?$/.exec(url);
        if (!request) {
            return body;
        }
        const path = request[1];
        const api = /^\/youtubei\/v1\/(player|get_watch|resolve_url|browse|next|search|reel\/(?:reel_item_watch|reel_watch_sequence))\/?$/.exec(path);
        if (api) {
            return rewriteApiBody(body, api[1]);
        }
        if (/^\/(?:(?:watch|results|playlist|shorts\/[A-Za-z0-9_-]+)\/?)?$/.test(path)) {
            return /^\s*</.test(body) ? rewriteHtml(body) : rewriteApiBody(body, "page");
        }
        return body;
    }

    let rewritten;
    try {
        rewritten = rewriteResponse($request.url, $response);
    } catch (_) {
        $done({});
        return;
    }
    $done(rewritten === $response.body ? {} : { body: rewritten });
})();
