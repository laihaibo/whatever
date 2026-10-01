#!/usr/bin/env node
/**
 * 拉取全部视频的 AI 字幕（文案）+ AI 总结（需登录态）
 *
 * 前置: BILI_SESSDATA 从环境变量或 .env.local 读取（凭据不入源码）
 *       获取方式: 浏览器登录 bilibili.com → F12 → Application → Cookies →
 *       https://www.bilibili.com → 复制 SESSDATA 的值
 *
 * 用法: node scripts/fetch-transcripts.mjs [--out data/transcripts.json]
 * 流程: nav(WBI密钥,验证登录) → 逐视频: pagelist(cid) → player/wbi/v2(签名+SESSDATA,字幕列表)
 *       → 下载字幕JSON(aisubtitle.hdslb.com) → conclusion/get(AI总结,签名)
 * 反爬: 视频间间隔 3-5s，412/风控指数退避；凭据仅从环境变量读取
 */
import { createHash } from 'node:crypto';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MID = '287487019';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---------- 凭据: 环境变量或 .env.local ----------
async function loadSessdata() {
  if (process.env.BILI_SESSDATA) return process.env.BILI_SESSDATA.trim();
  try {
    const envPath = path.resolve('.env.local');
    const raw = await readFile(envPath, 'utf8');
    const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith('BILI_SESSDATA='));
    const val = line?.split('=').slice(1).join('=').trim();
    if (val) return val;
  } catch {
    /* .env.local 不存在 */
  }
  return null;
}

// ---------- 安全约束: 仅 https；api.bilibili.com + *.hdslb.com 白名单 ----------
function assertAllowedUrl(u, refererNeeded = false) {
  const url = new URL(u.startsWith('//') ? `https:${u}` : u);
  const ok =
    url.protocol === 'https:' &&
    (url.hostname === 'api.bilibili.com' || url.hostname.endsWith('.hdslb.com'));
  if (!ok) throw new Error(`blocked non-allowlist url: ${u}`);
  return url.toString();
}

