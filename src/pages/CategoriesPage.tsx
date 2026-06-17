import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { useCategories } from '@/hooks/useBookmarks';
import ColorPicker from '@/components/ColorPicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ICategory } from '@/types';

export default function CategoriesPage() {
  const { categories, refreshCategories } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#E17055');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);

  const openAdd = () => {
    setEditingCat(null);
    setFormName('');
    setFormColor('#E17055');
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat: ICategory) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormColor(cat.color);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) return;
    setSaving(true);
    setError('');

    try {
      if (editingCat) {
        await db.categories.update(editingCat.id, { name, color: formColor });
      } else {
        await db.categories.add({
          id: `cat-${nanoid(8)}`,
          name,
          color: formColor,
          createdAt: Date.now(),
        });
      }

      await refreshCategories();
      setShowModal(false);
    } catch (err: any) {
      setError(err?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await db.categories.delete(deleteTarget.id);
    // 将该分类下的收藏移到其他分类或清除分类
    await refreshCategories();
    setDeleteTarget(null);
  };

  return (
    <div className="px-4 py-4 pb-24">
      {/* 顶栏操作 */}
      <button
        type="button"
        onClick={openAdd}
        className="w-full h-11 mb-4 rounded-xl bg-white border border-dashed
          border-coral/40 text-coral text-[14px] font-medium
          flex items-center justify-center gap-2
          hover:bg-coral-light/30 active:scale-[0.98]
          transition-all duration-200 cursor-pointer"
      >
        <Plus size={18} />
        新增分类
      </button>

      {/* 分类列表 */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[14px] text-text-secondary">暂无分类</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white
                shadow-[4px_4px_10px_rgba(0,0,0,0.04),-2px_-2px_8px_rgba(255,255,255,0.8)]"
            >
              <span
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-[15px] font-medium text-text-primary">
                {cat.name}
              </span>
              <button
                type="button"
                onClick={() => openEdit(cat)}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  hover:bg-black/5 transition-colors cursor-pointer"
              >
                <Edit2 size={16} className="text-text-secondary" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(cat)}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl sm:rounded-2xl p-6
              w-full sm:max-w-[360px] animate-[slideUp_250ms_ease-out]
              shadow-[6px_6px_14px_rgba(0,0,0,0.06),-4px_-4px_12px_rgba(255,255,255,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-semibold text-text-primary mb-5">
              {editingCat ? '编辑分类' : '新增分类'}
            </h2>

            {/* 名称 */}
            <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
              名称
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例如：技术、设计、阅读"
              autoFocus
              className="w-full h-11 px-4 mb-4 rounded-xl bg-white border border-border
                text-[15px] text-text-primary placeholder:text-text-secondary/60
                focus:outline-none focus:border-coral/50"
            />

            {/* 颜色 */}
            <label className="text-[13px] font-medium text-text-secondary mb-1.5 block">
              颜色
            </label>
            <ColorPicker value={formColor} onChange={setFormColor} />

            {/* 错误提示 */}
            {error && (
              <p className="text-[12px] text-red-500 mt-3">{error}</p>
            )}

            {/* 按钮 */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-11 rounded-xl border border-border
                  text-text-primary text-[14px] font-medium
                  hover:bg-warm-bg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex-1 h-11 rounded-xl bg-coral text-white text-[14px] font-medium
                  shadow-[0_2px_8px_rgba(225,112,85,0.3)]
                  active:scale-95 transition-all duration-200 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除分类"
        message={`确定删除「${deleteTarget?.name}」？该分类下的收藏不会被删除。`}
        confirmLabel="删除"
        cancelLabel="取消"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
