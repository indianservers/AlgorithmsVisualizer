# AlgorithmsVisualizer

Interactive algorithm visualization app built with React, TypeScript, Vite, Vitest, and Playwright.

This README is written as a re-entry guide for Codex/future maintainers: read it before changing the project so you know where the real behavior lives.

## Run

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run test:visual
npm run check
```

On this Windows machine, Node may exist at `C:\Program Files\nodejs` without being on `PATH`. If `npm` or `node` is not recognized, run PowerShell commands with:

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
```

## Mental Model

The app is a single React workspace for learning algorithms. A route chooses an algorithm module, the module runner converts input into an ordered list of `AlgorithmStep` objects, and the UI renders the current step as bars, matrix cells, tree nodes, or graph nodes.

Core flow:

1. `src/main.tsx` mounts the app inside `HashRouter`.
2. `src/utils/routing.ts` resolves `/:categorySlug/:algorithmSlug` into an `AlgorithmModule`.
3. `src/App.tsx` owns global UI state, persisted preferences, input parsing, selected algorithm, playback index, exports, local saves, and compare mode.
4. `activeModule.runner(input, target)` returns the timeline used by controls, metrics, pseudocode, code highlighting, visual state, and CSV/JSON exports.
5. `src/components/Visualizer.tsx`, `RightPanel.tsx`, `CompareView.tsx`, and `BottomPanel.tsx` render the learner experience.

## Important Files

- `src/types.ts` defines the project contracts: `AlgorithmModule`, `AlgorithmStep`, categories, saved experiments, learning tabs, and animation quality.
- `src/algorithms/index.ts` is the algorithm catalog and runner hub. Most algorithm behavior is here.
- `src/data/catalog.ts` defines category pages, slugs, accents, titles, and page section names.
- `src/App.tsx` is the orchestration layer. It is large by design and passes computed state into smaller components.
- `src/components/Visualizer.tsx` renders input controls, picker filters, array/matrix visualizations, and delegates tree/graph views to `TraversalWorkbench`.
- `src/components/RightPanel.tsx` renders study, simulation, code, quiz, and experiment learning panels.
- `src/components/CompareView.tsx` compares selected sorting/searching algorithms on the same input.
- `src/storage/db.ts` stores saved experiments in IndexedDB through Dexie.
- `src/exports/index.ts` owns CSV, JSON helper integration, SVG frame export, and PNG frame export.
- `src/guides/index.ts` derives learning text, pseudocode/code active lines, quiz prompts, traps, and comparisons.
- `src/hooks/usePersistentState.ts` wraps `localStorage` persistence.
- `src/utils/input.ts`, `src/utils/routing.ts`, and `src/utils/validation.ts` contain parsing, route resolution, and run precondition logic.

## Data Contracts

`AlgorithmModule` is the catalog item. Important fields:

- `id`: route slug and durable identifier.
- `category`: one of the categories from `src/types.ts`.
- `status`: `live` or `planned`.
- `visualMode`: `Array`, `Tree`, `Graph`, or `Matrix`.
- `complexity`, `flags`, `pseudocode`, and `code`: rendered in the learning UI.
- `runner`: optional function returning `AlgorithmStep[]`; missing or planned modules are shown as coming soon.

`AlgorithmStep` is the animation unit. Important fields:

- `type`: `compare`, `swap`, `select`, `visit`, `partition`, `merge`, `update`, `hash`, or `complete`.
- `dataState`: the visual state for this frame.
- `beforeState` and `afterState`: used by before/after comparison.
- `highlights.indices`, `highlights.nodes`, `highlights.edges`, `highlights.variables`: drive visual emphasis and pointer labels.
- `metrics`: comparisons, swaps, reads, writes, recursive calls, and memory.
- `pseudocodeLine` and `codeLine`: active line hints for the learning panel.

Most runners use the internal `makeStep(...)` helper in `src/algorithms/index.ts`, which fills IDs, reasons, default line maps, assertions, state copies, and metric defaults.

## Algorithm Catalog

Live hand-authored runners include:

- Searching: linear search, sentinel linear search, recursive linear search, binary search, recursive binary search, lower/upper bound, first/last occurrence, search insert position, rotated sorted array search, and peak element search.
- Sorting: bubble, selection, insertion, binary insertion, merge, quick, heap, counting, radix, shell, cocktail shaker, comb, and gnome sort.
- Data structures and traversal: stack, queue, tree traversals, BFS, DFS, and many educational suite demos.

