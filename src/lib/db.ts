import Dexie, { type EntityTable } from 'dexie';
import type { IBookmark, ICategory } from '@/types';

export class LinkVaultDB extends Dexie {
  bookmarks!: EntityTable<IBookmark, 'id'>;
  categories!: EntityTable<ICategory, 'id'>;

  constructor() {
    super('LinkVaultDB');
    this.version(1).stores({
      bookmarks: 'id, categoryId, createdAt, title, url',
      categories: 'id, name',
    });
    this.version(2).stores({
      bookmarks: 'id, categoryId, createdAt, title, url',
      categories: 'id, name, createdAt',
    });
    this.version(3).stores({
      bookmarks: 'id, categoryId, createdAt, title, url',
      categories: 'id, name, createdAt',
    });
  }
}

export const db = new LinkVaultDB();

// 初始化默认分类（仅在首次运行时）
export async function initDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    const now = Date.now();
    await db.categories.bulkAdd([
      { id: 'cat-tech',     name: '技术',   color: '#3498DB', createdAt: now },
      { id: 'cat-design',   name: '设计',   color: '#E17055', createdAt: now },
      { id: 'cat-reading',  name: '阅读',   color: '#2ECC71', createdAt: now },
      { id: 'cat-tool',     name: '工具',   color: '#F39C12', createdAt: now },
      { id: 'cat-video',    name: '影音',   color: '#9B59B6', createdAt: now },
      { id: 'cat-other',    name: '其他',   color: '#95A5A6', createdAt: now },
    ]);
  }
}
