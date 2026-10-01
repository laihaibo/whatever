import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 秒 → "MM:SS" */
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** B 站视频跳转链接（可带起播秒数） */
export function bilibiliUrl(bvid: string, t?: number): string {
  return t != null
    ? `https://www.bilibili.com/video/${bvid}?t=${Math.floor(t)}`
    : `https://www.bilibili.com/video/${bvid}`;
}
