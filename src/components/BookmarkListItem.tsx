import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';
import CategoryChip from './CategoryChip';
import { saveScroll } from '@/lib/scroll';
import type { IBookmark, ICategory } from '@/types';

interface Props {
  bookmark: IBookmark;
  category?: ICategory;
}

/** 从 URL 提取域名（去 www 前缀） */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** 列表视图的紧凑横排条目 */
export default function BookmarkListItem({ bookmark, category }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    saveScroll(location.pathname);
    navigate(`/bookmark/${bookmark.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0
        active:bg-black/[0.02] hover:bg-black/[0.02] transition-colors cursor-pointer w-full text-left"
    >
      {/* 左侧：小缩略图或首字头像 */}
      {bookmark.coverImage && !imgError ? (
        <img
          src={bookmark.coverImage}
          alt=""
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <AvatarPlaceholder
          title={bookmark.title}
          text={bookmark.avatarText}
          className="w-10 h-10 rounded-lg flex-shrink-0"
          charClassName="text-base"
        />
      )}

      {/* 中间：标题 + 域名 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-text-primary line-clamp-1">
          {bookmark.title || '无标题'}
        </h3>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {extractDomain(bookmark.url)}
        </p>
      </div>

      {/* 右侧：分类 + 箭头 */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {category && (
          <CategoryChip name={category.name} color={category.color} small />
        )}
        <ChevronRight size={16} className="text-text-secondary/30" />
      </div>
    </button>
  );
}
