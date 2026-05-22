import supplementsData from '@pawcook/data/supplements';

interface SupplementSource {
  id: string;
  label: string;
  dose: string;
}

interface Supplement {
  id: string;
  label: string;
  target: string;
  sources: SupplementSource[];
}

const supplements = supplementsData as Supplement[];

export default function SupplementGuide() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">Supplement Guide</h1>
      <p className="text-gray-400 text-sm mb-2">A homemade diet without bones requires calcium supplementation — this is the #1 deficiency in DIY dog food.</p>

      <div className="bg-amber-950 border border-amber-800 rounded-lg p-4 mb-6 text-sm text-amber-200">
        <strong>Ca:P ratio target: 1.2:1 to 1.4:1</strong> (AAFCO acceptable range 1:1 to 2.1:1). Meat alone is ~1:20 — heavily phosphorus-skewed. Supplementation is mandatory.
      </div>

      <div className="space-y-4">
        {supplements.map(supp => (
          <div key={supp.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold text-lg text-amber-300 mb-1">{supp.label}</h2>
            <p className="text-sm text-gray-400 mb-3"><span className="text-gray-300 font-medium">Target:</span> {supp.target}</p>
            <div className="space-y-2">
              {supp.sources.map(src => (
                <div key={src.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-200">{src.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{src.dose}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-amber-300 mb-3">Recommended Commercial Balancers</h2>
        <ul className="space-y-2 text-sm text-gray-300">
          {[
            ['Balance IT', 'UC Davis veterinary nutritionists — recipe-specific'],
            ['Wysong Call of the Wild', 'For all-meat diets'],
            ['Animal Essentials Complete Multivitamin & Mineral', 'Broad spectrum'],
            ['Volhard NDF2', 'Full premix approach'],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-2">
              <span className="text-amber-500 shrink-0">•</span>
              <span><strong className="text-white">{name}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
