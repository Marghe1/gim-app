// Full backup: everything that lives on the device, in one downloadable file.
//
// Because all data is stored locally (no accounts, no server), a backup is the
// only way to move to a new phone or recover after clearing the browser. This
// bundles BOTH the workout data (localStorage) AND the progress photos
// (IndexedDB) into a single JSON file the user can save anywhere.

import type { ProgressPhoto } from './photoStorage';
import { getAllPhotos, putPhoto } from './photoStorage';

// Every localStorage key the app owns uses this prefix. Backing up ALL keys
// with it guarantees the file contains every piece of data — workouts, body
// measurements, profile, settings — now and for any feature added later, with
// no list to keep in sync. (Progress photos live in IndexedDB and are bundled
// separately below.)
const BACKUP_PREFIX = 'gymtrack_';

const BACKUP_VERSION = 1;

type BackupPhoto = Omit<ProgressPhoto, 'blob'> & {
  mime: string;
  data: string; // base64-encoded image bytes
};

type BackupFile = {
  app: 'GymApp';
  version: number;
  exportedAt: string;
  local: Record<string, unknown>;
  photos: BackupPhoto[];
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:...;base64," prefix
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Build the backup object (also used by tests / sharing if ever needed).
async function buildBackup(): Promise<BackupFile> {
  const local: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(BACKUP_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (raw != null) {
      try {
        local[key] = JSON.parse(raw);
      } catch {
        local[key] = raw;
      }
    }
  }

  const photos = await getAllPhotos();
  const backupPhotos: BackupPhoto[] = [];
  for (const p of photos) {
    const { blob, ...meta } = p;
    backupPhotos.push({
      ...meta,
      mime: blob.type || 'image/jpeg',
      data: await blobToBase64(blob),
    });
  }

  return {
    app: 'GymApp',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    local,
    photos: backupPhotos,
  };
}

// Trigger a download of the full backup as a .json file.
export async function exportBackup(): Promise<void> {
  const backup = await buildBackup();
  const json = JSON.stringify(backup);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = `gymapp-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type RestoreSummary = { workouts: number; logs: number; exercises: number; measurements: number; photos: number };

// Restore from a backup file. Merges photos (by id) and REPLACES the workout
// data sets. Returns a small summary for confirmation messaging.
export async function importBackup(file: File): Promise<RestoreSummary> {
  const text = await file.text();
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid GymApp backup.');
  }
  if (parsed?.app !== 'GymApp' || !parsed.local) {
    throw new Error('This file is not a valid GymApp backup.');
  }

  // Restore localStorage data — every key in the backup that belongs to us.
  for (const [key, value] of Object.entries(parsed.local)) {
    if (!key.startsWith(BACKUP_PREFIX)) continue; // ignore anything foreign
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Restore photos into IndexedDB.
  let photoCount = 0;
  for (const bp of parsed.photos ?? []) {
    const { mime, data, ...meta } = bp;
    await putPhoto({ ...meta, blob: base64ToBlob(data, mime) } as ProgressPhoto);
    photoCount++;
  }

  const arr = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return {
    workouts: arr(parsed.local['gymtrack_workouts']),
    logs: arr(parsed.local['gymtrack_workout_logs']),
    exercises: arr(parsed.local['gymtrack_exercises']),
    measurements: arr(parsed.local['gymtrack_measurements']),
    photos: photoCount,
  };
}
