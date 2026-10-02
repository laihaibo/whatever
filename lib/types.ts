export type Confidence = "high" | "medium" | "inferred";
export type EvidenceField = "title" | "description" | "transcript";

export interface EvidenceItem {
  bvid: string;
  field: EvidenceField;
  quote: string;
  /** transcript 证据的原文时间区间（秒） */
  t?: [number, number];
}

export interface Insight {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  tags: string[];
  confidence: Confidence;
  note?: string;
  evidence: EvidenceItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface FlowScenario {
  id: string;
  scenario: string;
  judge: string;
  action: string;
  refs: string[];
}

export interface FlowchartData {
  title: string;
  subtitle: string;
  root: string;
  scenarios: FlowScenario[];
  buyerBranch: { label: string; scenarios: FlowScenario[] };
}

export interface InsightsData {
  meta: {
    generatedAt: string;
    basedOn: string;
    method: string;
    confidenceLevels: Record<Confidence, string>;
    excludedVideos: { bvid: string; title: string; reason: string }[];
  };
  categories: Category[];
  insights: Insight[];
  flowchart: FlowchartData;
}

export interface VideoStat {
  view: number | null;
  danmaku: number | null;
  reply: number | null;
  favorite: number | null;
  coin: number | null;
  share: number | null;
  like: number | null;
}

export interface VideoItem {
  bvid: string;
  aid: number;
  title: string;
  description: string;
  duration: number;
  pubdate: number;
  pubdateISO: string | null;
  stat: VideoStat;
  pic: string | null;
  url: string;
}

export interface VideosData {
  meta: {
    source: string;
    mid: string;
    uname: string;
    total: number;
    fetchedAt: string;
    note: string;
  };
  videos: VideoItem[];
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptItem {
  bvid: string;
  title: string;
  source?: string;
  duration?: number;
  lineCount?: number;
  text: string;
  segments: TranscriptSegment[];
  error?: string;
}

export interface TranscriptsData {
  meta: {
    fetchedAt: string;
    source: string;
    note: string;
    total: number;
    withText: number;
    totalChars: number;
  };
  transcripts: TranscriptItem[];
}

// ---------- 对话体标注实录 ----------
export type DialogueRole = "narration" | "owner" | "customer" | "ad" | "other";

export interface AnnotatedBlock {
  /** narration=旁白·拆解 owner=摊主 customer=顾客 ad=广告 other=其他 */
  role: DialogueRole;
  start: number;
  end: number;
  text: string;
  /** 旁白金句（「记住……」收尾） */
  highlight?: boolean;
}

export interface AnnotatedTranscript {
  bvid: string;
  title: string;
  blocks: AnnotatedBlock[];
}

export interface AnnotatedData {
  meta: {
    generatedAt: string;
    basedOn: string;
    roles: Record<DialogueRole, string>;
    editingRules: string;
    honestyNote: string;
  };
  transcripts: AnnotatedTranscript[];
}
