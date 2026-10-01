#!/usr/bin/env node
/**
 * 拉取 B 站 UP 主「嘴比饺子馅儿碎」(mid=287487019) 的公开视频列表
 *
 * 用法: node scripts/fetch-bili.mjs [--out data/videos.json]
 * 环境变量(可选): BILI_SESSDATA — 仅当接口风控要求登录态时使用；源码不含任何凭据
 *
 * 实现要点:
 *  - WBI 签名: /x/web-interface/nav 取 img_key/sub_key → mixinKeyEncTab 交错取前 32 位
 *    → 参数加 wts、key 字典序、value 去除 !'()*、urlencode → w_rid = md5(query + mixin_key)
 *  - 反爬: 请求间隔随机 3-5s；412/-352 指数退避 3s→6s→12s…最多 5 次
 *  - 安全: 仅允许 https + 固定 host 白名单；凭据只从环境变量读取
 */
import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MID = '287487019';
const SOURCE_SHORTLINK = 'https://b23.tv/ud5Icrn';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---------- 安全约束: 仅 https + host 白名单，拒绝私有/保留地址 ----------
const ALLOWED_HOSTS = new Set(['api.bilibili.com', 'www.bilibili.com', 'space.bilibili.com']);
function assertAllowedUrl(u) {
  const url = new URL(u);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`blocked non-allowlist url: ${u}`);
  }
  return u;
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
  const name = new URL(u).pathname.split('/').pop() ?? '';
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
  return { query, w_rid, wts };
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
      console.warn(`  [${label}] 网络错误(${e.message})，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    if (res.status === 412) {
      if (attempt === maxRetries) throw new Error(`HTTP 412，重试 ${maxRetries} 次仍被拒绝`);
      console.warn(`  [${label}] HTTP 412，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error(`[${label}] 非 JSON 响应 (HTTP ${res.status})`);
    if (json.code === -352 || json.code === -412) {
      if (attempt === maxRetries) throw new Error(`[${label}] 风控 code=${json.code}，重试 ${maxRetries} 次仍被拒绝`);
      console.warn(`  [${label}] 风控 code=${json.code}，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    return json;
  }
  throw new Error('unreachable');
}

function toSeconds(len) {
  if (typeof len !== 'string') return null;
  const parts = len.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function isoOrNull(unix) {
  return typeof unix === 'number' && unix > 0 ? new Date(unix * 1000).toISOString() : null;
}

async function main() {
  const outIdx = process.argv.indexOf('--out');
  const outPath = path.resolve(outIdx > -1 ? process.argv[outIdx + 1] : 'data/videos.json');

  const baseHeaders = {
    'User-Agent': UA,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Origin: 'https://space.bilibili.com',
    Referer: `https://space.bilibili.com/${MID}/`,
  };

  // 1) 访客 Cookie (buvid3/buvid4)，降低 -352 风控概率
  console.log('[1/4] 获取访客 Cookie (finger/spi)…');
  const spi = await getJson('https://api.bilibili.com/x/frontend/finger/spi', baseHeaders, { label: 'spi' });
  if (spi.code !== 0) throw new Error(`finger/spi 失败: code=${spi.code} ${spi.message}`);
  const cookieParts = [`buvid3=${spi.data.b_3}`, `buvid4=${spi.data.b_4}`];
  if (process.env.BILI_SESSDATA) cookieParts.push(`SESSDATA=${process.env.BILI_SESSDATA}`);
  const headers = { ...baseHeaders, Cookie: cookieParts.join('; ') };

  await sleep(randInt(3000, 5000));

  // 2) nav 获取 WBI 密钥
  console.log('[2/4] 获取 WBI 密钥 (nav)…');
  const nav = await getJson('https://api.bilibili.com/x/web-interface/nav', headers, { label: 'nav' });
  // 匿名访问 nav 返回 code=-101「账号未登录」，但 data.wbi_img 照常下发，密钥可用即可
  if (!nav.data?.wbi_img?.img_url) {
    throw new Error(`nav 未返回 wbi 密钥: code=${nav.code} ${nav.message}`);
  }
  // 从 ".../wbi/<key>.png" 取文件名做 key（不能用首个 "/" 分段，否则会误取 "i0"）
  const imgKey = keyFromUrl(nav.data.wbi_img.img_url);
  const subKey = keyFromUrl(nav.data.wbi_img.sub_url);
  if (!imgKey || !subKey) throw new Error('未能从 nav 响应解析 wbi 密钥');
  const mixinKey = getMixinKey(imgKey, subKey);

  await sleep(randInt(3000, 5000));

  // 3) 签名分页拉取视频列表
  console.log('[3/4] 拉取视频列表 (x/space/wbi/arc/search)…');
  const rawItems = [];
  const seen = new Set();
  let pn = 1;
  let total = null;
  let uname = null;

  for (;;) {
    const params = {
      mid: MID,
      ps: '30',
      pn: String(pn),
      tid: '0',
      keyword: '',
      order: 'pubdate', // 按发布时间倒序，天然的内容清单顺序
      platform: 'web',
      web_location: '1550101',
      order_avoided: 'true',
    };
    const { query, w_rid, wts } = wbiSign(params, mixinKey);
    const url = `https://api.bilibili.com/x/space/wbi/arc/search?${query}&w_rid=${w_rid}&wts=${wts}`;
    const j = await getJson(url, headers, { label: `arc/search p${pn}` });
    if (j.code !== 0) throw new Error(`arc/search 失败: code=${j.code} ${j.message}`);

    const vlist = j.data?.list?.vlist ?? [];
    total = j.data?.page?.count ?? total;
    uname = vlist[0]?.author ?? uname;
    for (const v of vlist) {
      if (seen.has(v.bvid)) continue;
      seen.add(v.bvid);
      rawItems.push(v);
    }
    console.log(`  第 ${pn} 页: +${vlist.length} 条 (累计 ${rawItems.length}/${total ?? '?'} 条)`);

    if (vlist.length === 0 || rawItems.length >= (total ?? 0) || pn >= 20) break;
    pn += 1;
    await sleep(randInt(3000, 5000));
  }

  if (rawItems.length === 0) throw new Error('未拉到任何视频，请检查 mid 或风控情况');

  // 4) 归一化并落盘
  console.log('[4/4] 归一化并写入 JSON…');
  const videos = rawItems.map((v) => ({
    bvid: v.bvid,
    aid: v.aid,
    title: v.title,
    description: v.description ?? '',
    length: v.length,
    lengthSeconds: toSeconds(v.length),
    created: v.created,
    createdISO: isoOrNull(v.created),
    pubdate: v.pubdate,
    pubdateISO: isoOrNull(v.pubdate),
    play: v.play,
    danmaku: v.danmaku,
    favorites: v.favorites,
    videoReview: v.video_review,
    tname: v.tname ?? null,
    pic: v.pic ? (v.pic.startsWith('//') ? `https:${v.pic}` : v.pic) : null,
    url: `https://www.bilibili.com/video/${v.bvid}`,
  }));

  const payload = {
    meta: {
      source: SOURCE_SHORTLINK,
      endpoint: '/x/space/wbi/arc/search',
      wbiSigned: true,
      mid: MID,
      uname: uname ?? '嘴比饺子馅儿碎',
      total,
      fetchedCount: videos.length,
      fetchedAt: new Date().toISOString(),
      order: 'pubdate',
      notes: '仅公开接口采集的标题/简介与基础统计数据，不含视频正文内容',
    },
    videos,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`\n完成: ${outPath}`);
  console.log(`UP 主: ${payload.meta.uname} | 视频数: ${videos.length}/${total}`);
  console.log('\n最新 5 条预览:');
  for (const v of videos.slice(0, 5)) {
    console.log(`  - [${v.bvid}] ${v.title}`);
  }
}

main().catch((e) => {
  console.error('\n失败:', e.message);
  process.exit(1);
});
