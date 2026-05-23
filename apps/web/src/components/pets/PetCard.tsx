import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { PetProfile } from '@pawcook/shared';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { PetAvatar } from './PetAvatar';

export function PetCard({ pet }: { pet: PetProfile }) {
  const { t } = useTranslation();
  const speciesLabel = pet.nutrition.species === 'cat' ? t('pets.species.cat') : t('pets.species.dog');
  const ageLabel = t(`pets.age.${pet.nutrition.age}`);

  return (
    <Link to={`/pets/${pet.id}`} className="block group">
      <Card padding="md" className="flex items-center gap-4 hover:bg-surface-2 transition-colors">
        <PetAvatar photo={pet.photo} name={pet.name} species={pet.nutrition.species} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black tracking-tight truncate">{pet.name}</h3>
            <Badge variant="neutral" className="text-[10px]">{speciesLabel}</Badge>
          </div>
          <p className="text-xs text-muted-fg mt-0.5">
            {ageLabel} · {pet.nutrition.weightKg} kg
            {pet.conditions.length > 0 && ` · ${t('pets.conditionsLabel')}: ${pet.conditions.length}`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-fg shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
