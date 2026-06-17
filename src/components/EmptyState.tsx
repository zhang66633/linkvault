import { BookmarkPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  icon?: 'bookmark' | 'search';
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(225,112,85,0.1), rgba(225,112,85,0.05))',
        }}
      >
        <BookmarkPlus size={32} className="text-coral/60" />
      </div>
      <h3 className="text-[16px] font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-text-secondary mb-4 max-w-[240px]">{description}</p>
      )}
      {actionLabel && actionTo && (
        <button
          type="button"
          onClick={() => navigate(actionTo)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-coral text-white text-[14px] font-medium
            shadow-[0_2px_8px_rgba(225,112,85,0.3)]
            active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <BookmarkPlus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
