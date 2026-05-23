import { CatIcon, DogIcon } from '../species/species-icons';
import { cn } from '../../lib/cn';
import type { Species } from '@pawcook/shared';

type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

const iconSize: Record<Size, string> = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
};

export function PetAvatar({
  photo,
  species,
  size = 'md',
  className,
}: {
  photo?: string;
  species: Species;
  size?: Size;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-full bg-primary/10 text-primary border border-primary/30 overflow-hidden',
        'flex items-center justify-center',
        sizeClasses[size],
        className,
      )}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : species === 'cat' ? (
        <CatIcon className={iconSize[size]} />
      ) : (
        <DogIcon className={iconSize[size]} />
      )}
    </div>
  );
}
