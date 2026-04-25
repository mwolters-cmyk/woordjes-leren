/**
 * /mondelingen — boekenlijst
 *
 * Toont alle boeken die we gesynthetiseerd hebben (= JSON-bestand
 * aanwezig in src/data/mondelingen/boeken/).
 *
 * Pagina is bewust niet gelinkt vanuit de hoofd-UI. Alleen via
 * directe URL bereikbaar tijdens MVP-fase.
 */

import Link from "next/link";
import { getIndex, getAvailableSlugs } from "@/lib/mondeling/data";

export default async function MondelingenHome() {
  const [allBooks, available] = await Promise.all([
    getIndex(),
    getAvailableSlugs(),
  ]);

  // Filter: alleen boeken waarvan de JSON al bestaat
  const ready = allBooks
    .filter((b) => available.has(b.slug))
    .sort((a, b) => a.titel.localeCompare(b.titel));

  const groupedByNiveau: Record<number, typeof ready> = {};
  for (const b of ready) {
    if (!groupedByNiveau[b.niveau]) groupedByNiveau[b.niveau] = [];
    groupedByNiveau[b.niveau].push(b);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Mondeling oefenen</h1>
        <p className="text-text-light">
          Bovenbouw Nederlands — {ready.length} boeken beschikbaar
          {" "}({allBooks.length} in catalogus). MVP-fase, alleen direct via
          URL bereikbaar.
        </p>
      </div>

      {Object.keys(groupedByNiveau)
        .map(Number)
        .sort()
        .map((niveau) => (
          <section key={niveau} className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-3">
              Niveau {niveau}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupedByNiveau[niveau].map((b) => (
                <Link
                  key={b.slug}
                  href={`/mondelingen/${b.slug}`}
                  className="card p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-text">{b.titel}</h3>
                  <p className="text-sm text-text-light">
                    {b.auteur} ({b.jaar})
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}

      {ready.length === 0 && (
        <div className="card p-6 text-center text-text-light">
          Nog geen boeken klaar. Run{" "}
          <code className="bg-gray-100 px-1 rounded">
            npm run sync-mondelingen
          </code>
        </div>
      )}
    </div>
  );
}
