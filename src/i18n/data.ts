import type { Lang } from './context';

// Translations for the app's built-in content (seed exercises, muscle groups,
// pre-built workout templates and their categories). Data is stored in English
// in localStorage; these maps translate it at display time, so existing data
// shows up in the chosen language without any migration. Anything the user
// typed themselves (custom exercises, custom workout names) has no entry here
// and is shown unchanged.

type Pair = { it: string; fr: string };

const muscleGroups: Record<string, Pair> = {
  Legs: { it: 'Gambe', fr: 'Jambes' },
  Back: { it: 'Schiena', fr: 'Dos' },
  Chest: { it: 'Petto', fr: 'Pectoraux' },
  Shoulders: { it: 'Spalle', fr: 'Épaules' },
  Arms: { it: 'Braccia', fr: 'Bras' },
  Core: { it: 'Core', fr: 'Core' },
  Glutes: { it: 'Glutei', fr: 'Fessiers' },
  'Warm-up': { it: 'Riscaldamento', fr: 'Échauffement' },
  Cardio: { it: 'Cardio', fr: 'Cardio' },
  'Full Body': { it: 'Total body', fr: 'Corps entier' },
  Plyometrics: { it: 'Pliometria', fr: 'Pliométrie' },
  Stretching: { it: 'Stretching', fr: 'Étirements' },
};

