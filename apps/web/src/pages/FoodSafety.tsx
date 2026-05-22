import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import meatsData from '@pawcook/data/meats';
import vegetablesData from '@pawcook/data/vegetables';
import fruitsData from '@pawcook/data/fruits';
import toxicData from '@pawcook/data/toxic';

type TabId = 'toxic' | 'meats' | 'vegetables' | 'fruits';

interface Meat {
  id: string;
  label: string;
  rawSafe: boolean;
  cookedSafe: boolean;
  notes: string;
}

interface Vegetable {
  id: string;
  label: string;
  benefit: string;
  notes: string;
}

interface Fruit {
  id: string;
  label: string;
  notes: string;
}

interface ToxicItem {
  id: string;
  label: string;
  toxicCompound: string;
  effect: string;
}

const meats = meatsData as Meat[];
const vegetables = vegetablesData as Vegetable[];
const fruits = fruitsData as Fruit[];
const toxic = toxicData as ToxicItem[];

export default function FoodSafety() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('toxic');
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();

  const tabs: { id: TabId; label: string; icon: string; count: number }[] = [
    { id: 'toxic', label: t('foodSafety.tabs.toxic'), icon: '⚠️', count: toxic.length },
    { id: 'meats', label: t('foodSafety.tabs.meats'), icon: '🥩', count: meats.length },
    { id: 'vegetables', label: t('foodSafety.tabs.vegetables'), icon: '🥕', count: vegetables.length },
    { id: 'fruits', label: t('foodSafety.tabs.fruits'), icon: '🍎', count: fruits.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">{t('foodSafety.title')}</h1>
      <p className="text-gray-400 text-sm mb-4">{t('foodSafety.subtitle')}</p>

      <div className="relative mb-4">
        <input
          type="search"
          placeholder={t('foodSafety.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
        {tabs.map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap active:scale-95 shrink-0 ${
              tab === tabItem.id
                ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            <span>{tabItem.icon}</span>
            <span>{tabItem.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === tabItem.id ? 'bg-amber-600/60 text-amber-100' : 'bg-gray-700 text-gray-400'}`}>
              {tabItem.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'toxic' && (
        <div className="space-y-3">
          {toxic.filter(item => !q || item.label.toLowerCase().includes(q) || item.effect.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-red-950/80 border border-red-800/60 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-red-200 text-base">{item.label}</h3>
                <span className="text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-full font-semibold shrink-0">{t('common.toxic')}</span>
              </div>
              <p className="text-sm text-red-300 mb-1">
                <span className="text-red-400 font-semibold">{t('foodSafety.compound')}:</span> {item.toxicCompound}
              </p>
              <p className="text-sm text-red-300">
                <span className="text-red-400 font-semibold">{t('foodSafety.effect')}:</span> {item.effect}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'meats' && (
        <div className="space-y-3">
          {meats.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-0.5">{item.label}</h3>
                  <p className="text-sm text-gray-400">{item.notes}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium text-center ${item.rawSafe ? 'bg-green-900/60 text-green-300 border border-green-800/50' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-800/50'}`}>
                    {t('foodSafety.raw')}: {item.rawSafe ? t('foodSafety.ok') : t('foodSafety.risky')}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium text-center ${item.cookedSafe ? 'bg-green-900/60 text-green-300 border border-green-800/50' : 'bg-red-900/60 text-red-300 border border-red-800/50'}`}>
                    {t('foodSafety.cooked')}: {item.cookedSafe ? t('common.safe') : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'vegetables' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vegetables.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-bold text-base">{item.label}</h3>
                <span className="text-xs bg-green-900/60 text-green-300 border border-green-800/50 px-2 py-0.5 rounded-full">{t('common.safe')}</span>
              </div>
              <p className="text-sm text-amber-400 mb-1">{item.benefit}</p>
              <p className="text-xs text-gray-400">{item.notes}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fruits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fruits.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-bold text-base">{item.label}</h3>
                <span className="text-xs bg-green-900/60 text-green-300 border border-green-800/50 px-2 py-0.5 rounded-full">{t('common.safe')}</span>
              </div>
              <p className="text-xs text-gray-400">{item.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
