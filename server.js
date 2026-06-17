import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------
// POST /api/fetch-meta — 抓取网页 OG 元数据
// -----------------------------------------------
app.post('/api/fetch-meta', async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return res.status(400).json({ error: '请输入有效的 URL' });
  }

  try {
    const { data: html } = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkVault/1.0; +https://linkvault.app)',
      },
    });

    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';

    let coverImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // 相对路径 → 绝对 URL
    if (coverImage && !/^https?:\/\//i.test(coverImage)) {
      try {
        const base = new URL(url);
        coverImage = new URL(coverImage, base.origin).href;
      } catch {
        coverImage = '';
      }
    }

    res.json({
      title: title.trim(),
      description: description.trim(),
      coverImage,
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: '请求超时，请检查链接是否可访问' });
    }
    res.status(502).json({ error: '抓取失败，请检查链接是否正确' });
  }
});

// -----------------------------------------------
// POST /api/summarize — DeepSeek AI 生成中文摘要
// -----------------------------------------------
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

app.post('/api/summarize', async (req, res) => {
  const { title, description } = req.body;

  if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your-deepseek-api-key-here') {
    return res.status(401).json({ error: '请先配置 DeepSeek API Key' });
  }

  try {
    const completion = await openai.chat.completions.create({
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
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ summary });
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      return res.status(401).json({ error: 'API Key 无效' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'API 请求频率过高，请稍后重试' });
    }
    console.error('DeepSeek API error:', err);
    res.status(500).json({ error: 'AI 摘要生成失败，请重试' });
  }
});

// -----------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LinkVault server running on http://localhost:${PORT}`);
});
