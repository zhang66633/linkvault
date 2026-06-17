import { useState, useEffect, useCallback } from 'react';
import { db, initDefaultCategories } from '@/lib/db';
import type { IBookmark, ICategory } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<ICategory[]>([]);

  const refresh = useCallback(async () => {
    await initDefaultCategories();
    const list = await db.categories.orderBy('createdAt').toArray();
    setCategories(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { categories, refreshCategories: refresh };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await db.bookmarks.orderBy('createdAt').reverse().toArray();
    setBookmarks(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { bookmarks, loading, refreshBookmarks: refresh };
}

export function useBookmark(id: string | undefined) {
  const [bookmark, setBookmark] = useState<IBookmark | null>(null);

  useEffect(() => {
    if (!id) return;
    db.bookmarks.get(id).then((bm) => setBookmark(bm ?? null));
  }, [id]);

  return bookmark;
}

export function useBookmarkActions() {
  const add = useCallback(async (bm: IBookmark) => {
    await db.bookmarks.add(bm);
  }, []);

  const update = useCallback(async (id: string, changes: Partial<IBookmark>) => {
    await db.bookmarks.update(id, { ...changes, updatedAt: Date.now() });
  }, []);

  const remove = useCallback(async (id: string) => {
    await db.bookmarks.delete(id);
  }, []);

  const checkDuplicate = useCallback(async (url: string): Promise<boolean> => {
    const count = await db.bookmarks.where('url').equals(url).count();
    return count > 0;
  }, []);

  return { add, update, remove, checkDuplicate };
}
