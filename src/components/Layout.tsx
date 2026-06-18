import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';

const TITLE_MAP: Record<string, string> = {
  '/': 'LinkVault',
  '/add': '添加收藏',
  '/categories': '分类管理',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const isDetail = location.pathname.startsWith('/bookmark/');
  const title = isDetail ? '收藏详情' : (TITLE_MAP[location.pathname] || 'LinkVault');

  return (
    <div className="min-h-screen bg-warm-bg max-w-lg lg:max-w-6xl xl:max-w-7xl mx-auto">
      {/* 顶栏 */}
      <header className="sticky top-0 z-30 bg-warm-bg/80 backdrop-blur-md px-4 lg:px-8 xl:px-12 py-3
        flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="返回"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
          )}
          <h1 className="text-[17px] font-semibold text-text-primary">{title}</h1>
        </div>
        {isHome && (
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="分类管理"
          >
            <FolderOpen size={20} className="text-text-secondary" />
          </button>
        )}
      </header>

      {/* 内容区 */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
