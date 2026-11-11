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
    const initialAssignment = /^(?:(?:(?:var|let|const)\s+|window\s*\.\s*)?(ytInitialData|ytInitialPlayerResponse|playerResponse)|window\s*\[\s*(["'])(ytInitialData|ytInitialPlayerResponse|playerResponse)\2\s*\])\s*=\s*(?=\{)/;
    const scriptTrivia = /^(?:\s|\/\/[^\r\n]*(?:\r\n?|\n|$)|\/\*[\s\S]*?\*\/)*/;
    const rawTextTags = new Set(["script", "style", "title", "textarea", "iframe", "xmp", "noembed", "noframes", "noscript"]);
    const inertTags = new Set(["template", "svg", "math"]);

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

    function removeAds(payload, playerPayload, reelSequence) {
        let changed = false;

        function visit(value, inPlayer, inReelSequence) {
            if (!isObject(value)) {
                return;
            }

            if (Array.isArray(value)) {
                let kept = 0;
                for (const item of value) {
                    if (isAdCard(item)) {
                        changed = true;
                        continue;
                    }
                    visit(item, inPlayer, inReelSequence);
                    value[kept++] = item;
                }
                value.length = kept;
                return;
            }

            if (inReelSequence && Array.isArray(value.entries)) {
                const entries = value.entries.filter(function (item) {
                    return item?.command?.reelWatchEndpoint?.adClientParams?.isAd !== true;
                });
                if (entries.length !== value.entries.length) {
                    value.entries = entries;
                    changed = true;
                }
            }

            // 混合项保留普通字段。纯广告项在上面的列表处理中整项移除。
            for (const key of Object.keys(value)) {
                if (adRenderers.has(key) || (inPlayer && playerAdFields.has(key))) {
                    delete value[key];
                    changed = true;
                    continue;
                }
                visit(value[key], inPlayer || key === "playerResponse", key === "reelWatchSequenceResponse");
            }
        }

        visit(payload, playerPayload, reelSequence);
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
            const reelSequence = endpoint === "reel/reel_watch_sequence" || endpoint === "shorts-page";
            return removeAds(data, playerPayload, reelSequence) ? JSON.stringify(data) : source;
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

    function rewriteInlineScript(script, pageEndpoint) {
        let offset = scriptTrivia.exec(script)[0].length;
        const directive = /^(?:"use strict"|'use strict')\s*;/.exec(script.slice(offset));
        if (directive) {
            offset += directive[0].length;
        }
        let copied = 0;
        let result = "";

        // 只处理脚本开头连续出现的已知赋值，保留注释和其余代码。
        while (offset < script.length) {
            offset += scriptTrivia.exec(script.slice(offset))[0].length;
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
            const updated = rewriteEmbeddedJson(source, name === "ytInitialData" ? pageEndpoint : "player");
            if (updated !== source) {
                result += script.slice(copied, start) + updated;
                copied = end;
            }
            offset = end + separator[0].length;
        }

        return copied ? result + script.slice(copied) : script;
    }

    function scanTag(body, start) {
        let quote = "";
        let waitingForValue = false;
        let unquotedValue = false;
        for (let index = start; index < body.length; index++) {
            const char = body[index];
            if (quote) {
                if (char === quote) {
                    quote = "";
                }
                continue;
            }
            if (char === ">") {
                return {
                    end: index + 1,
                    selfClosing: body[index - 1] === "/" && !unquotedValue && !waitingForValue
                };
            }
            if (/[\t\n\f\r ]/.test(char)) {
                unquotedValue = false;
            } else if (waitingForValue) {
                waitingForValue = false;
                if (char === '"' || char === "'") {
                    quote = char;
                } else {
                    unquotedValue = true;
                }
            } else if (!unquotedValue && char === "=") {
                waitingForValue = true;
            }
        }
        return null;
    }

    function declarationEnd(body, marker, start) {
        if (marker === "<!--") {
            if (body[start] === ">") {
                return start + 1;
            }
            if (body.startsWith("->", start)) {
                return start + 2;
            }
            const commentEnd = /--!?>/g;
            commentEnd.lastIndex = start;
            return commentEnd.exec(body) ? commentEnd.lastIndex : -1;
        }
        const ending = marker.toUpperCase() === "<![CDATA[" ? "]]>" : ">";
        const end = body.indexOf(ending, start);
        return end < 0 ? -1 : end + ending.length;
    }

    function rewriteScript(attributes, script, pageEndpoint) {
        const attribute = /([^\t\n\f\r =/"'<>]+)(?:[\t\n\f\r ]*=[\t\n\f\r ]*(?:"([^"]*)"|'([^']*)'|([^\t\n\f\r >]+)))?/g;
        let id;
        let type;
        let match;
        while ((match = attribute.exec(attributes))) {
            const name = match[1].toLowerCase();
            const value = match[2] ?? match[3] ?? match[4] ?? "";
            if (name === "src") {
                return script;
            }
            if (name === "id" && id === undefined) {
                id = value;
            }
            if (name === "type" && type === undefined) {
                type = value.trim().toLowerCase();
            }
        }

        if (id === "yt-initial-data" && (!type || /^application\/json(?:\s*;|$)/.test(type))) {
            return rewriteEmbeddedJson(script, pageEndpoint);
        }
        if (type && type !== "module" && !/^(?:text|application)\/(?:java|ecma)script$/.test(type)) {
            return script;
        }
        return rewriteInlineScript(script, pageEndpoint);
    }

    function rewriteHtml(body, pageEndpoint) {
        if (!/ytInitialData|ytInitialPlayerResponse|playerResponse|yt-initial-data/.test(body)) {
            return body;
        }

        const tags = /<!--|<!\[CDATA\[|<!|<\?|<(\/?)([a-z][^\t\n\f\r />]*)/gi;
        const inert = [];
        const chunks = [];
        let copied = 0;
        let marker;
        while ((marker = tags.exec(body))) {
            const start = tags.lastIndex;
            if (!marker[2]) {
                const end = declarationEnd(body, marker[0], start);
                if (end < 0) {
                    break;
                }
                tags.lastIndex = end;
                continue;
            }

            const tag = scanTag(body, start);
            if (!tag) {
                break;
            }
            const end = tag.end;
            tags.lastIndex = end;
            const name = marker[2].toLowerCase();
            if (inertTags.has(name)) {
                if (marker[1]) {
                    if (inert[inert.length - 1] === name) {
                        inert.pop();
                    }
                } else if (name === "template" || !tag.selfClosing) {
                    inert.push(name);
                }
                continue;
            }
            if (marker[1]) {
                continue;
            }
            if (name === "plaintext") {
                break;
            }
            if (!rawTextTags.has(name)) {
                continue;
            }

            const closingTag = new RegExp("</" + name + "(?=[\\t\\n\\f\\r />])", "ig");
            closingTag.lastIndex = end;
            const close = closingTag.exec(body);
            const closeTag = close && scanTag(body, closingTag.lastIndex);
            if (!closeTag) {
                break;
            }
            tags.lastIndex = closeTag.end;
            if (name !== "script") {
                continue;
            }

            const script = body.slice(end, close.index);
            // 旧式脚本转义会改变结束标签的含义，遇到这种写法时停止扫描。
            if (/<!--[\s\S]*?<script(?=[\t\n\f\r />])/i.test(script)) {
                break;
            }
            if (inert.length !== 0) {
                continue;
            }
            const updated = rewriteScript(body.slice(start, end - 1), script, pageEndpoint);
            if (updated !== script) {
                chunks.push(body.slice(copied, end), updated);
                copied = close.index;
            }
        }
        return copied ? chunks.join("") + body.slice(copied) : body;
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
            const pageEndpoint = path.startsWith("/shorts/") ? "shorts-page" : "page";
            return /^\s*</.test(body) ? rewriteHtml(body, pageEndpoint) : rewriteApiBody(body, pageEndpoint);
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
