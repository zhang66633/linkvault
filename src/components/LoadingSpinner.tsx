import { Loader2 } from 'lucide-react';

interface Props {
  size?: number;
  text?: string;
}

export default function LoadingSpinner({ size = 24, text }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 size={size} className="animate-spin text-coral" />
      {text && <p className="text-[13px] text-text-secondary">{text}</p>}
    </div>
  );
}
