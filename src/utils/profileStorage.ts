// The user's personal profile: identity details shown around the app (name,
// city, photo, birthday). Stored in localStorage like the rest of the app.
//
// Body data (height, weight, BMI) deliberately lives in bodyStorage.ts so there
// is a single source of truth — the Profile screen reads/writes height there.

export interface UserProfile {
  name?: string;
  city?: string;
  birthDate?: string; // YYYY-MM-DD
  avatar?: string; // small square JPEG as a data URL
}

const KEY = 'gymtrack_user_profile';

export function getUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* ignore persistence failures (private mode, quota, etc.) */
  }
}

// Crop an uploaded image to a centred square and shrink it to a small JPEG data
// URL so a profile picture stays a few tens of KB (safe for localStorage).
export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const edge = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - edge) / 2;
  const sy = (bitmap.height - edge) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas not available');
  }
  ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Whole years since birthDate, or null if missing/invalid.
export function computeAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate + 'T00:00:00');
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}
