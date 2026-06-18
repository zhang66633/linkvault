import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, ImageOff, Upload, Link2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { validateUrl, fetchMetaFromBrowser } from '@/lib/utils';
import { fetchMeta, fetchMetaDomestic, summarize } from '@/lib/api';
import { useCategories, useBookmarkActions } from '@/hooks/useBookmarks';
import CategoryChip from '@/components/CategoryChip';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { IBookmark } from '@/types';

export default function AddPage() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { add, checkDuplicate } = useBookmarkActions();
  const savingRef = useRef(false);

  // 步骤: input → preview → done
  const [step, setStep] = useState<'input' | 'preview' | 'saving'>('input');

  // URL 输入
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // 抓取结果
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [imgError, setImgError] = useState(false);
  const [fetchWarning, setFetchWarning] = useState('');

  // 自定义图片
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInput, setShowImageInput] = useState<'file' | 'url' | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
      setImgError(false);
    };
    reader.readAsDataURL(file);
    setShowImageInput(null);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleImageUrlSet = () => {
    const u = imageUrlInput.trim();
    if (!u) return;
    setCoverImage(u);
    setImgError(false);
    setImageUrlInput('');
    setShowImageInput(null);
  };

  // 用户选择
  const [categoryId, setCategoryId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // 头像文字
  const [avatarText, setAvatarText] = useState('');

  const handleFetch = async () => {
    if (!validateUrl(url)) {
      setFetchError('请输入有效的 URL（以 http:// 或 https:// 开头）');
      return;
    }
    setFetchError('');
    setFetchWarning('');
    setFetching(true);

    const targetUrl = url.trim();

    // —— 三路径抓取：国内云函数 → 浏览器直连 → Cloudflare Function ——
    let meta: { title: string; description: string; coverImage: string };

    try {
      // 1) 国内腾讯云函数（国内 IP，无云封锁，无 CORS 限制）
      try {
        meta = await fetchMetaDomestic(targetUrl);
      } catch {
        // 2) 浏览器端直连（绕过云 IP 封锁，但受 CORS 限制）
        try {
          meta = await fetchMetaFromBrowser(targetUrl);
        } catch {
          // 3) Cloudflare Function（国际 IP fallback）
          meta = await fetchMeta(targetUrl);
        }
      }

      let displayTitle = meta.title?.trim() || '';
      let displayDesc = meta.description?.trim() || '';
      const displayCover = meta.coverImage || '';
      let warning = '';

      if (!displayTitle) {
        try { displayTitle = new URL(targetUrl).hostname.replace(/^www\./, ''); }
        catch { displayTitle = targetUrl; }
        warning = '未能自动提取页面信息，已使用域名作为标题，请手动补充';
      } else if (!displayDesc && !displayCover) {
        warning = '仅提取到标题，描述和封面未能获取，可手动补充';
      }

      setTitle(displayTitle);
      setDescription(displayDesc);
      setCoverImage(displayCover);
      setFetchWarning(warning);
      setStep('preview');
    } catch (err: any) {
      // 三条路径都失败 → 尝试域名回退
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.error || '';
      if ((status === 403 || status === 422) && apiMsg) {
        try { setTitle(new URL(targetUrl).hostname.replace(/^www\./, '')); }
        catch { setTitle(targetUrl); }
        setFetchWarning(apiMsg);
        setStep('preview');
      } else {
        const msg = apiMsg || '抓取失败，请检查链接是否可访问';
        setFetchError(msg);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSummarize = async () => {
    setSummaryError('');
    setSummarizing(true);
    try {
      const { summary: s } = await summarize(title, description);
      setSummary(s);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'AI 摘要生成失败';
      setSummaryError(msg);
    } finally {
      setSummarizing(false);
    }
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setStep('saving');

    const isDup = await checkDuplicate(url.trim());
    if (isDup) {
      setFetchError('此链接已收藏');
      setStep('preview');
      savingRef.current = false;
      return;
    }

    const bookmark: IBookmark = {
      id: nanoid(12),
      url: url.trim(),
      title: title || url.trim(),
      description,
      coverImage,
      summary,
      categoryId: categoryId || categories[0]?.id || '',
      avatarText: avatarText.trim() || undefined,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await add(bookmark);
    navigate('/', { replace: true });
  };

  return (
    <div className="px-4 lg:px-8 xl:px-12 py-4 pb-24">
      {/* 步骤 1: URL 输入 */}
      <div className="mb-4">
        <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
          网页链接
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setFetchError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            placeholder="https://example.com"
            disabled={step !== 'input'}
            className="flex-1 h-11 px-4 rounded-xl bg-white border border-border
              text-[15px] text-text-primary placeholder:text-text-secondary/60
              focus:outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/10
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {step === 'input' && (
            <button
              type="button"
              onClick={handleFetch}
              disabled={fetching || !url.trim()}
              className="h-11 px-5 rounded-xl bg-coral text-white text-[14px] font-medium
                shadow-[0_2px_8px_rgba(225,112,85,0.3)]
                active:scale-95 transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {fetching ? '抓取中...' : '抓取'}
            </button>
          )}
        </div>
        {fetchError && (
          <p className="text-[12px] text-red-500 mt-1.5">{fetchError}</p>
        )}
      </div>

      {/* 步骤 2: 预览 + 编辑 */}
      {step === 'preview' && (
        <>
          {/* 抓取中或预览 */}
          {fetching ? (
            <LoadingSpinner text="正在抓取网页信息..." />
          ) : (
            <>
              {/* 抓取结果提示 */}
              {fetchWarning && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200
                  text-[12px] text-amber-700 leading-relaxed">
                  {fetchWarning}
                </div>
              )}

              {/* 封面预览 */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                  封面图片
                </label>
                <div className="relative group">
                  {coverImage && !imgError ? (
                    <div className="rounded-2xl overflow-hidden aspect-[16/9] lg:max-h-64
                      shadow-[6px_6px_14px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl aspect-[16/9] lg:max-h-64 flex items-center justify-center
                        bg-gradient-to-br from-coral/10 to-coral/5 cursor-pointer
                        shadow-[6px_6px_14px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)]
                        hover:from-coral/15 hover:to-coral/10 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <ImageOff size={40} className="text-coral/25" />
                        <span className="text-[12px] text-coral/60">点击上传封面图</span>
                      </div>
                    </button>
                  )}

                  {/* 有图片时的悬浮操作栏 */}
                  {coverImage && !imgError && (
                    <div className="absolute bottom-2 right-2 flex gap-1.5
                      opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-black/50 text-white text-[11px]
                          flex items-center gap-1 backdrop-blur-sm cursor-pointer
                          hover:bg-black/60 transition-colors"
                      >
                        <Upload size={13} />
                        上传
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageInput(showImageInput === 'url' ? null : 'url')}
                        className="px-2.5 py-1.5 rounded-lg bg-black/50 text-white text-[11px]
                          flex items-center gap-1 backdrop-blur-sm cursor-pointer
                          hover:bg-black/60 transition-colors"
                      >
                        <Link2 size={13} />
                        链接
                      </button>
                    </div>
                  )}
                </div>

                {/* 上传按钮行（始终可见） */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-9 rounded-lg bg-white border border-border
                      text-[12px] text-text-secondary flex items-center justify-center gap-1.5
                      hover:text-coral hover:border-coral/40 transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    上传图片
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImageInput(showImageInput === 'url' ? null : 'url')}
                    className="flex-1 h-9 rounded-lg bg-white border border-border
                      text-[12px] text-text-secondary flex items-center justify-center gap-1.5
                      hover:text-coral hover:border-coral/40 transition-colors cursor-pointer"
                  >
                    <Link2 size={14} />
                    图片链接
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* 图片链接输入 */}
                {showImageInput === 'url' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleImageUrlSet()}
                      placeholder="输入图片链接地址"
                      className="flex-1 h-9 px-3 rounded-lg bg-white border border-border
                        text-[13px] text-text-primary placeholder:text-text-secondary/60
                        focus:outline-none focus:border-coral/50"
                    />
                    <button
                      type="button"
                      onClick={handleImageUrlSet}
                      className="h-9 px-3 rounded-lg bg-coral text-white text-[12px]
                        cursor-pointer active:scale-95 transition-all"
                    >
                      确定
                    </button>
                  </div>
                )}
              </div>

              {/* 头像文字 */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                  头像文字 <span className="text-text-secondary/50 font-normal">（无封面时显示，最多10字，留空取标题首字）</span>
                </label>
                <input
                  type="text"
                  value={avatarText}
                  onChange={(e) => setAvatarText(e.target.value.slice(0, 10))}
                  maxLength={10}
                  placeholder="例如：技、设计、好文"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-border
                    text-[15px] text-text-primary placeholder:text-text-secondary/60
                    focus:outline-none focus:border-coral/50"
                />
              </div>

              {/* 标题 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="网页标题"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-border
                    text-[15px] font-semibold text-text-primary
                    focus:outline-none focus:border-coral/50"
                />
              </div>

              {/* 分类选择 */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                  分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CategoryChip
                      key={cat.id}
                      name={cat.name}
                      color={cat.color}
                      selected={categoryId === cat.id}
                      onClick={() =>
                        setCategoryId(categoryId === cat.id ? '' : cat.id)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* 标签输入 */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                  标签
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="输入标签后按回车添加"
                    className="flex-1 h-11 px-4 rounded-xl bg-white border border-border
                      text-[15px] text-text-primary placeholder:text-text-secondary/60
                      focus:outline-none focus:border-coral/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="h-11 px-4 rounded-xl bg-white border border-border
                      text-[14px] text-text-secondary hover:text-coral
                      transition-colors cursor-pointer"
                  >
                    添加
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1
                          rounded-full bg-coral-light text-coral text-[12px]"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((x) => x !== t))}
                          className="cursor-pointer hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI 摘要 */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
                  AI 摘要
                </label>
                {summary ? (
                  <div className="p-3 rounded-xl bg-white border border-border
                    shadow-[inset_2px_2px_6px_rgba(0,0,0,0.03)]">
                    <p className="text-[13px] text-text-primary leading-relaxed">{summary}</p>
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={summarizing}
                      className="mt-2 text-[12px] text-coral hover:text-coral/80
                        transition-colors cursor-pointer"
                    >
                      重新生成
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="w-full h-11 rounded-xl bg-white border border-dashed
                      border-coral/40 text-coral text-[14px] font-medium
                      flex items-center justify-center gap-2
                      hover:bg-coral-light/50 transition-colors cursor-pointer
                      disabled:opacity-50"
                  >
                    {summarizing ? (
                      <LoadingSpinner size={18} />
                    ) : (
                      <>
                        <Sparkles size={18} />
                        生成 AI 摘要
                      </>
                    )}
                  </button>
                )}
                {summaryError && (
                  <p className="text-[12px] text-red-500 mt-1.5">{summaryError}</p>
                )}
              </div>

              {/* 保存按钮 */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full h-12 rounded-xl bg-coral text-white text-[15px] font-semibold
                  flex items-center justify-center gap-2
                  shadow-[0_2px_8px_rgba(225,112,85,0.3)]
                  active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <Save size={18} />
                保存收藏
              </button>
            </>
          )}
        </>
      )}

      {/* 保存中 */}
      {step === 'saving' && <LoadingSpinner text="正在保存..." />}
    </div>
  );
}
