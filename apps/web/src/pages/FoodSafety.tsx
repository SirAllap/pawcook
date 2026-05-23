import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import meatsData from '@pawcook/data/meats';
import vegetablesData from '@pawcook/data/vegetables';
import fruitsData from '@pawcook/data/fruits';
import toxicData from '@pawcook/data/toxic';

type TabId = 'toxic' | 'meats' | 'vegetables' | 'fruits';

interface Meat     { id: string; label: string; rawSafe: boolean; cookedSafe: boolean; notes: string; }
interface Vegetable{ id: string; label: string; benefit: string; notes: string; }
interface Fruit    { id: string; label: string; notes: string; }
interface ToxicItem{ id: string; label: string; toxicCompound: string; effect: string; }

const meats      = meatsData      as Meat[];
const vegetables = vegetablesData as Vegetable[];
const fruits     = fruitsData     as Fruit[];
const toxic      = toxicData      as ToxicItem[];

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EmptyState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-gray-300 font-bold text-base">
        {t('foodSafety.noResults')} &ldquo;<span className="text-amber-400">{query}</span>&rdquo;
      </p>
      <p className="text-gray-500 text-sm mt-1">{t('foodSafety.noResultsHint')}</p>
    </div>
  );
}

export default function FoodSafety() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('toxic');
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();

  const tabs: { id: TabId; label: string; icon: string; count: number }[] = [
    { id: 'toxic',      label: t('foodSafety.tabs.toxic'),      icon: '⚠️', count: toxic.length },
    { id: 'meats',      label: t('foodSafety.tabs.meats'),      icon: '🥩', count: meats.length },
    { id: 'vegetables', label: t('foodSafety.tabs.vegetables'), icon: '🥕', count: vegetables.length },
    { id: 'fruits',     label: t('foodSafety.tabs.fruits'),     icon: '🍎', count: fruits.length },
  ];

  const filteredToxic      = toxic.filter(      x => !q || x.label.toLowerCase().includes(q) || x.effect.toLowerCase().includes(q));
  const filteredMeats      = meats.filter(      x => !q || x.label.toLowerCase().includes(q));
  const filteredVegetables = vegetables.filter( x => !q || x.label.toLowerCase().includes(q));
  const filteredFruits     = fruits.filter(     x => !q || x.label.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{t('foodSafety.title')}</h1>
        <p className="text-gray-400 text-sm">{t('foodSafety.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up delay-100">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="search"
          placeholder={t('foodSafety.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl
                    pl-11 pr-10 py-3.5 text-base text-white placeholder-gray-500
                    focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                      bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center
                      text-base transition-colors">
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar animate-fade-in-up delay-150">
        {tabs.map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold
                       transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              tab === tabItem.id
                ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/25'
                : 'glass text-gray-400 hover:text-gray-200'
            }`}>
            <span>{tabItem.icon}</span>
            <span>{tabItem.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              tab === tabItem.id ? 'bg-amber-600/50 text-amber-100' : 'bg-white/[0.07] text-gray-500'
            }`}>
              {tabItem.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toxic ── */}
      {tab === 'toxic' && (
        filteredToxic.length === 0 ? <EmptyState query={search} /> : (
          <div className="space-y-3">
            {filteredToxic.map((item, i) => (
              <div key={item.id}
                className="glass-card rounded-2xl p-4 border-l-[3px] border-red-500/60 animate-slide-up"
                style={{ animationDelay: `${i * 35}ms` }}>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <h3 className="font-black text-white text-base">{item.label}</h3>
                  <span className="text-[11px] bg-red-500/15 text-red-300 border border-red-500/30
                                  px-2.5 py-1 rounded-full font-black shrink-0 tracking-wide">
                    {t('common.toxic')}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">
                    <span className="text-red-400/80 font-bold">{t('foodSafety.compound')}: </span>
                    <span className="text-gray-300">{item.toxicCompound}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="text-red-400/80 font-bold">{t('foodSafety.effect')}: </span>
                    <span className="text-gray-300">{item.effect}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Meats ── */}
      {tab === 'meats' && (
        filteredMeats.length === 0 ? <EmptyState query={search} /> : (
          <div className="space-y-2.5">
            {filteredMeats.map((item, i) => (
              <div key={item.id}
                className="glass-card rounded-2xl p-4 animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-base mb-1">{item.label}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.notes}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold text-center ${
                      item.rawSafe
                        ? 'bg-green-900/50 text-green-300 border border-green-800/40'
                        : 'bg-yellow-900/50 text-yellow-300 border border-yellow-800/40'
                    }`}>
                      {t('foodSafety.raw')}: {item.rawSafe ? t('foodSafety.ok') : t('foodSafety.risky')}
                    </span>
                    <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold text-center ${
                      item.cookedSafe
                        ? 'bg-green-900/50 text-green-300 border border-green-800/40'
                        : 'bg-red-900/50 text-red-300 border border-red-800/40'
                    }`}>
                      {t('foodSafety.cooked')}: {item.cookedSafe ? t('common.safe') : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Vegetables ── */}
      {tab === 'vegetables' && (
        filteredVegetables.length === 0 ? <EmptyState query={search} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredVegetables.map((item, i) => (
              <div key={item.id}
                className="glass-card rounded-2xl p-4 animate-slide-up"
                style={{ animationDelay: `${i * 25}ms` }}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-white text-base">{item.label}</h3>
                  <span className="text-[10px] font-bold bg-green-900/50 text-green-300 border border-green-800/40 px-2 py-0.5 rounded-full">
                    {t('common.safe')}
                  </span>
                </div>
                <p className="text-sm text-amber-400 font-semibold mb-1">{item.benefit}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Fruits ── */}
      {tab === 'fruits' && (
        filteredFruits.length === 0 ? <EmptyState query={search} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredFruits.map((item, i) => (
              <div key={item.id}
                className="glass-card rounded-2xl p-4 animate-slide-up"
                style={{ animationDelay: `${i * 25}ms` }}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-white text-base">{item.label}</h3>
                  <span className="text-[10px] font-bold bg-green-900/50 text-green-300 border border-green-800/40 px-2 py-0.5 rounded-full">
                    {t('common.safe')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
