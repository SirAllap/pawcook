import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/page-header';
import { PetForm } from './PetForm';

export default function PetNew() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('pets.eyebrow')}
        title={t('pets.new.title')}
        description={t('pets.new.subtitle')}
      />
      <PetForm />
    </div>
  );
}