`missingKitModules` in `src/algorithms/index.ts` contains broad live demo modules for linked lists, hash tables, BSTs, heaps, tries, DSU, range trees, strings, DP, backtracking, memory, and learning tools. These are useful scaffold/demo modules, but many are simplified visual suites rather than full textbook implementations.

`plannedModules` currently exists but is empty.

## UI Behavior

`App.tsx` stores many settings in `localStorage` with the `algodrishti-*` prefix: last algorithm, input, target, data mode, speed, theme, density, classroom mode, sidebar state, panel width, reduced motion, visual toggles, favorites, recents, notes, completion, quiz scores, and review due dates.

Playback is controlled by `stepIndex`, `playing`, `speed`, and `pauseOn`. The run is capped by `MAX_VISUAL_STEPS = 1000` in `App.tsx`.

Input is numeric. `parseInput` accepts JSON arrays or comma/whitespace-separated numbers. Visual input is clipped to 48 numbers. Graph/tree modules use fixed demo structures or presets rather than full custom graph editing.

Run validation happens in `runDisabledReason(...)`:

- non-live/missing runner modules cannot run;
- array/matrix modules need at least one numeric input;
- modules flagged `Requires sorted input` need sorted input;
- counting/radix sort reject negative values.

## Routing

Routes are hash-based:

- `/`
- `/:categorySlug`
- `/:categorySlug/:algorithmSlug`
- fallback route

`algorithmPath(module)` builds URLs from `categoryPages[module.category].slug` plus `module.id`. Unknown routes render `RouteFallback` using the last selected algorithm or `bubble-sort`.

## Persistence and Exports

Saved experiments are stored locally in IndexedDB database `algodrishti-local`, table `experiments`, indexed by `id`, `algorithmId`, and `createdAt`.

Exports supported from the UI:

- step CSV via `buildStepLogCsv`;
- compare CSV in `App.tsx`;
- JSON report in `App.tsx`;
- SVG/PNG current frame via `src/exports/index.ts`;
- file input loading through the Browser File API.

## Testing

Quality gates:

- ESLint: `npm run lint`
- Unit tests: `npm test`
- Build: `npm run build`
- Bundle budget: `npm run test:budget`
- Full check: `npm run check`
- Visual regression: `npm run test:visual`

Current test areas include algorithm correctness/behavior, routing, persistence helpers, runner controller behavior, and Playwright visual screenshots.

## Change Notes For Codex

When adding a new algorithm:

1. Add or reuse a runner in `src/algorithms/index.ts`.
2. Return `AlgorithmStep[]` with meaningful `type`, `dataState`, `highlights`, and metrics.
3. Add an `AlgorithmModule` entry with category, complexity, flags, pseudocode, code, visual mode, and runner.
4. If it introduces a new category or route family, update `src/types.ts`, `src/data/catalog.ts`, route tests, and navigation expectations.
5. Add focused Vitest coverage in `src/algorithms/algorithms.test.ts`.

When changing UI state:

- Check whether the state should persist through `usePersistentState`.
- Keep localStorage keys stable unless intentionally migrating user data.
- Watch `App.tsx` prop chains; a small UI change may require touching a component prop type.

When changing visual rendering:

- Verify array, matrix, graph, and tree modes if shared visual code changed.
- Respect reduced motion and `animationQuality`.
- Run Playwright visual tests when layout, color, or screenshot-sensitive rendering changes.

When changing input or validation:

- Update `src/utils/input.ts` or `src/utils/validation.ts`.
- Recheck sorted-input algorithms, empty input, duplicates, negative values, and 48-item clipping.
- Add/update tests for edge cases.

## Known Rough Edges

- `App.tsx` is the main orchestrator and is intentionally broad; extracting state should be done carefully because many props are coupled.
- Several educational modules are scaffold-style demos, not full custom data-structure editors.
- `runnerController.ts` provides async cancellation helpers, but the current app mostly runs algorithms synchronously through `activeModule.runner`.
- Some displayed symbols/text may show mojibake from earlier encoding issues; inspect rendered UI before doing copy edits.
