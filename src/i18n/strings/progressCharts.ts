import type { Strings } from '../context';

export const progressChartsStrings: Strings = {
  en: {
    // Overall progress chart
    overallProgressTitle: 'Overall progress',
    overallProgressSubtitle:
      'A 0–100 score per workout blending weight, reps and effort vs your best. Tap a bar for details.',
    legendScore: 'Score',
    legendTrend: 'Trend',
    showingLastWorkouts: 'Showing your last {max} workouts ({truncated} earlier not shown)',
    detailScore: 'Score',
    detailWeight: 'Weight',
    detailReps: 'Reps',
    detailHold: 'Hold',
    detailEffort: 'Effort',
    detailTime: 'Time',
    detailClose: 'Close',
    detailWhatTitle: 'What this means',
    detailExplanation:
      'Your overall score is {score} out of 100. It blends how much weight you lifted, the reps and holds you did, and how hard the workout felt — all compared with your best-ever workout. The closer to 100, the closer you were to your personal best.',
    detailBestNote: '🔥 This was your best workout so far!',

    // Effort pie
    effortPieTitle: 'How hard your workouts felt',
    effortPieSubtitle: 'Effort you logged after each exercise.',
    tooltipTimesOne: '{n} time',
    tooltipTimesMany: '{n} times',

    // Volume chart
    volumeTitle: 'Total weight lifted',
    volumeSubtitle: 'Total kilograms you lifted in each workout (weight × reps, added up).',
    legendWeight: 'Weight',

    // Duration chart
    durationTitle: 'Workout duration',
    durationSubtitle: 'How long each workout took, by day.',
    legendDuration: 'Duration',

    // Emoji / mood journal
    emojiJournalTitle: 'Mood journal',
    emojiJournalSubtitle:
      'How each workout felt. The big emoji is your overall mood; the small ones show how hard each exercise felt (😴 very easy → 🔥 maximum).',

    // Reps chart
    repsTitle: 'Repetitions each workout',
    repsSubtitle: 'Total reps across all exercises.',
    legendReps: 'Reps',
    unitReps: 'reps',

    // Effort level labels (mirror EFFORT_META)
    effortVeryEasy: 'Very easy',
    effortEasy: 'Easy',
    effortModerate: 'Moderate',
    effortHard: 'Hard',
    effortMaximum: 'Maximum',
  },
  it: {
    // Overall progress chart
    overallProgressTitle: 'Progressi complessivi',
    overallProgressSubtitle:
      'Un punteggio da 0 a 100 per allenamento che combina peso, ripetizioni e sforzo rispetto al tuo migliore. Tocca una barra per i dettagli.',
    legendScore: 'Punteggio',
    legendTrend: 'Andamento',
    showingLastWorkouts: 'Mostra i tuoi ultimi {max} allenamenti ({truncated} precedenti non mostrati)',
    detailScore: 'Punteggio',
    detailWeight: 'Peso',
    detailReps: 'Ripetizioni',
    detailHold: 'Tenuta',
    detailEffort: 'Sforzo',
    detailTime: 'Tempo',
    detailClose: 'Chiudi',
    detailWhatTitle: 'Cosa significa',
    detailExplanation:
      'Il tuo punteggio complessivo è {score} su 100. Combina quanto peso hai sollevato, le ripetizioni e le tenute che hai fatto e quanto è stato intenso l\'allenamento, il tutto rispetto al tuo allenamento migliore di sempre. Più ti avvicini a 100, più ti sei avvicinata al tuo record personale.',
    detailBestNote: '🔥 Questo è stato il tuo allenamento migliore finora!',

    // Effort pie
    effortPieTitle: 'Quanto sono stati intensi i tuoi allenamenti',
    effortPieSubtitle: 'Lo sforzo che hai registrato dopo ogni esercizio.',
    tooltipTimesOne: '{n} volta',
    tooltipTimesMany: '{n} volte',

    // Volume chart
    volumeTitle: 'Peso totale sollevato',
    volumeSubtitle: 'Chilogrammi totali sollevati in ogni allenamento (peso × ripetizioni, sommati).',
    legendWeight: 'Peso',

    // Duration chart
    durationTitle: 'Durata allenamento',
    durationSubtitle: 'Quanto è durato ogni allenamento, per giorno.',
    legendDuration: 'Durata',

    // Emoji / mood journal
    emojiJournalTitle: 'Diario dell\'umore',
    emojiJournalSubtitle:
      'Come ti sei sentita a ogni allenamento. L\'emoji grande è l\'umore generale; le piccole indicano quanto è stato intenso ogni esercizio (😴 molto facile → 🔥 massimo).',

    // Reps chart
    repsTitle: 'Ripetizioni per allenamento',
    repsSubtitle: 'Ripetizioni totali su tutti gli esercizi.',
    legendReps: 'Ripetizioni',
    unitReps: 'rip.',

    // Effort level labels (mirror EFFORT_META)
    effortVeryEasy: 'Molto facile',
    effortEasy: 'Facile',
    effortModerate: 'Moderato',
    effortHard: 'Difficile',
    effortMaximum: 'Massimo',
  },
  fr: {
    // Overall progress chart
    overallProgressTitle: 'Progression globale',
    overallProgressSubtitle:
      'Un score de 0 à 100 par séance combinant poids, répétitions et effort par rapport à votre meilleur. Touchez une barre pour les détails.',
    legendScore: 'Score',
    legendTrend: 'Tendance',
    showingLastWorkouts: 'Affichage de vos {max} dernières séances ({truncated} antérieures non affichées)',
    detailScore: 'Score',
    detailWeight: 'Poids',
    detailReps: 'Répétitions',
    detailHold: 'Maintien',
    detailEffort: 'Effort',
    detailTime: 'Temps',
    detailClose: 'Fermer',
    detailWhatTitle: 'Ce que cela signifie',
    detailExplanation:
      'Votre score global est de {score} sur 100. Il combine le poids soulevé, les répétitions et les maintiens réalisés, et l\'intensité ressentie — le tout comparé à votre meilleure séance. Plus c\'est proche de 100, plus vous étiez proche de votre record personnel.',
    detailBestNote: '🔥 C\'était votre meilleure séance jusqu\'ici !',

    // Effort pie
    effortPieTitle: 'Intensité ressentie de vos séances',
    effortPieSubtitle: 'L\'effort que vous avez enregistré après chaque exercice.',
    tooltipTimesOne: '{n} fois',
    tooltipTimesMany: '{n} fois',

    // Volume chart
    volumeTitle: 'Poids total soulevé',
    volumeSubtitle: 'Kilogrammes totaux soulevés à chaque séance (poids × répétitions, additionnés).',
    legendWeight: 'Poids',

    // Duration chart
    durationTitle: 'Durée de la séance',
    durationSubtitle: 'Combien de temps a duré chaque séance, par jour.',
    legendDuration: 'Durée',

    // Emoji / mood journal
    emojiJournalTitle: 'Journal d\'humeur',
    emojiJournalSubtitle:
      'Le ressenti de chaque séance. Le grand emoji est votre humeur générale ; les petits montrent l\'intensité de chaque exercice (😴 très facile → 🔥 maximum).',

    // Reps chart
    repsTitle: 'Répétitions par séance',
    repsSubtitle: 'Répétitions totales sur tous les exercices.',
    legendReps: 'Répétitions',
    unitReps: 'rép.',

    // Effort level labels (mirror EFFORT_META)
    effortVeryEasy: 'Très facile',
    effortEasy: 'Facile',
    effortModerate: 'Modéré',
    effortHard: 'Difficile',
    effortMaximum: 'Maximum',
  },
};
