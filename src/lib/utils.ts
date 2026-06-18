export const CATEGORY_COLORS = [
  { name: '珊瑚橙', hex: '#E17055' },
  { name: '红', hex: '#E74C3C' },
  { name: '橙', hex: '#F39C12' },
  { name: '绿', hex: '#2ECC71' },
  { name: '青', hex: '#1ABC9C' },
  { name: '蓝', hex: '#3498DB' },
  { name: '紫', hex: '#9B59B6' },
  { name: '粉', hex: '#E91E63' },
  { name: '灰', hex: '#95A5A6' },
] as const;

export function validateUrl(url: string): boolean {
  return /^https?:\/\/.+\..+/.test(url.trim());
}

// —— 客户端元数据提取（浏览器端 fetch，绕过云 IP 封锁） ——

/** 直接从 HTML 字符串中提取 OG/Twitter 元数据（与 CF Function 相同逻辑） */
function extractMetaFromHtml(html: string, baseUrl: string) {
  // 两步正则提取：先定位 <meta> 标签，再提取 content
  const getMeta = (prop: string): string => {
    const ogTagRe = new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*>`, 'i');
    const twTagRe = new RegExp(`<meta[^>]*name=["']twitter:${prop}["'][^>]*>`, 'i');
    const extractContent = (tag: string) => {
      const m = tag.match(/content=["']([^"']*)["']/i);
      return m ? m[1] : '';
    };
    const ogMatch = html.match(ogTagRe);
    if (ogMatch) return extractContent(ogMatch[0]);
    const twMatch = html.match(twTagRe);
    if (twMatch) return extractContent(twMatch[0]);
    return '';
  };

  const title =
    getMeta('title') ||
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ||
    '';

  const description =
    getMeta('description') ||
    (() => {
      const m = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
      if (!m) return '';
      const cm = m[0].match(/content=["']([^"']*)["']/i);
      return cm ? cm[1] : '';
    })() ||
    '';

  let coverImage = getMeta('image');

  // 相对路径 → 绝对 URL
  if (coverImage && !/^https?:\/\//i.test(coverImage)) {
    try {
      coverImage = new URL(coverImage, baseUrl).href;
    } catch {
      coverImage = '';
    }
  }

  return {
    title: title.trim(),
    description: description.trim(),
    coverImage,
  };
}

interface ClientFetchResult {
  title: string;
  description: string;
  coverImage: string;
  source: 'client' | 'server';
}

/**
 * 浏览器端直接抓取网页元数据。
 * - 成功：绕过服务端 IP 封锁，对国内网站（B站、知乎等）有效
 * - 失败：大部分网站有限制 CORS，会抛错，调用方应 fallback 到服务端 API
 */
export async function fetchMetaFromBrowser(url: string): Promise<ClientFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkVault/1.0; +https://linkvault.pages.dev)',
      },
      signal: controller.signal,
    });

    const html = await res.text();

    if (!html || html.length < 100) {
      throw new Error('Empty response');
    }

    const meta = extractMetaFromHtml(html, url);
    return { ...meta, source: 'client' };
  } finally {
    clearTimeout(timeout);
  }
}

// —— 头像占位符颜色（标题哈希取色，同标题始终同色） ——

const AVATAR_PALETTE = [
  '#E17055', '#E74C3C', '#F39C12', '#27AE60', '#1ABC9C',
  '#3498DB', '#9B59B6', '#E91E63', '#FF6F61', '#6C5CE7',
] as const;

export function getAvatarColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function getColorName(hex: string): string {
  const c = CATEGORY_COLORS.find((c) => c.hex === hex);
  return c?.name || '';
}
