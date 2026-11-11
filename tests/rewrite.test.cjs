const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const script = new vm.Script(fs.readFileSync(path.join(root, "youtube_no_ads.js"), "utf8"));
const watch = "https://m.youtube.com/watch?v=sample";
const api = "https://m.youtube.com/youtubei/v1/";

const cleanPlayer = {
    playabilityStatus: { status: "OK" },
    videoDetails: { videoId: "sample", title: "带括号 { } 和 </script> 字样的标题" },
    streamingData: { formats: [{ url: "https://example.invalid/media?sample=a%2Bb" }] }
};
const player = { ...cleanPlayer, adSlots: [{}], adPlacements: [{}], playerAds: [{}] };
const video = { videoRenderer: { videoId: "sample" } };
const ad = { richItemRenderer: { content: { adSlotRenderer: {} } }, trackingParams: "sample" };
const more = { continuationItemRenderer: { continuationEndpoint: { continuationCommand: { token: "next" } } } };

function embedded(data) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}

function rewrite(url, body, statusCode = 200) {
    const calls = [];
    script.runInNewContext({
        $request: { url },
        $response: { body, statusCode },
        $done(result) { calls.push(result); }
    }, { timeout: 1000 });
    assert.equal(calls.length, 1);
    return calls[0].body ?? body;
}

function json(url, input) {
    return JSON.parse(rewrite(url, JSON.stringify(input)));
}

test("属性、文本区、模板、注释与非脚本数据保持原样", () => {
    const assignment = "var ytInitialPlayerResponse = " + embedded(player) + ";";
    const fake = "<script>" + assignment + "</script>";
    const regions = [
        "<div data-note='" + fake + "'></div>",
        "<textarea>" + fake + "</textarea>",
        "<title>" + fake + "</title>",
        "<style>/* " + fake + " */</style>",
        "<noscript>" + fake + "</noscript>",
        "<template><template>" + fake + "</template></template>",
        "<svg xmlns=http://www.w3.org/2000/svg/>" + fake + "</svg>",
        "<!-- " + fake + " --!>",
        '<script type="text/plain">' + assignment + "</script>",
        '<script nonce="sample"src="/script.js">' + assignment + "</script>"
    ];
    for (const region of regions) {
        const body = "<!doctype html>" + region;
        assert.equal(rewrite(watch, body), body, region.slice(0, 50));
    }
});

test("首屏识别播放器变量及初始列表，保留原有脚本结构", () => {
    const prefix = '<script nonce="left>right">/* 注释 */ "use strict";\n';
    const suffix = "\nvar keep = '原代码';</script>";
    const first = prefix + "window['playerResponse'] = " + embedded(player) + ";"
        + "\n// 列表\nvar ytInitialData = " + embedded({ contents: [video, ad, more] }) + ";" + suffix;
    const data = '<script id="yt-initial-data" type="application/json">'
        + embedded({ contents: [ad, video, more] }) + "</script>";
    const body = "<!doctype html><svg/><main>" + first + data + "</main>";
    const out = rewrite(watch, body);
    assert.ok(out.includes(prefix + "window['playerResponse'] = " + embedded(cleanPlayer) + ";"));
    assert.ok(out.includes("\n// 列表\nvar ytInitialData = " + embedded({ contents: [video, more] }) + ";" + suffix));
    assert.ok(out.includes('<script id="yt-initial-data" type="application/json">'
        + embedded({ contents: [video, more] }) + "</script>"));
});

test("异常或无广告的响应保持原样", () => {
    const assignment = "var ytInitialPlayerResponse = " + embedded(player) + ";";
    for (const body of [
        "<html><!-- 未结束 <script>" + assignment + "</script>",
        '<html><div data-note="未结束<script>' + assignment + "</script>",
        "<html><script><!-- <script></script><script>" + assignment + "</script></script>",
        "<html><script>var ytInitialData = {notJson};</script>",
        "<html><script>var ytInitialPlayerResponse = " + embedded(cleanPlayer) + ";</script>"
    ]) assert.equal(rewrite(watch, body), body);
    const body = JSON.stringify(player);
    assert.equal(rewrite(api + "player", body, 403), body);
    assert.equal(rewrite(api + "player/ad_break", body), body);
    assert.equal(rewrite(api + "player", "{broken"), "{broken");
});

test("合并及预加载响应保留视频、播放地址与分页", () => {
    const mixed = { adSlotRenderer: {}, videoRenderer: { videoId: "mixed" } };
    const watchNextResponse = { contents: [ad, video, mixed, more] };
    assert.deepEqual(json(api + "get_watch", { playerResponse: player, watchNextResponse }), {
        playerResponse: cleanPlayer,
        watchNextResponse: { contents: [video, { videoRenderer: mixed.videoRenderer }, more] }
    });
    const prefix = "\uFEFF)]}',\r\n";
    const prefetch = { endpoint: { watchEndpoint: { unserializedPrefetchData: { playerResponse: player } } } };
    const output = rewrite(api + "resolve_url", prefix + JSON.stringify(prefetch));
    assert.equal(output.slice(0, prefix.length), prefix);
    assert.deepEqual(JSON.parse(output.slice(prefix.length)).endpoint.watchEndpoint.unserializedPrefetchData.playerResponse, cleanPlayer);
});

test("短视频广告标记仅用于短视频序列", () => {
    function reel(videoId, isAd) {
        return { command: { reelWatchEndpoint: { videoId, adClientParams: { isAd } } } };
    }
    const regular = reel("regular", false);
    const promoted = reel("promoted", true);
    const source = { entries: [regular, promoted], continuation: "next" };
    const clean = { entries: [regular], continuation: "next" };
    assert.deepEqual(json(api + "browse", source), source);
    assert.deepEqual(json(api + "reel/reel_watch_sequence", source), clean);
    assert.deepEqual(json(api + "get_watch", { reelWatchSequenceResponse: source }), {
        reelWatchSequenceResponse: clean
    });
    assert.deepEqual(json("https://m.youtube.com/shorts/sample", source), clean);
    const html = "<!doctype html><script>var ytInitialData = " + embedded(source) + ";</script>";
    assert.ok(rewrite("https://m.youtube.com/shorts/sample", html).includes(embedded(clean)));
});

test("两条响应重写共用脚本，视频流和字幕路径保持畅通", () => {
    const rules = fs.readFileSync(path.join(root, "youtube_adblock.qxrewrite"), "utf8")
        .split("\n").filter((line) => line.startsWith("^")).map((line) => {
            const [pattern, action] = line.split(" url ");
            return { regex: new RegExp(pattern), action };
        });
    const responses = rules.filter((rule) => rule.action.startsWith("script-response-body "));
    assert.equal(responses.length, 2);
    assert.equal(responses[0].action, responses[1].action);
    for (const endpoint of ["player", "get_watch", "resolve_url", "browse", "next", "search",
        "reel/reel_item_watch", "reel/reel_watch_sequence"]) {
        assert.equal(responses.filter((rule) => rule.regex.test(api + endpoint + "?prettyPrint=false")).length, 1);
    }
    assert.equal(responses.filter((rule) => rule.regex.test(watch)).length, 1);
    for (const url of ["https://m.youtube.com/api/timedtext?v=sample", "https://r1.googlevideo.com/videoplayback",
        "https://youtubei.googleapis.com/youtubei/v1/player", api + "player/ad_break"]) {
        assert.equal(rules.some((rule) => rule.regex.test(url)), false, url);
    }
});
