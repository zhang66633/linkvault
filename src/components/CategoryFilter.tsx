import CategoryChip from './CategoryChip';
import type { ICategory } from '@/types';

interface Props {
  categories: ICategory[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export default function CategoryFilter({ categories, activeId, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
      <CategoryChip
        name="全部"
        color="#8E8E93"
        selected={activeId === null}
        onClick={() => onChange(null)}
      />
      {categories.map((cat) => (
        <CategoryChip
          key={cat.id}
          name={cat.name}
          color={cat.color}
          selected={activeId === cat.id}
          onClick={() => onChange(activeId === cat.id ? null : cat.id)}
        />
      ))}
    </div>
  );
}
