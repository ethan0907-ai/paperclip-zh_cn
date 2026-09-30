import { i18n } from "@/i18n";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((now - then) / 1000);
  const zh = (i18n.language ?? "en").startsWith("zh");

  if (seconds < MINUTE) return zh ? "刚刚" : "just now";
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return zh ? `${m} 分钟前` : `${m}m ago`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return zh ? `${h} 小时前` : `${h}h ago`;
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return zh ? `${d} 天前` : `${d}d ago`;
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    return zh ? `${w} 周前` : `${w}w ago`;
  }
  const mo = Math.floor(seconds / MONTH);
  return zh ? `${mo} 个月前` : `${mo}mo ago`;
}
