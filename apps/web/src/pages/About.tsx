export default function About() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-400 mb-1">About PawCook</h1>
        <p className="text-gray-400 text-sm">Open-source dog food cooking calculator built for home-cooking dog owners.</p>
      </div>

      <div className="bg-red-950 border border-red-800 rounded-xl p-5 space-y-3 text-sm">
        <h2 className="font-bold text-red-300 text-base">⚠️ Disclaimers</h2>
        <p className="text-red-200">This tool is <strong>not veterinary advice</strong>. It provides general guidelines based on published veterinary nutrition standards (AAFCO, NRC, FEDIAF). Every dog is individual. For long-term homemade feeding, consult a board-certified veterinary nutritionist (ACVN diplomate).</p>
        <p className="text-red-200"><strong>Cooked bones are never safe.</strong> This tool will never recommend cooked bones in any recipe.</p>
        <p className="text-red-200"><strong>Pathogen safety:</strong> Cook to recommended internal temperatures verified with a meat thermometer. Cool cooked food promptly.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 text-sm">
        <h2 className="font-bold text-amber-300 text-base">Methodology & Sources</h2>
        <ul className="space-y-1 text-gray-300">
          {[
            'AAFCO Dog Food Nutrient Profiles',
            'NRC Nutrient Requirements of Dogs and Cats (2006)',
            'FEDIAF Nutritional Guidelines',
            'Merck Veterinary Manual',
            'WSAVA Global Nutrition Guidelines',
            'ACVN position statements',
          ].map(s => <li key={s} className="flex gap-2"><span className="text-amber-500">•</span>{s}</li>)}
        </ul>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm">
        <h2 className="font-bold text-amber-300 text-base mb-2">Open Source</h2>
        <p className="text-gray-300">PawCook is MIT licensed. Contributions, corrections, and feature requests welcome on <a href="https://github.com/SirAllap/pawcook" className="text-amber-400 underline">GitHub</a>.</p>
      </div>
    </div>
  );
}