const exercises: Record<string, Pair> = {
  Squat: { it: 'Squat', fr: 'Squat' },
  Deadlift: { it: 'Stacco da terra', fr: 'Soulevé de terre' },
  'Bench Press': { it: 'Panca piana', fr: 'Développé couché' },
  'Overhead Press': { it: 'Lento avanti', fr: 'Développé militaire' },
  'Barbell Row': { it: 'Rematore con bilanciere', fr: 'Rowing à la barre' },
  'Pull-ups': { it: 'Trazioni', fr: 'Tractions' },
  Lunges: { it: 'Affondi', fr: 'Fentes' },
  'Dumbbell Curl': { it: 'Curl con manubri', fr: 'Curl haltères' },
  'Tricep Dips': { it: 'Dip per tricipiti', fr: 'Dips triceps' },
  Plank: { it: 'Plank', fr: 'Planche' },
  'Russian Twist': { it: 'Russian twist', fr: 'Russian twist' },
  'Leg Press': { it: 'Leg press', fr: 'Presse à cuisses' },
  'Lat Pulldown': { it: 'Lat machine', fr: 'Tirage vertical' },
  'Chest Fly': { it: 'Croci per il petto', fr: 'Écarté pectoraux' },
  'Shoulder Lateral Raise': { it: 'Alzate laterali', fr: 'Élévations latérales' },
  'Leg Curl': { it: 'Leg curl', fr: 'Leg curl' },
  'Leg Extension': { it: 'Leg extension', fr: 'Leg extension' },
  'Cable Row': { it: 'Rematore ai cavi', fr: 'Rowing à la poulie' },
  'Push-ups': { it: 'Flessioni', fr: 'Pompes' },
  'Kettlebell Swing': { it: 'Kettlebell swing', fr: 'Kettlebell swing' },
  'Cable Pallof Rotation': { it: 'Pallof rotation ai cavi', fr: 'Rotation Pallof à la poulie' },
  'Cable Pallof Press': { it: 'Pallof press ai cavi', fr: 'Press Pallof à la poulie' },
  'Ankle Pumps': { it: 'Pompe per le caviglie', fr: 'Pompes de cheville' },
  'Heel Drops': { it: 'Abbassamenti del tallone', fr: 'Descentes de talon' },
  'Pike Lifts': { it: 'Pike lift', fr: 'Relevés en pic' },
  'Kettlebell Pullthrough': { it: 'Kettlebell pull-through', fr: 'Pull-through kettlebell' },
  'Hollow Body Hold': { it: 'Hollow hold', fr: 'Hollow hold' },
  'Romanian Deadlift': { it: 'Stacco rumeno', fr: 'Soulevé de terre roumain' },
  'Bulgarian Split Squat': { it: 'Affondo bulgaro', fr: 'Squat bulgare' },
  'Hip Thrust': { it: 'Hip thrust', fr: 'Hip thrust' },
  'Elevated Plank Row': { it: 'Rematore in plank rialzato', fr: 'Rowing en planche surélevée' },
  'Stair Climber': { it: 'Stair climber', fr: 'Stair climber' },
  'Hip Mobility': { it: "Mobilità dell'anca", fr: 'Mobilité de la hanche' },
  'Cat Cow': { it: 'Cat-cow', fr: 'Chat-vache' },
  'Prone Scorpion': { it: 'Scorpione prono', fr: 'Scorpion à plat ventre' },
  'Thoracic Rotations': { it: 'Rotazioni toraciche', fr: 'Rotations thoraciques' },
  'Walking Lunge with Rotation': {
    it: 'Affondo camminato con rotazione',
    fr: 'Fente marchée avec rotation',
  },
  'Copenhagen Plank': { it: 'Plank di Copenhagen', fr: 'Planche de Copenhague' },
  'Overhead March': {
    it: 'Marcia con peso sopra la testa',
    fr: 'Marche bras au-dessus de la tête',
  },
  'Drop Jump': { it: 'Drop jump', fr: 'Drop jump' },
  'Counter Movement Jump': {
    it: 'Counter movement jump',
    fr: 'Saut avec contre-mouvement',
  },
  'Ball Slams': { it: 'Ball slam', fr: 'Ball slams' },
  'Med Ball Throws': { it: 'Lanci con palla medica', fr: 'Lancers de medecine ball' },
  'Wall Ball Shots': { it: 'Wall ball', fr: 'Wall ball' },
  'Suspended Row': { it: 'Rematore in sospensione', fr: 'Rowing en suspension' },
  'Glute Bridge': { it: 'Ponte per i glutei', fr: 'Pont fessier' },
  'Side Plank': { it: 'Plank laterale', fr: 'Planche latérale' },
  'Shoulder Press': { it: 'Shoulder press', fr: 'Développé épaules' },
  'Incline Walk': { it: 'Camminata in salita', fr: 'Marche en pente' },
  'Kettlebell Windmill': { it: 'Windmill con kettlebell', fr: 'Moulin à vent kettlebell' },
  'Curl Up': { it: 'Curl-up', fr: 'Curl-up' },
  'Reverse Lunge': { it: "Affondo all'indietro", fr: 'Fente arrière' },
  'Seated Row': { it: 'Rematore seduto', fr: 'Rowing assis' },
  'Back Squat': { it: 'Back squat', fr: 'Back squat' },
  'Bent-Over Row': { it: 'Rematore con busto flesso', fr: 'Rowing buste penché' },
  'Lateral Step Down': { it: 'Step down laterale', fr: 'Descente latérale' },
  'Flat Bench Press': { it: 'Panca piana', fr: 'Développé couché à plat' },
  'Single Leg Glute Bridge': { it: 'Ponte glutei su una gamba', fr: 'Pont fessier unijambe' },
  'Forward to Side Plank': {
    it: 'Da plank frontale a laterale',
    fr: 'Planche frontale vers latérale',
  },
  'Unilateral Cable Lat Pulldown': {
    it: 'Lat machine unilaterale ai cavi',
    fr: 'Tirage vertical unilatéral à la poulie',
  },
  'Elevated Push-Up': { it: 'Flessioni rialzate', fr: 'Pompes surélevées' },
  'Single Leg Hip Thrust': { it: 'Hip thrust su una gamba', fr: 'Hip thrust unijambe' },
  'Eccentric Heel Drop': {
    it: 'Abbassamento eccentrico del tallone',
    fr: 'Descente de talon excentrique',
  },
  'Chest Ball Slam': { it: 'Ball slam dal petto', fr: 'Ball slam poitrine' },
  'Straight Leg Bridge on Swiss Ball': {
    it: 'Ponte a gambe tese su Swiss ball',
    fr: 'Pont jambes tendues sur Swiss ball',
  },
  'Single Leg Glute Bridge Hold': {
    it: 'Tenuta ponte glutei su una gamba',
    fr: 'Maintien pont fessier unijambe',
  },
  'Single Leg Balance with Kettlebell Round the World': {
    it: 'Equilibrio su una gamba con kettlebell "round the world"',
    fr: 'Équilibre unijambe avec kettlebell « round the world »',
  },
  'Dumbbell Single Leg Romanian Deadlift': {
    it: 'Stacco rumeno su una gamba con manubrio',
    fr: 'Soulevé de terre roumain unijambe haltère',
  },
  'Split Squat Hold with Kettlebell Pass Around': {
    it: 'Tenuta in split squat con passaggio kettlebell',
    fr: 'Maintien split squat avec passage de kettlebell',
  },
  'Single Leg Drop Jump with Stabilisation': {
    it: 'Drop jump su una gamba con stabilizzazione',
    fr: 'Drop jump unijambe avec stabilisation',
  },
  'Box Step-Up': { it: 'Salita sul box', fr: 'Montée sur box' },
  'Pullover Crunch to Wall Throw': {
    it: 'Pullover crunch con lancio al muro',
    fr: 'Pullover crunch avec lancer au mur',
  },
  "Landmine Meadow's Row to Power Press": {
    it: 'Landmine Meadows row con power press',
    fr: 'Rowing Meadows landmine vers power press',
  },
  'Farmers Walk': { it: "Farmer's walk", fr: 'Marche du fermier' },
  'Forward Plank on Swiss Ball': {
    it: 'Plank frontale su Swiss ball',
    fr: 'Planche frontale sur Swiss ball',
  },
  'Side Plank Clamshell': { it: 'Plank laterale con clamshell', fr: 'Planche latérale clamshell' },
  'Arch Body Hold': { it: 'Tenuta arch body', fr: 'Maintien arch body' },
  'Pogo Hop': { it: 'Pogo hop', fr: 'Pogo hop' },
  'Drop Jump to Counter Movement Jump with Stabilisation': {
    it: 'Drop jump + counter movement jump con stabilizzazione',
    fr: 'Drop jump vers counter movement jump avec stabilisation',
  },
  'Glute Bridge March': { it: 'Marcia in ponte glutei', fr: 'Marche en pont fessier' },
  'Single Leg Balance on Upturned Bosu': {
    it: 'Equilibrio su una gamba su Bosu rovesciato',
    fr: 'Équilibre unijambe sur Bosu inversé',
  },
  'Single Leg Step Down': { it: 'Step down su una gamba', fr: 'Descente unijambe' },
  'Deficit Bulgarian Split Squat': {
    it: 'Affondo bulgaro in deficit',
    fr: 'Squat bulgare en déficit',
  },
  'Cardio Warm-up': { it: 'Riscaldamento cardio', fr: 'Échauffement cardio' },
  'Dynamic Stretching': { it: 'Stretching dinamico', fr: 'Étirements dynamiques' },
  'Cardio Cool-down': { it: 'Defaticamento cardio', fr: 'Retour au calme cardio' },
  'Full Body Stretching': { it: 'Stretching total body', fr: 'Étirements corps entier' },
};

