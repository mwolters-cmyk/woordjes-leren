import Link from "next/link";

export default function MondelingenHome() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-4">{"\u{1F5E3}\u{FE0F}"}</div>
        <h1 className="text-3xl font-bold text-primary mb-3">
          Mondeling oefenen
        </h1>
        <p className="text-text-light mb-2">
          Bovenbouw Nederlands en Engels.
        </p>
        <p className="text-text-light text-sm mb-8">
          Een AI-examinator stelt vragen over je gelezen boeken volgens
          de officiële vraagtaxonomie. Je antwoordt via spraak, krijgt
          aan het eind feedback.
        </p>

        <div className="card p-6 bg-amber-50 border-amber-200 mb-6">
          <p className="font-semibold text-amber-800 mb-2">
            {"\u{1F6A7}"} Binnenkort beschikbaar
          </p>
          <p className="text-sm text-amber-700">
            We zijn de mondeling-functie aan het bouwen. Voor nu staan er
            21 boeken klaar (Lezen voor de Lijst niveau 3-6). Eind mei
            beschikbaar voor leerlingen.
          </p>
        </div>

        <Link
          href="https://woordjes.overhoorme.nl"
          className="inline-block py-2 px-6 rounded-lg text-white font-medium bg-primary hover:bg-primary-dark transition-colors"
        >
          {"\u{2190}"} Naar woordjes oefenen
        </Link>
      </div>
    </div>
  );
}
