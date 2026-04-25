import { notFound } from "next/navigation";
import { getBoek, getExaminatorPrompt } from "@/lib/mondeling/data";
import MondelingChat from "@/components/mondeling/MondelingChat";

export default async function SessiePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [boek, examinatorPrompt] = await Promise.all([
    getBoek(slug),
    getExaminatorPrompt(),
  ]);
  if (!boek) notFound();

  return (
    <MondelingChat
      slug={slug}
      boek={boek as unknown as Record<string, unknown>}
      examinatorPrompt={examinatorPrompt}
    />
  );
}
