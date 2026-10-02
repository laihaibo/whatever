#!/usr/bin/env node
/**
 * 校验 data/transcripts-annotated.json（对话体标注实录）
 * 1. 23 条视频全覆盖，bvid 与 transcripts.json 一致
 * 2. 角色枚举合法；语块时间轴有序且落在原转写时长内
 * 3. highlight 仅用于 narration
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const VALID_ROLES = new Set(['narration', 'owner', 'customer', 'ad', 'other']);

const annotated = JSON.parse(await readFile(path.join(ROOT, 'data/transcripts-annotated.json'), 'utf8'));
const raw = JSON.parse(await readFile(path.join(ROOT, 'data/transcripts.json'), 'utf8'));

const rawMap = new Map(raw.transcripts.map((t) => [t.bvid, t]));
const errors = [];

if (annotated.transcripts.length !== raw.transcripts.length) {
  errors.push(`条数不一致: annotated=${annotated.transcripts.length}, raw=${raw.transcripts.length}`);
}

let blockTotal = 0;
const roleCount = {};
for (const t of annotated.transcripts) {
  const rawT = rawMap.get(t.bvid);
  if (!rawT) {
    errors.push(`${t.bvid}: 不存在于 transcripts.json`);
    continue;
  }
  const duration = rawT.duration ?? Infinity;
  let lastStart = -1;
  t.blocks.forEach((b, i) => {
    blockTotal += 1;
    roleCount[b.role] = (roleCount[b.role] ?? 0) + 1;
    const tag = `${t.bvid} block#${i}`;
    if (!VALID_ROLES.has(b.role)) errors.push(`${tag}: 非法角色 "${b.role}"`);
    if (typeof b.start !== 'number' || typeof b.end !== 'number' || b.end <= b.start) {
      errors.push(`${tag}: 时间轴异常 (${b.start}-${b.end})`);
    }
    // 起始时间非递减即可；允许旁白与同期现场音时间重叠（设计如此）
    if (b.start < lastStart) errors.push(`${tag}: 时间轴乱序 (start=${b.start} < 上块 start=${lastStart})`);
    lastStart = b.start;
    if (b.end > duration + 5) errors.push(`${tag}: 超出视频时长 (${b.end} > ${duration})`);
    if (!b.text || b.text.trim().length === 0) errors.push(`${tag}: 文本为空`);
    if (b.highlight && b.role !== 'narration') errors.push(`${tag}: highlight 仅允许用于 narration`);
  });
}

console.log(`视频: ${annotated.transcripts.length}/${raw.transcripts.length} | 语块: ${blockTotal}`);
console.log('角色分布:', JSON.stringify(roleCount));
const highlightCount = annotated.transcripts.reduce(
  (n, t) => n + t.blocks.filter((b) => b.highlight).length, 0,
);
console.log(`重点金句: ${highlightCount}`);
console.log(`错误: ${errors.length}`);
if (errors.length) {
  console.error(errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('\n✓ transcripts-annotated.json 校验通过');