const categories: Record<string, Pair> = {
  'PT Sessions': { it: 'Sessioni PT', fr: 'Séances PT' },
};

const templateNames: Record<string, Pair> = {
  'A1 - Lower Body & Core': { it: 'A1 - Parte bassa & Core', fr: 'A1 - Bas du corps & Core' },
  'A2 - Mobility & Power': { it: 'A2 - Mobilità & Potenza', fr: 'A2 - Mobilité & Puissance' },
  'Session 1 - Lower Pull / Upper Push': {
    it: 'Sessione 1 - Tirata bassa / Spinta alta',
    fr: 'Séance 1 - Tirage bas / Poussée haut',
  },
  'Session 2 - Lower Push / Upper Pull': {
    it: 'Sessione 2 - Spinta bassa / Tirata alta',
    fr: 'Séance 2 - Poussée bas / Tirage haut',
  },
  'Session B1 - Lower Power & Unilateral': {
    it: 'Sessione B1 - Potenza bassa & Unilaterale',
    fr: 'Séance B1 - Puissance bas & Unilatéral',
  },
  'Session B2 - Full Body Strength & Power': {
    it: 'Sessione B2 - Forza total body & Potenza',
    fr: 'Séance B2 - Force corps entier & Puissance',
  },
  'Session C1 - Lower Strength & Core': {
    it: 'Sessione C1 - Forza parte bassa & Core',
    fr: 'Séance C1 - Force bas du corps & Core',
  },
  'Session C2 - Unilateral Lower & Upper': {
    it: 'Sessione C2 - Unilaterale basso & alto',
    fr: 'Séance C2 - Unilatéral bas & haut',
  },
};

