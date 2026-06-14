# GymApp - Roadmap

This is the plan for what comes next, in priority order. Modules 1–7 are done
(see `DEVELOPMENT-PLAN.md`). The app is fully working, builds clean, and is a
solid base to grow from.

---

## Priority 1: Four new workout templates ✅ DONE (Jun 2026)

Added templates **B1, B2, C1, C2** from PT-session screenshots, alongside the
original A1, A2, Session 1, Session 2 in "Browse Templates" (8 total).

- 20 new exercises added (library now 77, IDs 58–77).
- Templates live in `src/utils/storage.ts` (`getWorkoutTemplates`).
- Time/distance exercises use the reps field for their value (e.g. a 40-second
  plank = 40 "reps", a 50 m farmers walk = 50). Weights are not stored on
  templates — the Smart Weight Pre-fill fills them from your history/defaults.

---

## Priority 2: Dark mode 🌙

**Goal:** A dark theme that's easier on the eyes in the gym, with a toggle.

**Approach (plain language):** Add a light/dark switch (probably on the Home or
a small Settings area). The choice is remembered on your device. The app's
colors are defined in `src/index.css` — dark mode means defining a second set
of colors and switching between them.

**How I'll build it:**
1. Convert the fixed colors in `src/index.css` to CSS variables (theme tokens).
2. Add a `dark` theme variant of those variables.
3. Add a toggle that sets the theme and saves the preference to localStorage
   (default could follow the phone's system setting).

**Files touched:** `src/index.css`, a small toggle in `src/components/Layout.tsx`
(or a new Settings spot), `src/utils/storage.ts` (save preference).

---

## Later / Parked ideas

Not planned now, but noted so we don't lose them. Margherita reviewed these and
chose to defer them:

- **Bodyweight & body measurements tracking** (with charts)
- **Calendar view & streaks** for consistency motivation
- **Supersets / circuit grouping** with a shared timer (true circuit training)
- **Smarter analytics** — total volume, estimated 1-rep-max, muscle-group balance
- **Reorder exercises** in a template by dragging
- **Plate calculator** for barbell loading
- **Exercise instructions / images**

## Known technical notes (not user-facing)

- **Data lives only in the browser** (localStorage). Decision: leave as is for
  now; manual Export/Import on the Home screen is the backup. Revisit if data
  loss ever becomes a real worry.
- **Bundle size ~640 KB** — works fine, but could be code-split later if load
  time ever matters.
