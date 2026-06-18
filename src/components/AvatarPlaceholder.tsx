import { getAvatarColor } from '@/lib/utils';

interface Props {
  title: string;
  /** 外层容器 class（尺寸、圆角、aspect 等） */
  className?: string;
  /** 文字大小 class */
  charClassName?: string;
  /** 自定义文字，最多 10 字；不设时取标题首字 */
  text?: string;
}

/** 无封面图时的首字占位头像 — 白字居中，彩色背景 */
export default function AvatarPlaceholder({
  title,
  className = '',
  charClassName = 'text-3xl',
  text,
}: Props) {
  const display = text?.trim() || title?.trim()?.[0]?.toUpperCase() || '?';
  const bgColor = getAvatarColor(title);

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={`font-bold text-white ${charClassName}`}>
        {display}
      </span>
    </div>
  );
}
