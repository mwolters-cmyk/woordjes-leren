import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoek } from "@/lib/mondeling/data";

export default async function BoekPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const boek = await getBoek(slug);
  if (!boek) notFound();

  const auteur = (boek.auteur as { naam?: string } | undefined)?.naam ?? "";
  const niveau = (boek.classificatie as { niveau_primair?: number } | undefined)
    ?.niveau_primair;

  return (
    <div className="max-w-2xl">
      <Link
        href="/mondelingen"
        className="text-primary-light hover:underline text-sm mb-4 inline-block"
      >
        &larr; Terug naar boekenlijst
      </Link>

      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-text mb-1">{boek.titel}</h1>
        <p className="text-text-light mb-3">{auteur}</p>
        {niveau && (
          <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
            Niveau {niveau}
          </span>
        )}

        {boek.flaptekst && typeof boek.flaptekst === "string" && (
          <p className="text-sm text-text mt-4 leading-relaxed">
            {boek.flaptekst}
          </p>
        )}
      </div>

      <Link
        href={`/mondelingen/${slug}/sessie`}
        className="inline-block py-3 px-6 rounded-lg text-white font-medium bg-primary hover:bg-primary-dark transition-colors"
      >
        {"\u{1F5E3}\u{FE0F}"} Start mondeling
      </Link>

      <p className="text-xs text-text-light mt-4">
        De examinator stelt vragen over dit boek. Antwoord via spraak of
        getypte tekst.
      </p>
    </div>
  );
}
