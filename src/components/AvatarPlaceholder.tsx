import { getAvatarColor } from '@/lib/utils';

interface Props {
  title: string;
  /** 外层容器 class（尺寸、圆角、aspect 等） */
  className?: string;
  /** 文字大小 class */
  charClassName?: string;
}

/** 无封面图时的首字占位头像 — 白字居中，彩色背景 */
export default function AvatarPlaceholder({
  title,
  className = '',
  charClassName = 'text-3xl',
}: Props) {
  const firstChar = title?.trim()?.[0]?.toUpperCase() || '?';
  const bgColor = getAvatarColor(title);

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={`font-bold text-white ${charClassName}`}>
        {firstChar}
      </span>
    </div>
  );
}
