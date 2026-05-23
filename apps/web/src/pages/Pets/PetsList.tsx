import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, PawPrint } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { PageFallback } from '../../components/ui/page-fallback';
import { PetCard } from '../../components/pets/PetCard';
import { usePets } from '../../contexts/PetProfilesContext';

export default function PetsList() {
  const { t } = useTranslation();
  const { pets, ready } = usePets();

  if (!ready) return <PageFallback />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('pets.eyebrow')}
        title={t('pets.list.title')}
        description={t('pets.list.subtitle')}
        actions={
          <Button asChild variant="primary" size="md">
            <Link to="/pets/new">
              <Plus className="h-4 w-4" aria-hidden />
              {t('pets.list.addPet')}
            </Link>
          </Button>
        }
      />

      {pets.length === 0 ? (
        <EmptyState
          icon={<PawPrint className="h-8 w-8" />}
          title={t('pets.list.emptyTitle')}
          description={t('pets.list.emptyDescription')}
          action={
            <Button asChild variant="primary" size="md">
              <Link to="/pets/new">
                <Plus className="h-4 w-4" aria-hidden />
                {t('pets.list.addPet')}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}
