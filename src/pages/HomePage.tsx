import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import BookmarkCard from '@/components/BookmarkCard';
import FAB from '@/components/FAB';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useBookmarks, useCategories } from '@/hooks/useBookmarks';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function HomePage() {
  const { bookmarks, loading } = useBookmarks();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c]));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = bookmarks;

    if (activeCategoryId) {
      list = list.filter((b) => b.categoryId === activeCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [bookmarks, activeCategoryId, searchQuery]);

  const refresh = useCallback(async () => {
    // IndexedDB 即时更新，这里模拟网络刷新延迟给用户视觉反馈
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  const { containerRef, indicatorStyle, iconStyle, refreshing } =
    usePullToRefresh(refresh);

  return (
    <>
      {/* 下拉刷新指示器 */}
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden transition-[margin]"
        style={indicatorStyle}
      >
        <RefreshCw
          size={22}
          className={`text-coral ${refreshing ? 'animate-spin' : ''}`}
          style={iconStyle}
        />
      </div>

      <div className="pt-2">
        {/* 搜索栏 */}
        <div className="px-4 pb-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* 分类筛选 */}
        <CategoryFilter
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
        />

        {/* 内容区 */}
        <div className="px-4 pt-3 pb-24">
          {loading ? (
            <LoadingSpinner text="加载收藏..." />
          ) : filtered.length === 0 ? (
            bookmarks.length === 0 ? (
              <EmptyState
                title="还没有收藏"
                description="把你喜欢的网页收藏起来，随时回顾"
                actionLabel="添加第一个收藏"
                actionTo="/add"
              />
            ) : (
              <EmptyState
                icon="search"
                title="没有找到匹配的收藏"
                description="试试其他关键词或分类"
              />
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((bm) => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  category={categoryMap.get(bm.categoryId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FAB />
    </>
  );
}
