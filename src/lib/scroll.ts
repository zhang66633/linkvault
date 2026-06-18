/** sessionStorage key 映射，保证每个路由有固定 key */
const KEY_MAP: Record<string, string> = {
  '/': 'scroll-home',
  '/add': 'scroll-add',
  '/categories': 'scroll-categories',
};

function getKey(pathname: string): string {
  return KEY_MAP[pathname] || `scroll-${pathname}`;
}

/** 保存当前页面滚动位置 */
export function saveScroll(pathname: string): void {
  sessionStorage.setItem(getKey(pathname), String(window.scrollY));
}

/** 恢复已保存的滚动位置（在下一帧执行，确保 DOM 渲染完毕） */
export function restoreScroll(pathname: string): void {
  const saved = sessionStorage.getItem(getKey(pathname));
  if (saved) {
    requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(saved, 10));
    });
  }
}
