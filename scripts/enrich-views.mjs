#!/usr/bin/env node
/**
 * 按 bvid 清单逐个调用公开的 /x/web-interface/view 接口富化视频元数据
 *
 * 背景: /x/space/wbi/arc/search 对匿名请求存在强风控(-352/-412)，改用
 * 「真实浏览器渲染空间页提取 bvid 清单 (data/bvids.json) + view 接口逐个富化」的旁路。
 * view 接口无需 WBI 签名，匿名可用。
 *
 * 用法: node scripts/enrich-views.mjs [--in data/bvids.json] [--out data/videos.json]
 * 请求间隔 3-5s，412/风控退避重试；凭据仅从环境变量 BILI_SESSDATA 读取。
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MID = '287487019';
const SOURCE_SHORTLINK = 'https://b23.tv/ud5Icrn';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---------- 安全约束: 仅 https + host 白名单 ----------
const ALLOWED_HOSTS = new Set(['api.bilibili.com']);
function assertAllowedUrl(u) {
  const url = new URL(u);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`blocked non-allowlist url: ${u}`);
  }
  return u;
}

async function getView(bvid, headers, { maxRetries = 5 } = {}) {
  assertAllowedUrl(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
  let delay = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res;
    try {
      res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, { headers });
    } catch (e) {
      if (attempt === maxRetries) throw new Error(`网络错误: ${e.message}`);
      console.warn(`  [${bvid}] 网络错误(${e.message})，重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    if (res.status === 412) {
      if (attempt === maxRetries) throw new Error(`[${bvid}] HTTP 412，重试耗尽`);
      console.warn(`  [${bvid}] HTTP 412，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error(`[${bvid}] 非 JSON 响应 (HTTP ${res.status})`);
    if (json.code === -352 || json.code === -412) {
      if (attempt === maxRetries) throw new Error(`[${bvid}] 风控 code=${json.code}，重试耗尽`);
      console.warn(`  [${bvid}] 风控 code=${json.code}，${Math.round(delay / 1000)}s 后重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
      continue;
    }
    return json; // code 0 或其他业务错误码（如 62002 稿件不可见）都原样返回
  }
  throw new Error('unreachable');
}

function isoOrNull(unix) {
  return typeof unix === 'number' && unix > 0 ? new Date(unix * 1000).toISOString() : null;
}

async function main() {
  const argOf = (flag, dflt) => {
    const i = process.argv.indexOf(flag);
    return i > -1 ? process.argv[i + 1] : dflt;
  };
  const inPath = path.resolve(argOf('--in', 'data/bvids.json'));
  const outPath = path.resolve(argOf('--out', 'data/videos.json'));

  const list = JSON.parse(await readFile(inPath, 'utf8'));
  const bvids = list.cards.map((c) => c.bvid);
  console.log(`待富化 ${bvids.length} 个视频，来源: ${inPath}\n`);

  const headers = {
    'User-Agent': UA,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Referer: `https://space.bilibili.com/${MID}/`,
  };
  if (process.env.BILI_SESSDATA) headers.Cookie = `SESSDATA=${process.env.BILI_SESSDATA}`;

  const videos = [];
  const failed = [];

  for (let i = 0; i < bvids.length; i++) {
    const bvid = bvids[i];
    const j = await getView(bvid, headers);
    if (j.code !== 0 || !j.data) {
      console.warn(`  [${i + 1}/${bvids.length}] ${bvid} 业务错误 code=${j.code} ${j.message}`);
      failed.push({ bvid, code: j.code, message: j.message });
    } else {
      const d = j.data;
      videos.push({
        bvid: d.bvid,
        aid: d.aid,
        title: d.title,
        description: d.desc ?? '',
        tname: d.tname || null,
        duration: d.duration,
        pubdate: d.pubdate,
        pubdateISO: isoOrNull(d.pubdate),
        ctime: d.ctime,
        ctimeISO: isoOrNull(d.ctime),
        stat: {
          view: d.stat?.view ?? null,
          danmaku: d.stat?.danmaku ?? null,
          reply: d.stat?.reply ?? null,
          favorite: d.stat?.favorite ?? null,
          coin: d.stat?.coin ?? null,
          share: d.stat?.share ?? null,
          like: d.stat?.like ?? null,
        },
        pic: d.pic ? (d.pic.startsWith('//') ? `https:${d.pic}` : d.pic) : null,
        url: `https://www.bilibili.com/video/${d.bvid}`,
        owner: { mid: d.owner?.mid ?? MID, name: d.owner?.name ?? null },
      });
      console.log(
        `  [${i + 1}/${bvids.length}] ${bvid} ✓ ${d.title.slice(0, 30)} | 播放 ${d.stat?.view} | ${isoOrNull(d.pubdate)?.slice(0, 10)}`,
      );
    }
    if (i < bvids.length - 1) await sleep(randInt(3000, 5000));
  }

  // 按发布时间倒序
  videos.sort((a, b) => (b.pubdate ?? 0) - (a.pubdate ?? 0));

  const payload = {
    meta: {
      source: SOURCE_SHORTLINK,
      mid: MID,
      uname: videos[0]?.owner?.name ?? '嘴比饺子馅儿碎',
      total: videos.length,
      fetchedAt: new Date().toISOString(),
      method: 'space page DOM via real browser (bvid list) + /x/web-interface/view per-bvid enrichment',
      note:
        '/x/space/wbi/arc/search 对匿名请求存在强风控(-352/-412)，故采用浏览器旁路提取清单；' +
        '数据为公开接口采集的标题/简介/统计，不含视频正文。空间页显示视频 23 + 图文 6 = 投稿 29，' +
        'card 接口 archive_count=24，两者与实际可见视频数 23 的差异可能来自隐藏/下架稿件。',
      failed,
    },
    videos,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`\n完成: ${outPath} (${videos.length} 条, 失败 ${failed.length} 条)`);
  console.log(`UP 主: ${payload.meta.uname}`);
  console.log('\n按发布时间倒序前 5 条:');
  for (const v of videos.slice(0, 5)) {
    console.log(`  - [${v.pubdateISO?.slice(0, 10)}] ${v.title} | 简介 ${v.description.length} 字`);
  }
  const noDesc = videos.filter((v) => !v.description).length;
  console.log(`\n无简介视频数: ${noDesc}/${videos.length}`);
}

main().catch((e) => {
  console.error('\n失败:', e.message);
  process.exit(1);
});
