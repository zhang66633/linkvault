import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  danger = true,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 弹窗 */}
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-[300px]
          shadow-[6px_6px_14px_rgba(0,0,0,0.06),-4px_-4px_12px_rgba(255,255,255,0.9)]
          animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            danger ? 'bg-red-50' : 'bg-coral-light'
          }`}>
            <AlertTriangle size={24} className={danger ? 'text-red-500' : 'text-coral'} />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary mb-1">{title}</h3>
          <p className="text-[13px] text-text-secondary mb-5">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-border text-text-primary
                text-[14px] font-medium hover:bg-warm-bg transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 h-10 rounded-xl text-white text-[14px] font-medium
                transition-all duration-200 active:scale-95 cursor-pointer
                ${danger
                  ? 'bg-red-500 shadow-[0_2px_8px_rgba(239,68,68,0.3)]'
                  : 'bg-coral shadow-[0_2px_8px_rgba(225,112,85,0.3)]'
                }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
