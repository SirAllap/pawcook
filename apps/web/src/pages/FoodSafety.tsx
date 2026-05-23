import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ShieldAlert, Beef, Carrot, Apple } from 'lucide-react';
import meatsData from '@pawcook/data/meats';
import vegetablesData from '@pawcook/data/vegetables';
import fruitsData from '@pawcook/data/fruits';
import toxicData from '@pawcook/data/toxic';
import { useSpecies } from '../lib/species';
import { useSpeciesT } from '../lib/use-species-t';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { EmptyState } from '../components/ui/empty-state';
import { cn } from '../lib/cn';

type TabId = 'toxic' | 'meats' | 'vegetables' | 'fruits';

interface Meat { id: string; label: string; rawSafe: boolean; cookedSafe: boolean; notes: string; catNotes?: string; }
interface Veg  { id: string; label: string; benefit: string; notes: string; }
interface Fruit{ id: string; label: string; notes: string; }
interface Toxic{ id: string; label: string; toxicCompound: string; effect: string; species?: ('dog' | 'cat')[]; }

const meats = meatsData as Meat[];
const vegetables = vegetablesData as Veg[];
const fruits = fruitsData as Fruit[];
const toxic = toxicData as Toxic[];

export default function FoodSafety() {
  const { t } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
  const [tab, setTab] = useState<TabId>('toxic');
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();

  // Filter toxic items by species — entries without a species field
  // apply to both, by convention.
  const speciesToxic = toxic.filter((x) => !x.species || x.species.includes(species));

  const fToxic = speciesToxic.filter((x) => !q
    || t(`toxicData.${x.id}.label`,    { defaultValue: x.label }).toLowerCase().includes(q)
    || t(`toxicData.${x.id}.effect`,   { defaultValue: x.effect }).toLowerCase().includes(q));
  const fMeats = meats.filter((x) => !q
    || t(`meatData.${x.id}.label`, { defaultValue: x.label }).toLowerCase().includes(q));
  const fVeg   = vegetables.filter((x) => !q
    || t(`vegData.${x.id}.label`, { defaultValue: x.label }).toLowerCase().includes(q));
  const fFruit = fruits.filter((x) => !q
    || t(`fruitData.${x.id}.label`, { defaultValue: x.label }).toLowerCase().includes(q));

  const tabs: { id: TabId; label: string; Icon: typeof ShieldAlert; count: number }[] = [
    { id: 'toxic',      label: t('foodSafety.tabs.toxic'),      Icon: ShieldAlert, count: speciesToxic.length },
    { id: 'meats',      label: t('foodSafety.tabs.meats'),      Icon: Beef,        count: meats.length },
    { id: 'vegetables', label: t('foodSafety.tabs.vegetables'), Icon: Carrot,      count: vegetables.length },
    { id: 'fruits',     label: t('foodSafety.tabs.fruits'),     Icon: Apple,       count: fruits.length },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('foodSafety.eyebrow', { defaultValue: 'Food safety' })}
        title={t('foodSafety.title')}
        description={tS('foodSafety.subtitle')}
      />

      <div className="sticky top-14 sm:top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/85 backdrop-blur-xl border-b border-border">
        <Input
          type="text"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t('foodSafety.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leading={<Search className="h-4 w-4" />}
          trailing={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('foodSafety.clearSearch', { defaultValue: 'Clear search' })}
                title={t('foodSafety.clearSearch', { defaultValue: 'Clear search' })}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-muted-fg hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null
          }
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="space-y-6">
        <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="inline-flex w-auto gap-0.5">
            {tabs.map(({ id, label, Icon, count }) => (
              <TabsTrigger
                key={id}
                value={id}
                aria-label={`${label} (${count})`}
                className="gap-1 px-2 sm:px-3.5"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-black tabular-nums',
                    tab === id ? 'bg-primary/15 text-primary' : 'bg-surface-3 text-muted-fg',
                  )}
                >
                  {count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="toxic">
          {fToxic.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title={t('foodSafety.noResults')} description={t('foodSafety.noResultsHint')} />
          ) : (
            <ItemList>
              {fToxic.map((x, i) => (
                <motion.div
                  key={x.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                >
                  <Card variant="surface" padding="md" className="border-l-[3px] border-l-danger">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-black text-base">{t(`toxicData.${x.id}.label`, { defaultValue: x.label })}</h3>
                      <Badge variant="danger">{t('common.toxic')}</Badge>
                    </div>
                    <p className="text-sm text-muted-fg">
                      <span className="font-bold text-danger">{t('foodSafety.compound')}: </span>
                      <span className="text-foreground/90">{t(`toxicData.${x.id}.compound`, { defaultValue: x.toxicCompound })}</span>
                    </p>
                    <p className="text-sm text-muted-fg mt-1">
                      <span className="font-bold text-danger">{t('foodSafety.effect')}: </span>
                      <span className="text-foreground/90">{t(`toxicData.${x.id}.effect`, { defaultValue: x.effect })}</span>
                    </p>
                  </Card>
                </motion.div>
              ))}
            </ItemList>
          )}
        </TabsContent>

        <TabsContent value="meats">
          {fMeats.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title={t('foodSafety.noResults')} description={t('foodSafety.noResultsHint')} />
          ) : (
            <ItemList>
              {fMeats.map((x, i) => (
                <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.02 }}>
                  <Card padding="md">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base mb-1">{t(`meatData.${x.id}.label`, { defaultValue: x.label })}</h3>
                        <p className="text-sm text-muted-fg leading-relaxed">{t(`meatData.${x.id}.notes`, { defaultValue: x.notes })}</p>
                        {species === 'cat' && x.catNotes && (
                          <p className="mt-2 text-xs text-primary leading-relaxed font-medium border-l-2 border-primary/30 pl-2">
                            {t(`meatData.${x.id}.catNotes`, { defaultValue: x.catNotes })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Badge variant={x.rawSafe ? 'success' : 'warning'} className="justify-center">
                          {t('foodSafety.raw')}: {x.rawSafe ? t('foodSafety.ok') : t('foodSafety.risky')}
                        </Badge>
                        <Badge variant={x.cookedSafe ? 'success' : 'danger'} className="justify-center">
                          {t('foodSafety.cooked')}: {x.cookedSafe ? t('common.safe') : t('common.no')}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </ItemList>
          )}
        </TabsContent>

        <TabsContent value="vegetables">
          {fVeg.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title={t('foodSafety.noResults')} description={t('foodSafety.noResultsHint')} />
          ) : (
            <GridList>
              {fVeg.map((x, i) => (
                <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.02 }}>
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-black text-base">{t(`vegData.${x.id}.label`, { defaultValue: x.label })}</h3>
                      <Badge variant="success" className="text-[10px]">{t('common.safe')}</Badge>
                    </div>
                    <p className="text-sm text-primary font-semibold mb-1">{t(`vegData.${x.id}.benefit`, { defaultValue: x.benefit })}</p>
                    <p className="text-xs text-muted-fg leading-relaxed">{t(`vegData.${x.id}.notes`, { defaultValue: x.notes })}</p>
                  </Card>
                </motion.div>
              ))}
            </GridList>
          )}
        </TabsContent>

        <TabsContent value="fruits">
          {fFruit.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title={t('foodSafety.noResults')} description={t('foodSafety.noResultsHint')} />
          ) : (
            <GridList>
              {fFruit.map((x, i) => (
                <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.02 }}>
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-black text-base">{t(`fruitData.${x.id}.label`, { defaultValue: x.label })}</h3>
                      <Badge variant="success" className="text-[10px]">{t('common.safe')}</Badge>
                    </div>
                    <p className="text-xs text-muted-fg leading-relaxed">{t(`fruitData.${x.id}.notes`, { defaultValue: x.notes })}</p>
                  </Card>
                </motion.div>
              ))}
            </GridList>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemList({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-3">{children}</div>
    </AnimatePresence>
  );
}

function GridList({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </AnimatePresence>
  );
}
