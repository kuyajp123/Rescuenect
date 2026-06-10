import { ImagePlus } from 'lucide-react';

type ClientLogoAvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export const ClientLogoAvatar = ({ src, name, size = 'md' }: ClientLogoAvatarProps) => {
  const label = name?.trim() || 'LGU';

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-default-200 bg-default-100 text-default-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`}
      aria-label={`${label} logo`}
    >
      {src ? (
        <img src={src} alt={`${label} logo`} className="h-full w-full object-cover" />
      ) : (
        <ImagePlus size={size === 'lg' ? 24 : 18} />
      )}
    </div>
  );
};
