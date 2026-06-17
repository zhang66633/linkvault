import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FAB() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/add')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
        bg-coral text-white flex items-center justify-center
        shadow-[0_4px_16px_rgba(225,112,85,0.35)]
        active:scale-95 transition-transform duration-200 cursor-pointer"
      aria-label="添加收藏"
    >
      <Plus size={28} strokeWidth={2} />
    </button>
  );
}
