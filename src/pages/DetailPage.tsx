import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Sparkles,
  Trash2,
  Calendar,
  Tag,
  Upload,
  Link2,
  X,
} from 'lucide-react';
import { useBookmark, useBookmarkActions } from '@/hooks/useBookmarks';
import { useCategories } from '@/hooks/useBookmarks';
import { summarize } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import AvatarPlaceholder from '@/components/AvatarPlaceholder';
import CategoryChip from '@/components/CategoryChip';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bookmark = useBookmark(id);
  const { categories } = useCategories();
  const { update, remove } = useBookmarkActions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState(bookmark?.coverImage ?? '');
  const [imgError, setImgError] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInput, setShowImageInput] = useState<'url' | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // —— 标签编辑 ——
  const [localTags, setLocalTags] = useState<string[]>(bookmark?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (bookmark) {
      setCoverImage(bookmark.coverImage);
      setImgError(false);
      setLocalTags(bookmark.tags);
    }
  }, [bookmark]);

  if (!bookmark) {
    return <LoadingSpinner text="加载中..." />;
  }

  const category = categories.find((c) => c.id === bookmark.categoryId);

  const handleOpenLink = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleReSummarize = async () => {
    setSummaryError('');
    setSummarizing(true);
    try {
      const { summary } = await summarize(bookmark.title, bookmark.description);
      await update(bookmark.id, { summary });
    } catch (err: any) {
      setSummaryError(err?.response?.data?.error || '生成失败');
    } finally {
      setSummarizing(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await update(bookmark.id, { coverImage: dataUrl });
      setCoverImage(dataUrl);
      setImgError(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageUrlSet = async () => {
    const u = imageUrlInput.trim();
    if (!u) return;
    await update(bookmark.id, { coverImage: u });
    setCoverImage(u);
    setImgError(false);
    setImageUrlInput('');
    setShowImageInput(null);
  };

  const handleDelete = async () => {
    await remove(bookmark.id);
    navigate('/', { replace: true });
  };

  const handleAddTag = async () => {
    const t = tagInput.trim();
    if (!t || localTags.includes(t)) {
      setTagInput('');
      return;
    }
    const newTags = [...localTags, t];
    setLocalTags(newTags);
    setTagInput('');
    await update(bookmark.id, { tags: newTags });
  };

  const handleRemoveTag = async (tag: string) => {
    const newTags = localTags.filter((x) => x !== tag);
    setLocalTags(newTags);
    await update(bookmark.id, { tags: newTags });
  };

  return (
    <div className="pb-24">
      {/* 封面大图 */}
      <div className="relative group">
        {coverImage && !imgError ? (
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={coverImage}
              alt={bookmark.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[16/10] cursor-pointer relative group overflow-hidden"
          >
            <AvatarPlaceholder
              title={bookmark.title}
              className="w-full h-full"
              charClassName="text-5xl"
            />
            {/* 悬停提示层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-[13px] font-medium bg-black/40 px-3 py-1.5 rounded-lg transition-opacity">
                点击上传封面图
              </span>
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

      {/* 图片编辑工具栏 */}
      <div className="flex gap-2 px-4 lg:px-8 xl:px-12 mt-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-8 rounded-lg bg-white border border-border
            text-[12px] text-text-secondary flex items-center justify-center gap-1.5
            hover:text-coral hover:border-coral/40 transition-colors cursor-pointer"
        >
          <Upload size={13} />
          更换图片
        </button>
        <button
          type="button"
          onClick={() => setShowImageInput(showImageInput === 'url' ? null : 'url')}
          className="flex-1 h-8 rounded-lg bg-white border border-border
            text-[12px] text-text-secondary flex items-center justify-center gap-1.5
            hover:text-coral hover:border-coral/40 transition-colors cursor-pointer"
        >
          <Link2 size={13} />
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
        <div className="flex gap-2 px-4 lg:px-8 xl:px-12 mt-2">
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

      {/* 信息区 */}
      <div className="px-4 lg:px-8 xl:px-12 py-4">
        {/* 标题 */}
        <h1 className="text-[20px] font-semibold text-text-primary mb-3 leading-snug">
          {bookmark.title || '无标题'}
        </h1>

        {/* 元信息 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {category && (
            <CategoryChip name={category.name} color={category.color} />
          )}
          <span className="inline-flex items-center gap-1 text-[12px] text-text-secondary">
            <Calendar size={13} />
            {formatDate(bookmark.createdAt)}
          </span>
        </div>

        {/* 描述 */}
        {bookmark.description && (
          <p className="text-[14px] text-text-secondary leading-relaxed mb-4">
            {bookmark.description}
          </p>
        )}

        {/* AI 摘要 */}
        <div
          className="p-4 rounded-2xl mb-4
            shadow-[inset_2px_2px_8px_rgba(0,0,0,0.04),inset_-2px_-2px_8px_rgba(255,255,255,0.8)]
            bg-warm-bg/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary flex items-center gap-1">
              <Sparkles size={13} className="text-coral" />
              AI 摘要
            </span>
            <button
              type="button"
              onClick={handleReSummarize}
              disabled={summarizing}
              className="text-[12px] text-coral hover:text-coral/80
                transition-colors cursor-pointer disabled:opacity-50"
            >
              {summarizing ? '生成中...' : '重新生成'}
            </button>
          </div>
          {summaryError && (
            <p className="text-[12px] text-red-500 mb-2">{summaryError}</p>
          )}
          <p className="text-[14px] text-text-primary leading-relaxed">
            {bookmark.summary || '暂无摘要，点击上方按钮生成'}
          </p>
        </div>

        {/* 标签（可编辑） */}
        <div className="mb-4">
          <span className="text-[12px] font-medium text-text-secondary flex items-center gap-1 mb-2">
            <Tag size={13} />
            标签
          </span>
          <div className="flex flex-wrap gap-1.5">
            {localTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1
                  rounded-full bg-coral-light text-coral text-[12px]"
              >
                {t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="cursor-pointer hover:text-red-500 transition-colors"
                  aria-label={`删除标签 ${t}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {/* 内联标签输入框 */}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="+ 添加标签"
              className="w-24 h-7 px-2.5 rounded-full bg-white border border-dashed border-coral/30
                text-[12px] text-text-primary placeholder:text-text-secondary/60
                focus:outline-none focus:border-coral/50 focus:w-32
                transition-all duration-200"
            />
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleOpenLink}
            className="flex-1 h-11 rounded-xl bg-coral text-white text-[14px] font-medium
              flex items-center justify-center gap-2
              shadow-[0_2px_8px_rgba(225,112,85,0.3)]
              active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <ExternalLink size={17} />
            打开原链接
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="h-11 px-4 rounded-xl bg-white border border-red-200 text-red-500
              text-[14px] font-medium flex items-center justify-center gap-2
              hover:bg-red-50 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Trash2 size={17} />
            删除
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="确定删除？"
        message="删除后无法恢复，确定要删除这个收藏吗？"
        confirmLabel="删除"
        cancelLabel="取消"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
