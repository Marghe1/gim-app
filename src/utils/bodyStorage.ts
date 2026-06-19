// Body measurements: weight, auto BMI (from height), and circumferences over
// time. Stored in localStorage like the rest of the app (gymtrack_ prefix).

export type Sex = 'female' | 'male';

// Sex + height change rarely, so they live in a small profile reused for every
// entry (BMI needs height). Sex is recorded for context; BMI itself is the
// standard weight / height² and does not depend on it.
export interface BodyProfile {
  sex?: Sex;
  heightCm?: number;
}

export interface Measurement {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  thighCm?: number;
  tricepsCm?: number;
}

const PROFILE_KEY = 'gymtrack_body_profile';
const MEASUREMENTS_KEY = 'gymtrack_measurements';

export function getBodyProfile(): BodyProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveBodyProfile(profile: BodyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Always returned oldest-first so charts and "latest" reads are consistent.
export function getMeasurements(): Measurement[] {
  const data = localStorage.getItem(MEASUREMENTS_KEY);
  const list: Measurement[] = data ? JSON.parse(data) : [];
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function saveMeasurement(m: Measurement): void {
  const list = getMeasurements();
  const i = list.findIndex(x => x.id === m.id);
  if (i >= 0) list[i] = m;
  else list.push(m);
  localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(list));
}

export function deleteMeasurement(id: string): void {
  const list = getMeasurements().filter(m => m.id !== id);
  localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(list));
}

// BMI = weight(kg) / height(m)². Returns null if either input is missing.
export function computeBmi(weightKg?: number, heightCm?: number): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
