import { useState } from 'react';
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
  const [tab, setTab] = useState<TabId>('toxic');
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'toxic', label: '⚠️ Toxic', count: toxic.length },
    { id: 'meats', label: '🥩 Meats', count: meats.length },
    { id: 'vegetables', label: '🥕 Vegetables', count: vegetables.length },
    { id: 'fruits', label: '🍎 Fruits', count: fruits.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">Food Safety Reference</h1>
      <p className="text-gray-400 text-sm mb-4">Search safe and toxic foods for dogs.</p>

      <input
        type="search"
        placeholder="Search foods…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label} <span className="opacity-60 text-xs">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'toxic' && (
        <div className="space-y-2">
          {toxic.filter(item => !q || item.label.toLowerCase().includes(q) || item.effect.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-red-950 border border-red-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-red-300">{item.label}</h3>
                <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded shrink-0">TOXIC</span>
              </div>
              <p className="text-sm text-red-200 mt-1"><span className="text-red-400 font-medium">Compound:</span> {item.toxicCompound}</p>
              <p className="text-sm text-red-200"><span className="text-red-400 font-medium">Effect:</span> {item.effect}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'meats' && (
        <div className="space-y-2">
          {meats.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{item.notes}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${item.rawSafe ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    Raw: {item.rawSafe ? 'OK' : 'Risky'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${item.cookedSafe ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    Cooked: {item.cookedSafe ? 'Safe' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'vegetables' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {vegetables.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{item.label}</h3>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Safe</span>
              </div>
              <p className="text-xs text-amber-400">{item.benefit}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fruits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fruits.filter(item => !q || item.label.toLowerCase().includes(q)).map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{item.label}</h3>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Safe</span>
              </div>
              <p className="text-xs text-gray-400">{item.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
