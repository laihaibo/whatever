#!/usr/bin/env node
/**
 * 匿名下载全部视频的音频流（html5 playurl 360p mp4，无需凭据）
 * 用法: node scripts/download-audio.mjs [--dir data/audio]
 * 反爬: 间隔 3-5s；412/风控退避重试；重定向逐跳校验白名单
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 仅 https；B 站 API + 自家 CDN 白名单
const allowed = (u) => {
  const url = new URL(u);
  return (
    url.protocol === 'https:' &&
    (url.hostname === 'api.bilibili.com' ||
      url.hostname.endsWith('.bilivideo.com') ||
      url.hostname.endsWith('.akamaized.net') ||
      url.hostname.endsWith('.hdslb.com'))
  );
};
function assertAllowed(u) {
  if (!allowed(u)) throw new Error(`blocked non-allowlist url: ${u.slice(0, 80)}`);
  return u;
}

async function getJson(url, headers, { maxRetries = 5, label = '' } = {}) {
  assertAllowed(url);
  let delay = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 412) throw new Error('HTTP412');
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('json')) throw new Error(`非JSON HTTP${res.status}`);
      const json = await res.json();
      if (json.code === -352 || json.code === -412) throw new Error(`风控${json.code}`);
      return json;
    } catch (e) {
      if (attempt === maxRetries) throw new Error(`[${label}] 重试耗尽: ${e.message}`);
      console.warn(`  [${label}] ${e.message}，重试 ${attempt}/${maxRetries}`);
      await sleep(delay + randInt(0, 1500));
      delay *= 2;
    }
  }
}

async function download(url, headers, outPath, { label = '' } = {}) {
  assertAllowed(url);
  // 手动跟随重定向，逐跳校验白名单
  let target = url;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(target, { headers, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error(`[${label}] 重定向无 location`);
      target = assertAllowed(new URL(loc, target).toString());
      continue;
    }
    if (!res.ok) throw new Error(`[${label}] HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) throw new Error(`[${label}] 文件过小(${buf.length}B)，疑似风控页`);
    await writeFile(outPath, buf);
    return buf.length;
  }
  throw new Error(`[${label}] 重定向次数过多`);
}

async function main() {
  const dirIdx = process.argv.indexOf('--dir');
  const dir = path.resolve(dirIdx > -1 ? process.argv[dirIdx + 1] : 'data/audio');
  await mkdir(dir, { recursive: true });

  const videos = JSON.parse(await readFile(path.resolve('data/videos.json'), 'utf8')).videos;
  console.log(`共 ${videos.length} 个视频，音频保存到 ${dir}\n`);

  const sizes = {};
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const outPath = path.join(dir, `${v.bvid}.mp4`);
    try {
      // 1) 取 cid（videos.json 未存则从 pagelist 现取）
      if (!v.cid) {
        const pl = await getJson(
          `https://api.bilibili.com/x/player/pagelist?bvid=${v.bvid}`,
          { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
          { label: `pagelist ${v.bvid}` },
        );
        if (pl.code !== 0 || !pl.data?.length) throw new Error(`pagelist code=${pl.code}`);
        v.cid = pl.data[0].cid;
      }
      // 2) 取直链（匿名 html5 360p，音视频混流 mp4）
      const info = await getJson(
        `https://api.bilibili.com/x/player/playurl?bvid=${v.bvid}&cid=${v.cid}&qn=16&platform=html5&high_quality=1`,
        { 'User-Agent': UA, Referer: `https://www.bilibili.com/video/${v.bvid}/` },
        { label: `playurl ${v.bvid}` },
      );
      if (info.code !== 0 || !info.data?.durl?.[0]?.url) {
        throw new Error(`playurl code=${info.code} ${info.message ?? ''}`);
      }
      const url = info.data.durl[0].url;
      // 3) 下载
      const size = await download(url, { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' }, outPath, {
        label: v.bvid,
      });
      sizes[v.bvid] = size;
      console.log(`  [${i + 1}/${videos.length}] ✓ ${v.bvid} ${(size / 1048576).toFixed(1)}MB | ${v.title.slice(0, 26)}`);
    } catch (e) {
      console.error(`  [${i + 1}/${videos.length}] ✗ ${v.bvid}: ${e.message}`);
      sizes[v.bvid] = -1;
    }
    if (i < videos.length - 1) await sleep(randInt(3000, 5000));
  }

  const ok = Object.values(sizes).filter((s) => s > 0).length;
  console.log(`\n完成: ${ok}/${videos.length} 个音频下载成功 → ${dir}`);
  if (ok < videos.length) process.exit(2);
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
