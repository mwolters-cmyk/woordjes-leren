import Link from "next/link";

/**
 * Landing-pagina op overhoorme.nl (geen subdomein).
 * Twee grote kaarten: woordjes-app of mondelingen-app.
 */
export default function LandingPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-3">
          overhoorme.nl
        </h1>
        <p className="text-text-light text-lg max-w-md">
          Jouw oefenruimte. Jouw tempo. Jouw geheim.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link
          href="https://woordjes.overhoorme.nl"
          className="card p-8 hover:shadow-lg transition-shadow group text-center"
        >
          <div className="text-6xl mb-4">{"\u{1F4DA}"}</div>
          <h2 className="text-2xl font-bold text-primary mb-2 group-hover:underline">
            Woordjes oefenen
          </h2>
          <p className="text-text-light text-sm">
            Frans, Engels, Duits, Latijn, Grieks. Met Leitner-systeem
            en grammatica.
          </p>
        </Link>

        <Link
          href="https://mondelingen.overhoorme.nl"
          className="card p-8 hover:shadow-lg transition-shadow group text-center"
        >
          <div className="text-6xl mb-4">{"\u{1F5E3}\u{FE0F}"}</div>
          <h2 className="text-2xl font-bold text-primary mb-2 group-hover:underline">
            Mondeling oefenen
          </h2>
          <p className="text-text-light text-sm">
            Bovenbouw Nederlands & Engels. Echte examinator-vragen
            met spraakherkenning.
          </p>
          <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            Binnenkort beschikbaar
          </span>
        </Link>
      </div>

      <p className="text-xs text-text-light mt-12 text-center max-w-md">
        Voor leerlingen, door een docent. Niemand kijkt mee in jouw
        voortgang — ook geen docent of ouder.
      </p>
    </div>
  );
}
