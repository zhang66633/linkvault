import { Check } from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {CATEGORY_COLORS.map((c) => {
        const selected = value === c.hex;
        return (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2
              transition-all duration-200 cursor-pointer text-left"
            style={{
              borderColor: selected ? c.hex : 'transparent',
              backgroundColor: selected ? `${c.hex}10` : 'transparent',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: c.hex }}
            >
              {selected && <Check size={12} className="text-white" />}
            </span>
            <span className="text-[13px] text-text-primary">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