// ---------- WBI 签名 ----------
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];
function getMixinKey(imgKey, subKey) {
  const raw = imgKey + subKey;
  return MIXIN_KEY_ENC_TAB.map((i) => raw[i]).join('').slice(0, 32);
}
function keyFromUrl(u) {
  const name = new URL(u.startsWith('//') ? `https:${u}` : u).pathname.split('/').pop() ?? '';
  return name.replace(/\.[a-z]+$/i, '');
}
function wbiSign(params, mixinKey) {
  const wts = Math.floor(Date.now() / 1000);
  const p = { ...params, wts };
  const query = Object.keys(p)
    .sort()
    .map((k) => {
      const v = String(p[k]).replace(/[!'()*]/g, '');
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .join('&');
  const w_rid = createHash('md5').update(query + mixinKey).digest('hex');
  return `${query}&w_rid=${w_rid}&wts=${wts}`;
}

// ---------- 带退避的 GET ----------
async function getJson(url, headers, { maxRetries = 5, label = '' } = {}) {
  assertAllowedUrl(url);
  let delay = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers });
    } catch (e) {
      if (attempt === maxRetries) throw new Error(`网络错误: ${e.message}`);
      console.warn(`  [${label}] 网络错误，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    if (res.status === 412) {
      if (attempt === maxRetries) throw new Error(`[${label}] HTTP 412 重试耗尽`);
      console.warn(`  [${label}] HTTP 412，${Math.round(delay / 1000)}s 后重试`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('json')) {
      if (attempt === maxRetries) throw new Error(`[${label}] 非 JSON 响应 (HTTP ${res.status}, ${ct})`);
      console.warn(`  [${label}] 非JSON(HTTP ${res.status})，${Math.round(delay / 1000)}s 后重试`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error(`[${label}] JSON 解析失败`);
    if (json.code === -352 || json.code === -412) {
      if (attempt === maxRetries) throw new Error(`[${label}] 风控 code=${json.code} 重试耗尽`);
      console.warn(`  [${label}] 风控 code=${json.code}，${Math.round(delay / 1000)}s 后重试`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    return json;
  }
  throw new Error('unreachable');
}

async function main() {
  const outIdx = process.argv.indexOf('--out');
  const outPath = path.resolve(outIdx > -1 ? process.argv[outIdx + 1] : 'data/transcripts.json');

  const sessdata = await loadSessdata();
  if (!sessdata) {
    console.error('未找到 BILI_SESSDATA。请设置环境变量或在 .env.local 中填入 BILI_SESSDATA=<值>');
    process.exit(1);
  }
  const cookie = `SESSDATA=${sessdata}`;
  const headers = {
    'User-Agent': UA,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: 'https://www.bilibili.com/',
    Cookie: cookie,
  };

  // 0) nav: WBI 密钥 + 登录态校验
  console.log('[0/3] 获取 WBI 密钥并校验登录态…');
  const nav = await getJson('https://api.bilibili.com/x/web-interface/nav', headers, { label: 'nav' });
  if (!nav.data?.wbi_img?.img_url) throw new Error(`nav 未返回 wbi 密钥: ${nav.code} ${nav.message}`);
  if (!nav.data.isLogin) {
    console.warn('  ⚠ SESSDATA 无效或已过期 (isLogin=false)，字幕大概率拿不到，仍会尝试…');
  } else {
    console.log(`  登录态有效: ${nav.data.uname ?? '(已登录)'} ✓`);
  }
  const mixinKey = getMixinKey(keyFromUrl(nav.data.wbi_img.img_url), keyFromUrl(nav.data.wbi_img.sub_url));

  const videos = JSON.parse(await readFile(path.resolve('data/videos.json'), 'utf8')).videos;
  console.log(`[1/3] 开始逐视频拉取字幕与 AI 总结，共 ${videos.length} 个…\n`);

  const transcripts = [];
  const missing = [];

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const item = {
      bvid: v.bvid,
      title: v.title,
      cid: null,
      subtitle: { source: null, lan: null, aiType: null, lineCount: 0, text: '' },
      aiSummary: { summary: null, outline: null },
    };
    try {
      // a) cid
      const pl = await getJson(`https://api.bilibili.com/x/player/pagelist?bvid=${v.bvid}`, headers, {
        label: `pagelist ${v.bvid}`,
      });
      if (pl.code !== 0 || !pl.data?.length) throw new Error(`pagelist code=${pl.code}`);
      item.cid = pl.data[0].cid;

      // b) 字幕列表 (签名 + 登录态)
      const qs = wbiSign({ bvid: v.bvid, cid: String(item.cid) }, mixinKey);
      const p = await getJson(`https://api.bilibili.com/x/player/wbi/v2?${qs}`, headers, {
        label: `player ${v.bvid}`,
      });
      if (p.code !== 0) throw new Error(`player code=${p.code} ${p.message}`);
      const subs = p.data?.subtitle?.subtitles ?? [];
      const pick = subs.find((s) => s.lan === 'zh-CN') ?? subs[0] ?? null;

      if (pick?.subtitle_url) {
        // c) 下载字幕 JSON
        const surl = assertAllowedUrl(pick.subtitle_url);
        const sub = await getJson(surl, { ...headers, Referer: 'https://www.bilibili.com/' }, {
          label: `subtitle ${v.bvid}`,
        });
        const body = sub.body ?? [];
        item.subtitle = {
          source: pick.ai_type ? 'ai' : 'cc',
          lan: pick.lan,
          aiType: pick.ai_type ?? null,
          lineCount: body.length,
          text: body.map((l) => l.content).join(''),
        };
      }

      // d) AI 总结 (签名)
      const cqs = wbiSign({ bvid: v.bvid, cid: String(item.cid), up_mid: MID }, mixinKey);
      const c = await getJson(
        `https://api.bilibili.com/x/web-interface/view/conclusion/get?${cqs}`,
        headers,
        { label: `conclusion ${v.bvid}` },
      );
      if (c.code === 0 && c.data?.model_summary) {
        item.aiSummary = {
          summary: c.data.model_summary.summary ?? null,
          outline: c.data.model_summary.outline ?? null,
        };
      }
    } catch (e) {
      console.warn(`  ✗ ${v.bvid}: ${e.message}`);
      item.error = e.message;
    }

    const got = item.subtitle.text.length > 0 || item.aiSummary.summary;
    if (got) {
      console.log(
        `  [${i + 1}/${videos.length}] ✓ ${v.bvid} | 字幕 ${item.subtitle.lineCount}行/${item.subtitle.text.length}字(${item.subtitle.source ?? '-'}) | AI总结 ${item.aiSummary.summary ? '有' : '无'} | ${v.title.slice(0, 20)}`,
      );
    } else {
      console.log(`  [${i + 1}/${videos.length}] ✗ 无文案 ${v.bvid} ${v.title.slice(0, 24)}`);
      missing.push({ bvid: v.bvid, title: v.title, error: item.error ?? 'no subtitle/summary' });
    }
    transcripts.push(item);

    if (i < videos.length - 1) await sleep(randInt(3000, 5000));
  }

  // [3/3] 落盘
  const withSub = transcripts.filter((t) => t.subtitle.text).length;
  const withSum = transcripts.filter((t) => t.aiSummary.summary).length;
  const payload = {
    meta: {
      fetchedAt: new Date().toISOString(),
      source: 'player/wbi/v2 (AI字幕) + view/conclusion/get (AI总结)，需登录态',
      total: transcripts.length,
      withSubtitle: withSub,
      withAiSummary: withSum,
      missing,
      note: '字幕文本为 B 站 ASR 自动生成，可能存在同音字误差；用于心得提炼时以语义为准',
    },
    transcripts,
  };
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`\n[3/3] 完成: ${outPath}`);
  console.log(`字幕: ${withSub}/${transcripts.length} | AI总结: ${withSum}/${transcripts.length} | 缺失: ${missing.length}`);
}

main().catch((e) => {
  console.error('\n失败:', e.message);
  process.exit(1);
});
