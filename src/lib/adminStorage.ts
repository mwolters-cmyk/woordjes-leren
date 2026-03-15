import { Word } from "./types";

const LISTS_KEY = "woordjes-admin-lists";
const PHOTOS_PREFIX = "woordjes-admin-photos-";

interface AdminListData {
  listId: string;
  words: Word[];
  updatedAt: string;
}

function getAll(): Record<string, AdminListData> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LISTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAll(data: Record<string, AdminListData>) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(data));
}

export function getAdminListData(listId: string): AdminListData | null {
  return getAll()[listId] ?? null;
}

export function saveListWords(listId: string, words: Word[]) {
  const all = getAll();
  all[listId] = {
    listId,
    words,
    updatedAt: new Date().toISOString(),
  };
  saveAll(all);
}

export function getAdminWordCount(listId: string): number {
  return getAdminListData(listId)?.words.length ?? 0;
}

export function getAllAdminData(): Record<string, AdminListData> {
  return getAll();
}

// Photo storage
export function savePhotos(listId: string, photos: string[]) {
  localStorage.setItem(PHOTOS_PREFIX + listId, JSON.stringify(photos));
}

export function getPhotos(listId: string): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PHOTOS_PREFIX + listId);
  return raw ? JSON.parse(raw) : [];
}

export function removePhoto(listId: string, index: number) {
  const photos = getPhotos(listId);
  photos.splice(index, 1);
  savePhotos(listId, photos);
}

// Export/import
export function exportAllData(): string {
  const all = getAll();
  return JSON.stringify(all, null, 2);
}

export function exportListAsJson(listId: string): string | null {
  const data = getAdminListData(listId);
  if (!data || data.words.length === 0) return null;
  return JSON.stringify(data.words, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json);
  const current = getAll();
  Object.assign(current, parsed);
  saveAll(current);
}
