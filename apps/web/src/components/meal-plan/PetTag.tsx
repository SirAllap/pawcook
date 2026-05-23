import type { PetProfile } from '@pawcook/shared';
import { CatIcon, DogIcon } from '../species/species-icons';
import { cn } from '../../lib/cn';

export function PetTag({ pet, className }: { pet: PetProfile; className?: string }) {
  const Icon = pet.nutrition.species === 'cat' ? CatIcon : DogIcon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/25',
        'px-2 py-0.5 text-[10px] font-bold tracking-wide',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {pet.name}
    </span>
  );
}
