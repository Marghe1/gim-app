// Progress photos are stored in IndexedDB, NOT localStorage.
//
// Why: localStorage has a ~5MB hard limit shared with all the workout data.
// A single phone photo can be several MB, so photos there would corrupt/break
// everything. IndexedDB can hold hundreds of MB to several GB and is built for
// storing binary blobs. Photos still live on-device only (no backend).
//
// Photos are compressed (resized + re-encoded to JPEG) before saving so years
// of weekly progress shots stay well under 100 MB.

export type PhotoPose = 'front' | 'side' | 'back';

export const PHOTO_POSES: { key: PhotoPose; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'side', label: 'Side' },
  { key: 'back', label: 'Back' },
];

export type ProgressPhoto = {
  id: string;
  date: string;        // ISO date (yyyy-mm-dd) the photo represents
  pose: PhotoPose;
  note?: string;
  createdAt: string;   // ISO timestamp the record was created
  blob: Blob;          // compressed JPEG image data
};

// Metadata-only view (no blob) for listing without loading every image.
export type ProgressPhotoMeta = Omit<ProgressPhoto, 'blob'>;

const DB_NAME = 'gymtrack_photos';
const DB_VERSION = 1;
const STORE = 'photos';

// Compression target: longest edge in pixels. A phone screen never needs more
// than this for a progress shot, and it keeps file sizes tiny.
const MAX_EDGE = 1080;
const JPEG_QUALITY = 0.8;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('pose', 'pose');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Shrink + re-encode an image File to a compact JPEG Blob.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_EDGE || height > MAX_EDGE) {
    const scale = MAX_EDGE / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file; // fallback: store original if canvas unavailable
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  return blob ?? file;
}

function uid(): string {
  // Simple unique id; crypto.randomUUID is available in modern browsers.
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function addPhoto(
  file: File,
  meta: { date: string; pose: PhotoPose; note?: string }
): Promise<ProgressPhotoMeta> {
  const blob = await compressImage(file);
  const photo: ProgressPhoto = {
    id: uid(),
    date: meta.date,
    pose: meta.pose,
    note: meta.note,
    createdAt: new Date().toISOString(),
    blob,
  };
  const store = await tx('readwrite');
  await reqToPromise(store.add(photo));
  const { blob: _blob, ...rest } = photo;
  return rest;
}

// Insert a fully-formed photo record (used when restoring a backup).
export async function putPhoto(photo: ProgressPhoto): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.put(photo));
}

export async function getAllPhotos(): Promise<ProgressPhoto[]> {
  const store = await tx('readonly');
  const all = await reqToPromise(store.getAll() as IDBRequest<ProgressPhoto[]>);
  // Newest first by the date they represent, then by creation time.
  return all.sort((a, b) =>
    a.date === b.date
      ? b.createdAt.localeCompare(a.createdAt)
      : b.date.localeCompare(a.date)
  );
}

export async function deletePhoto(id: string): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.delete(id));
}

// Roughly how much space the photos take. Uses the Storage API estimate when
// available (covers the whole origin); falls back to summing blob sizes.
export async function getPhotoStorageBytes(): Promise<number> {
  const photos = await getAllPhotos();
  return photos.reduce((sum, p) => sum + (p.blob?.size ?? 0), 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
