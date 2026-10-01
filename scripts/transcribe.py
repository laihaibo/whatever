#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本地 whisper 转写 23 个视频音频 → data/transcripts.json
用法: HF_ENDPOINT=https://hf-mirror.com python scripts/transcribe.py
说明: 模型 small(int8, CPU)，vad 过滤静音；逐视频落盘，中断可续（跳过已有文案的 bvid）
"""
import json
import os
import sys
import time
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
os.environ.setdefault("OMP_NUM_THREADS", "8")

import av

# PyAV 19 移除了 metadata_errors 参数，但 faster-whisper 1.2.1 仍会传入，做兼容
_orig_av_open = av.open
def _av_open_compat(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)
av.open = _av_open_compat

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "data" / "audio"
OUT_PATH = ROOT / "data" / "transcripts.json"
VIDEOS_PATH = ROOT / "data" / "videos.json"
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")

INITIAL_PROMPT = "以下是关于摆摊卖菜、集市销售、成交技巧、做生意赚钱的普通话对话。"

def main():
    videos = json.loads(VIDEOS_PATH.read_text(encoding="utf-8"))["videos"]
    # 断点续跑：读取已有结果
    existing = {"meta": {}, "transcripts": []}
    if OUT_PATH.exists():
        try:
            existing = json.loads(OUT_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    done = {t["bvid"]: t for t in existing.get("transcripts", []) if t.get("text")}

    print(f"模型: {MODEL_SIZE} | 已完成 {len(done)}/{len(videos)}，继续转写…", flush=True)
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    results = {t["bvid"]: t for t in existing.get("transcripts", [])}
    total_chars = sum(len(t.get("text", "")) for t in done.values())

    for i, v in enumerate(videos):
        bvid = v["bvid"]
        if bvid in done:
            print(f"[{i+1}/{len(videos)}] 跳过(已有) {bvid}", flush=True)
            continue
        audio = AUDIO_DIR / f"{bvid}.mp4"
        if not audio.exists():
            print(f"[{i+1}/{len(videos)}] ✗ 缺音频 {bvid}", flush=True)
            results[bvid] = {"bvid": bvid, "title": v["title"], "text": "", "error": "no audio"}
            continue

        t0 = time.time()
        try:
            segments_iter, info = model.transcribe(
                str(audio),
                language="zh",
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
                initial_prompt=INITIAL_PROMPT,
                beam_size=5,
            )
            segs = []
            texts = []
            for seg in segments_iter:
                segs.append({"start": round(seg.start, 1), "end": round(seg.end, 1), "text": seg.text.strip()})
                texts.append(seg.text.strip())
            text = "".join(texts)
            results[bvid] = {
                "bvid": bvid,
                "title": v["title"],
                "source": f"whisper-{MODEL_SIZE}",
                "duration": round(info.duration, 1),
                "language": info.language,
                "languageProbability": round(info.language_probability or 0, 2),
                "lineCount": len(segs),
                "text": text,
                "segments": segs,
            }
            total_chars += len(text)
            print(
                f"[{i+1}/{len(videos)}] ✓ {bvid} {len(text)}字/{len(segs)}段 用时{time.time()-t0:.0f}s | {v['title'][:22]}",
                flush=True,
            )
        except Exception as e:  # noqa: BLE001
            print(f"[{i+1}/{len(videos)}] ✗ {bvid}: {e}", flush=True)
            results[bvid] = {"bvid": bvid, "title": v["title"], "text": "", "error": str(e)}

        # 每条转写完立即落盘（按发布时间倒序，与 videos.json 一致）
        ordered = [results[v["bvid"]] for v in videos if v["bvid"] in results]
        payload = {
            "meta": {
                "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "source": f"local faster-whisper {MODEL_SIZE} (int8, CPU)，音频为匿名 html5 360p 流",
                "note": "AI字幕被UP主关闭、AI总结接口-403，故采用本地ASR；同音字误差存在，提炼心得以语义为准",
                "total": len(ordered),
                "withText": sum(1 for t in ordered if t.get("text")),
                "totalChars": total_chars,
            },
            "transcripts": ordered,
        }
        OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ok = sum(1 for t in results.values() if t.get("text"))
    print(f"\n全部完成: {ok}/{len(videos)} 条有文案, 共 {total_chars} 字 → {OUT_PATH}", flush=True)

if __name__ == "__main__":
    sys.exit(main())