const templateDescriptions: Record<string, Pair> = {
  'PT session with leg press, deadlifts, split squats and core work': {
    it: 'Sessione PT con leg press, stacchi, split squat e lavoro per il core',
    fr: 'Séance PT avec presse à cuisses, soulevés de terre, squats bulgares et travail du core',
  },
  'Dynamic workout with mobility warm-up, plyometrics, ball slams and bodyweight exercises': {
    it: 'Allenamento dinamico con riscaldamento di mobilità, pliometria, ball slam ed esercizi a corpo libero',
    fr: 'Entraînement dynamique avec échauffement mobilité, pliométrie, ball slams et exercices au poids du corps',
  },
  'Deadlifts, bench press, Romanian deadlift, shoulder press and leg curls': {
    it: 'Stacchi, panca piana, stacco rumeno, shoulder press e leg curl',
    fr: 'Soulevés de terre, développé couché, soulevé roumain, développé épaules et leg curls',
  },
  'Back squats, rows, lateral step downs, lat pulldowns and leg extensions': {
    it: 'Back squat, rematori, step down laterali, lat machine e leg extension',
    fr: 'Back squats, rowings, descentes latérales, tirages verticaux et leg extensions',
  },
  'PT session: activation, plyometrics, and single-leg lower body strength': {
    it: 'Sessione PT: attivazione, pliometria e forza della parte bassa su una gamba',
    fr: 'Séance PT : activation, pliométrie et force du bas du corps sur une jambe',
  },
  'PT session: mobility warm-up, power exercises, and full body strength circuits': {
    it: 'Sessione PT: riscaldamento di mobilità, esercizi di potenza e circuiti di forza total body',
    fr: 'Séance PT : échauffement mobilité, exercices de puissance et circuits de force corps entier',
  },
  'PT session: core stability, plyometrics, and heavy lower body strength': {
    it: 'Sessione PT: stabilità del core, pliometria e forza pesante per la parte bassa',
    fr: 'Séance PT : stabilité du core, pliométrie et force lourde du bas du corps',
  },
  'PT session: core, single-leg balance and strength, plus upper body pull and press': {
    it: 'Sessione PT: core, equilibrio e forza su una gamba, più tirata e spinta per la parte alta',
    fr: 'Séance PT : core, équilibre et force sur une jambe, plus tirage et poussée du haut du corps',
  },
};

function lookup(map: Record<string, Pair>, lang: Lang, value: string): string {
  if (lang === 'en') return value;
  const entry = map[value];
  if (!entry) return value;
  return lang === 'it' ? entry.it : entry.fr;
}

export const translateMuscle = (lang: Lang, value: string) => lookup(muscleGroups, lang, value);
export const translateExercise = (lang: Lang, value: string) => lookup(exercises, lang, value);
export const translateCategory = (lang: Lang, value: string) => lookup(categories, lang, value);
export const translateTemplateName = (lang: Lang, value: string) =>
  lookup(templateNames, lang, value);
export const translateTemplateDesc = (lang: Lang, value: string) =>
  lookup(templateDescriptions, lang, value);

// Short unit word for rep counts, used by formatCount-style display.
export const REPS_LABEL: Record<Lang, string> = { en: 'reps', it: 'rip.', fr: 'rép.' };

// BCP-47 locale for Intl date/number formatting in the chosen language.
export const localeFor = (lang: Lang): string =>
  lang === 'it' ? 'it-IT' : lang === 'fr' ? 'fr-FR' : 'en-GB';
