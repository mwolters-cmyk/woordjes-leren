/**
 * Types voor mondeling-data en chat-protocol.
 * Komt overeen met src/data/mondelingen/*.json structuur.
 */

export interface BoekIndexEntry {
  slug: string;
  titel: string;
  auteur: string;
  jaar: string;
  niveau: number;
  leerling_url?: string;
  docent_url?: string;
  heeft_opdrachten?: boolean;
  heeft_docentinfo?: boolean;
  is_nieuw?: boolean;
}

export interface Boek {
  slug: string;
  titel: string;
  auteur: {
    naam: string;
    [k: string]: unknown;
  };
  classificatie?: {
    niveau_primair?: number;
    leeftijdsgroep?: string;
    [k: string]: unknown;
  };
  flaptekst?: string;
  [k: string]: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type Niveau = "havo 4" | "havo 5" | "vwo 4" | "vwo 5" | "vwo 6";
