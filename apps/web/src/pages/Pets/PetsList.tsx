import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, PawPrint } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { PetCard } from '../../components/pets/PetCard';
import { DataPortability } from '../../components/pets/DataPortability';
import { usePets } from '../../contexts/PetProfilesContext';

export default function PetsList() {
  const { t } = useTranslation();
  const { pets, ready } = usePets();

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('pets.eyebrow')}
        title={t('pets.list.title')}
        description={t('pets.list.subtitle')}
        actions={
          <Link to="/pets/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" />
              {t('pets.list.addPet')}
            </Button>
          </Link>
        }
      />

      {pets.length === 0 ? (
        <EmptyState
          icon={<PawPrint className="h-8 w-8" />}
          title={t('pets.list.emptyTitle')}
          description={t('pets.list.emptyDescription')}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}

      <DataPortability />
    </div>
  );
}
