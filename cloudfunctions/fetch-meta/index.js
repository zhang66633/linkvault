/**
 * CloudBase 云函数 — 抓取网页 OG 元数据（国内 IP，无云封锁）
 * HTTP 触发器  |  POST { url: string }  →  { title, description, coverImage }
 *
 * 部署后通过 HTTP 访问服务调用：
 * https://rss-d0g4abivmd539ea4f.service.tcloudbase.com/fetch-meta
 */

// ── CORS 响应头 ──
function ok(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

function fail(code, msg) {
  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: msg }),
  };
}

// ── 两步正则提取 OG / Twitter meta（属性顺序无关） ──
function extractMeta(html, baseUrl) {
  const getMeta = (prop) => {
    const ogTagRe = new RegExp(
      `<meta[^>]*property=["']og:${prop}["'][^>]*>`,
      'i',
    );
    const twTagRe = new RegExp(
      `<meta[^>]*name=["']twitter:${prop}["'][^>]*>`,
      'i',
    );
    const extractContent = (tag) => {
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

// ── 主入口 ──
exports.main = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url || !/^https?:\/\/.+/.test(url)) {
      return fail(400, '请输入有效的 URL');
    }

    // ── 抓取网页 HTML（国内 IP，不受云封锁）──
    let html;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return fail(
          502,
          `抓取失败 (HTTP ${res.status})，请检查链接是否可访问`,
        );
      }

      html = await res.text();

      if (!html || html.length < 100) {
        return fail(
          422,
          '无法获取页面内容，该网站可能为动态加载或限制了自动访问，请手动填写信息',
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return fail(504, '请求超时，请检查链接是否可访问');
      }
      return fail(502, '抓取失败，请检查链接是否正确');
    }

    // ── 提取元数据 ──
    const meta = extractMeta(html, url);

    // captcha 检测
    const captchaKeywords =
      /captcha|验证|安全检查|人机验证|Just a moment|please wait|Access Denied|are you a robot/i;
    if (captchaKeywords.test(meta.title) && html.length < 5000) {
      return fail(
        403,
        '该页面需要人机验证，无法自动抓取，请手动填写信息',
      );
    }

    return ok(meta);
  } catch {
    return fail(400, '请求格式错误');
  }
};
