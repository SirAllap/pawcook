import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/page-header';
import { PetForm } from './PetForm';
import { usePets } from '../../contexts/PetProfilesContext';

export default function PetEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { getPet, ready } = usePets();

  if (!ready) return null;
  const pet = id ? getPet(id) : undefined;
  if (!pet) return <Navigate to="/pets" replace />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('pets.eyebrow')}
        title={t('pets.edit.title', { name: pet.name })}
        description={t('pets.edit.subtitle')}
      />
      <PetForm existing={pet} />
    </div>
  );
}
