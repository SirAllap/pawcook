import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Compass } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl mx-auto py-12 sm:py-20">
      <Card padding="lg" variant="elevated" className="text-center space-y-5">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-2">
            {t('notFound.eyebrow', { defaultValue: '404' })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-balance">
            {t('notFound.title', { defaultValue: 'Page not found' })}
          </h1>
          <p className="mt-3 text-sm text-muted-fg leading-relaxed">
            {t('notFound.description', {
              defaultValue:
                "The page you’re looking for doesn’t exist or was moved.",
            })}
          </p>
        </div>
        <div className="flex justify-center">
          <Button asChild variant="primary" size="md">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.home', { defaultValue: 'Back to home' })}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
