/**
 * Cloudflare Pages Function — 抓取网页 OG 元数据
 * POST /api/fetch-meta
 * Body: { url: string }
 * Response: { title, description, coverImage }
 *
 * 全程原生 fetch + 正则解析，零 Node.js 依赖（兼容 Workers runtime）
 */
export async function onRequestPost(context) {
  try {
    const { url } = await context.request.json();

    if (!url || !/^https?:\/\/.+/.test(url)) {
      return new Response(JSON.stringify({ error: '请输入有效的 URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 抓取网页 HTML
    let html;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LinkVault/1.0; +https://linkvault.pages.dev)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      html = await res.text();

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `抓取失败 (HTTP ${res.status})，请检查链接是否可访问` }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 202/204 = 无内容，或空响应体 — 可能是反爬或异步加载页面
      if (!html || html.length < 100) {
        return new Response(
          JSON.stringify({ error: '无法获取页面内容，该网站可能为动态加载或限制了自动访问，请手动填写信息' }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return new Response(JSON.stringify({ error: '请求超时，请检查链接是否可访问' }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: '抓取失败，请检查链接是否正确' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 两步正则提取 OG / Twitter 元数据（属性顺序无关）
    const getMeta = (prop) => {
      // Step 1: 找到整个 <meta> 标签（属性顺序无关）
      const ogTagRe = new RegExp(
        `<meta[^>]*property=["']og:${prop}["'][^>]*>`,
        'i'
      );
      const twTagRe = new RegExp(
        `<meta[^>]*name=["']twitter:${prop}["'][^>]*>`,
        'i'
      );
      // Step 2: 从标签中提取 content（属性顺序无关）
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
        coverImage = new URL(coverImage, url).href;
      } catch {
        coverImage = '';
      }
    }

    // 检测 captcha / 验证页面（短 HTML + 验证关键词）
    const captchaKeywords =
      /captcha|验证|安全检查|人机验证|Just a moment|please wait|Access Denied|are you a robot/i;
    if (captchaKeywords.test(title) && html.length < 5000) {
      return new Response(
        JSON.stringify({ error: '该页面需要人机验证，无法自动抓取，请手动填写信息' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 始终返回提取结果，即使为空 — 客户端会做域名回退
    return new Response(
      JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        coverImage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
