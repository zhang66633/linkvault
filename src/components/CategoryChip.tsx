interface Props {
  name: string;
  color: string;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export default function CategoryChip({ name, color, selected, small, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center whitespace-nowrap rounded-full font-medium
        transition-all duration-200 cursor-pointer
        ${small ? 'text-[11px] px-2.5 py-0.5 gap-1' : 'text-[13px] px-3 py-1.5 gap-1.5'}
        ${selected
          ? 'text-white shadow-sm'
          : 'bg-white text-text-secondary border border-border hover:border-coral/40'
        }
      `}
      style={selected ? { backgroundColor: color } : undefined}
    >
      {!small && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: selected ? 'rgba(255,255,255,0.9)' : color }}
        />
      )}
      {name}
    </button>
  );
}
