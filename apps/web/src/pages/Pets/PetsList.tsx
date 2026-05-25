import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, PawPrint } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { PageFallback } from '../../components/ui/page-fallback';
import { FadeIn } from '../../components/motion/fade-in';
import { PetCard } from '../../components/pets/PetCard';
import { DataPortability } from '../../components/pets/DataPortability';
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
        glow="primary"
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
        <FadeIn>
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
        </FadeIn>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <PetCard pet={pet} />
            </motion.div>
          ))}
        </div>
      )}

      <FadeIn delay={0.1}>
        <DataPortability />
      </FadeIn>
    </div>
  );
}
