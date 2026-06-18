import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarPlaceholder from './AvatarPlaceholder';
import CategoryChip from './CategoryChip';
import type { IBookmark, ICategory } from '@/types';

interface Props {
  bookmark: IBookmark;
  category?: ICategory;
}

export default function BookmarkCard({ bookmark, category }: Props) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => navigate(`/bookmark/${bookmark.id}`)}
      className="block w-full text-left
        active:scale-[0.98] transition-transform duration-200 cursor-pointer"
    >
      <div className="bg-white rounded-2xl overflow-hidden
        shadow-[6px_6px_14px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)]
        hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]
        hover:-translate-y-0.5
        transition-all duration-200"
      >
      {/* 封面图 */}
      {bookmark.coverImage && !imgError ? (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={bookmark.coverImage}
            alt={bookmark.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <AvatarPlaceholder
          title={bookmark.title}
          text={bookmark.avatarText}
          className="aspect-[4/3]"
          charClassName="text-3xl"
        />
      )}

      {/* 信息区 */}
      <div className="p-3">
        {/* 标题 */}
        <h3 className="text-[14px] font-semibold text-text-primary line-clamp-1 mb-1.5">
          {bookmark.title || '无标题'}
        </h3>

        {/* 分类标签 */}
        {category && (
          <div className="mb-1.5">
            <CategoryChip name={category.name} color={category.color} small />
          </div>
        )}

        {/* AI 摘要预览 */}
        {bookmark.summary && (
          <p className="text-[12px] text-text-secondary line-clamp-2 leading-relaxed">
            {bookmark.summary}
          </p>
        )}
      </div>
      </div>
    </button>
  );
}
