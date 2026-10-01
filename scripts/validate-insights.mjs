#!/usr/bin/env node
/**
 * 校验 data/insights.json 的数据完整性与一致性
 * 用法: node scripts/validate-insights.mjs
 * 校验项:
 *  1. JSON 可解析、必备字段齐全
 *  2. 所有 evidence.bvid / flowchart refs.bvid 都存在于 videos.json
 *  3. insight.categoryId 都存在于 categories
 *  4. confidence 取值合法；inferred 条目必须有标注说明
 *  5. evidence.quote 非空；id 无重复
 *  6. 统计输出：分类 × 数量 / 置信度分布
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const errors = [];
const warnings = [];

async function loadJson(p) {
  try {
    return JSON.parse(await readFile(path.resolve(ROOT, p), 'utf8'));
  } catch (e) {
    errors.push(`${p} 解析失败: ${e.message}`);
    return null;
  }
}

const insights = await loadJson('data/insights.json');
const videos = await loadJson('data/videos.json');
if (!insights || !videos) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const videoBvids = new Set(videos.videos.map((v) => v.bvid));
const categoryIds = new Set(insights.categories.map((c) => c.id));
const validConf = new Set(['high', 'medium', 'inferred']);

// insights 结构
if (!Array.isArray(insights.insights) || insights.insights.length === 0) errors.push('insights 为空');
if (!Array.isArray(insights.categories) || insights.categories.length === 0) errors.push('categories 为空');

const seenIds = new Set();
for (const ins of insights.insights ?? []) {
  const tag = `insight ${ins.id ?? '?'}`;
  if (!ins.id) errors.push(`${tag}: 缺 id`);
  if (seenIds.has(ins.id)) errors.push(`${tag}: id 重复`);
  seenIds.add(ins.id);
  if (!categoryIds.has(ins.categoryId)) errors.push(`${tag}: categoryId "${ins.categoryId}" 不存在于 categories`);
  if (!ins.title) errors.push(`${tag}: 缺 title`);
  if (!ins.summary) errors.push(`${tag}: 缺 summary`);
  if (!validConf.has(ins.confidence)) errors.push(`${tag}: confidence "${ins.confidence}" 非法`);
  if (ins.confidence === 'inferred' && !ins.note && !ins.categoryId.includes('ip')) {
    warnings.push(`${tag}: inferred 条目建议补充 note 说明`);
  }
  if (!Array.isArray(ins.evidence) || ins.evidence.length === 0) {
    errors.push(`${tag}: evidence 为空`);
  } else {
    for (const ev of ins.evidence) {
      if (!ev.bvid || !videoBvids.has(ev.bvid)) {
        errors.push(`${tag}: evidence bvid "${ev.bvid}" 不存在于 videos.json`);
      }
      if (!ev.quote || String(ev.quote).trim().length === 0) {
        errors.push(`${tag}: evidence quote 为空 (${ev.bvid})`);
      }
      if (!['title', 'description', 'transcript'].includes(ev.field)) {
        errors.push(`${tag}: evidence field "${ev.field}" 非法 (${ev.bvid})`);
      }
      if (ev.field === 'transcript' && (!Array.isArray(ev.t) || ev.t.length !== 2)) {
        warnings.push(`${tag}: transcript 证据建议带时间区间 t:[start,end] (${ev.bvid})`);
      }
    }
  }
}

// flowchart 校验
const fc = insights.flowchart;
if (!fc || !Array.isArray(fc.scenarios)) {
  errors.push('flowchart.scenarios 缺失');
} else {
  const allScenarios = [...fc.scenarios, ...(fc.buyerBranch?.scenarios ?? [])];
  for (const s of allScenarios) {
    if (!s.scenario || !s.judge || !s.action) errors.push(`flowchart ${s.id}: scenario/judge/action 必填`);
    for (const bvid of s.refs ?? []) {
      if (!videoBvids.has(bvid)) errors.push(`flowchart ${s.id}: ref bvid "${bvid}" 不存在于 videos.json`);
    }
  }
  console.log(`flowchart: ${fc.scenarios.length} 个卖方场景 + ${fc.buyerBranch?.scenarios.length ?? 0} 个买方场景`);
}

// 覆盖统计
const coveredBvids = new Set();
for (const ins of insights.insights ?? []) {
  for (const ev of ins.evidence ?? []) if (videoBvids.has(ev.bvid)) coveredBvids.add(ev.bvid);
}
const excluded = new Set((insights.meta?.excludedVideos ?? []).map((e) => e.bvid));
const uncovered = videos.videos.filter((v) => !coveredBvids.has(v.bvid) && !excluded.has(v.bvid));
if (uncovered.length > 0) {
  warnings.push(`以下视频未被任何心得引用: ${uncovered.map((v) => v.bvid).join(', ')}`);
}

// 统计输出
console.log('\n=== 校验统计 ===');
console.log(`心得总数: ${insights.insights.length}`);
const byCat = {};
for (const ins of insights.insights) byCat[ins.categoryId] = (byCat[ins.categoryId] ?? 0) + 1;
for (const c of insights.categories) {
  console.log(`  ${c.icon} ${c.name}(${c.id}): ${byCat[c.id] ?? 0} 条`);
}
const byConf = {};
for (const ins of insights.insights) byConf[ins.confidence] = (byConf[ins.confidence] ?? 0) + 1;
console.log(`置信度: high=${byConf.high ?? 0}, medium=${byConf.medium ?? 0}, inferred=${byConf.inferred ?? 0}`);
console.log(`证据视频覆盖: ${coveredBvids.size}/${videos.videos.length} (排除 ${excluded.size} 条非心得视频)`);

console.log(`\n错误: ${errors.length}`);
console.log(`警告: ${warnings.length}`);
if (warnings.length) console.log(warnings.map((w) => `  ⚠ ${w}`).join('\n'));
if (errors.length) {
  console.error(errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('\n✓ insights.json 校验通过');
