/**
 * Cloudflare Pages Function — DeepSeek AI 生成中文摘要
 * POST /api/summarize
 * Body: { title: string, description: string }
 * Response: { summary: string }
 *
 * 原生 fetch 调用 DeepSeek API（OpenAI 兼容），零依赖
 */
export async function onRequestPost(context) {
  try {
    const { title, description } = await context.request.json();

    const apiKey = context.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '请先配置 DeepSeek API Key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let apiRes;
    try {
      apiRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                '你是一个网页摘要助手。根据提供的标题和描述，用中文生成一段100字以内的简洁摘要，概括网页的核心内容。只返回摘要文本，不要加任何前缀或说明。',
            },
            {
              role: 'user',
              content: `标题：${title}\n描述：${description || '无描述'}`,
            },
          ],
          stream: false,
          max_tokens: 300,
          temperature: 0.3,
        }),
      });
    } catch {
      return new Response(JSON.stringify({ error: 'AI 摘要生成失败，请重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (apiRes.status === 401 || apiRes.status === 403) {
      return new Response(JSON.stringify({ error: 'API Key 无效' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (apiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'API 请求频率过高，请稍后重试' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!apiRes.ok) {
      return new Response(JSON.stringify({ error: 'AI 摘要生成失败，请重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await apiRes.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
