import axios from 'axios';

interface FetchMetaResult {
  title: string;
  description: string;
  coverImage: string;
}

interface SummarizeResult {
  summary: string;
}

// ── 国内腾讯云开发函数（国内 IP，无云封锁） ──
const CLOUDBASE_FN_URL =
  'https://rss-d0g4abivmd539ea4f-1411162555.ap-shanghai.app.tcloudbase.com/fetch-meta';

/** 国内云函数抓取（主路径，国内 IP 不触发反爬） */
export async function fetchMetaDomestic(url: string): Promise<FetchMetaResult> {
  const { data } = await axios.post<FetchMetaResult>(CLOUDBASE_FN_URL, { url });
  return data;
}

/** Cloudflare Function 抓取（国际 fallback） */
export async function fetchMeta(url: string): Promise<FetchMetaResult> {
  const { data } = await axios.post<FetchMetaResult>('/api/fetch-meta', { url });
  return data;
}

export async function summarize(
  title: string,
  description: string
): Promise<SummarizeResult> {
  const { data } = await axios.post<SummarizeResult>('/api/summarize', {
    title,
    description,
  });
  return data;
}
