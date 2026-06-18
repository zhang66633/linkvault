import { useState, useMemo, useCallback, useEffect } from 'react';
import { RefreshCw, LayoutGrid, List } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import BookmarkCard from '@/components/BookmarkCard';
import BookmarkListItem from '@/components/BookmarkListItem';
import FAB from '@/components/FAB';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useBookmarks, useCategories } from '@/hooks/useBookmarks';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { restoreScroll } from '@/lib/scroll';

export default function HomePage() {
  const { bookmarks, loading } = useBookmarks();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('home-search') || '';
  });
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    return sessionStorage.getItem('home-category') || null;
  });

  // 筛选状态持久化到 sessionStorage
  useEffect(() => {
    sessionStorage.setItem('home-search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (activeCategoryId) {
      sessionStorage.setItem('home-category', activeCategoryId);
    } else {
      sessionStorage.removeItem('home-category');
    }
  }, [activeCategoryId]);

  // 视图模式（localStorage 持久化）
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('lv-view') as 'card' | 'list') || 'card';
  });

  // 恢复滚动位置
  useEffect(() => {
    restoreScroll('/');
  }, []);

  const toggleView = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'card' ? 'list' : 'card';
      localStorage.setItem('lv-view', next);
      return next;
    });
  }, []);

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
        {/* 搜索栏 + 视图切换 */}
        <div className="flex items-center gap-2 px-4 lg:px-8 xl:px-12 pb-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            type="button"
            onClick={toggleView}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-border
              hover:border-coral/40 transition-colors cursor-pointer flex-shrink-0"
            aria-label={viewMode === 'card' ? '切换到列表视图' : '切换到卡片视图'}
          >
            {viewMode === 'card' ? (
              <List size={20} className="text-text-secondary" />
            ) : (
              <LayoutGrid size={20} className="text-text-secondary" />
            )}
          </button>
        </div>

        {/* 分类筛选 */}
        <CategoryFilter
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
        />

        {/* 内容区 */}
        <div className="px-4 lg:px-8 xl:px-12 pt-3 pb-24">
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
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((bm) => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  category={categoryMap.get(bm.categoryId)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((bm) => (
                <BookmarkListItem
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
