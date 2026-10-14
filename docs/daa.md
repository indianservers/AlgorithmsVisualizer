# DAA learning track

Open `/#/daa/syllabus-dashboard` or choose **DAA Syllabus** in the sidebar. This release adds 78 dedicated DAA lessons: 56 computed algorithm pages and 22 theory pages. Every legacy catalog page now exposes DAA material in Learn, using algorithm-specific profiles and clearly scoped category foundations. Sorting and searching have individual explanations; suites link to their dedicated lessons. Original URLs and saved experiments remain available.

## Mobile-first tabs

All algorithm workspaces use Learn, Visualization, Code, Practice and Experiments. Theory-only pages expose Learn and Practice. Learn contains problem definitions, worked examples, correctness arguments and complexity derivations; Visualization contains inputs and the current trace; Code contains implementations and pseudocode; Practice contains reasoning questions and next-step predictions; Experiments contains saved-run workflows. Legacy theory is no longer hidden in a standalone accordion. Switching tabs preserves the current input and playback position.

The base layout stacks panels on phones, expands input/cards at 700 px and enables the wider two-column visualization at 1280 px. Navigation uses a closed, inert drawer at widths up to 1120 px; desktop navigation remains exposed to assistive technology. The mobile header scrolls with the document to avoid covering lesson content. Tables/code scroll within their own containers where necessary, and syllabus tables become topic cards on phones. Shared mobile rules live in src/mobile-first.css; legacy DAA content lives in src/guides/daaTheory.ts. Illustrative suites remain partial regardless of the richer explanations.

## Learning and visualization

The core track covers analysis, recurrence methods, correctness, divide and conquer, greedy design, graph algorithms, dynamic programming, backtracking, branch and bound, string matching and computational complexity. Extensions cover flows/matching, lowlink algorithms, Eulerian trails, geometry, multiplication, randomization, approximation, suffix arrays, reliability design, FFT, packing and LP introduction.

Each computed lesson has editable JSON input, validated limits, step/previous/next/playback controls, pseudocode highlighting, computed results, readable source, correctness reasoning, a complexity derivation and an exercise. Graphs use weighted edge objects; strings have text/pattern or left/right fields; optimization inputs name weights, profits and budgets. Vertex/item indices are zero-based, while selection rank k is one-based. String algorithms index UTF-16 code units.

`AlgorithmModule.typedRunner` and `AlgorithmStep.state` extend the existing contracts without changing legacy runners. `DaaInput` is validated against each lesson's required example fields and algorithm preconditions. Specialized lesson rendering handles typed inputs independently of the legacy numeric-array visualizer.

`Trace` deep-copies each state. Tables retain labels, graphs retain edge weights and computed labels, and search nodes retain IDs, parent IDs and bounds. A search snapshot keeps the latest 128 nodes to bound memory; the UI displays the latest 80. The combined recorded frames preserve successive search nodes until the timeline limit.

The timeline limit is 1,000 frames. Computing the result continues within the bounded input domain, but a capped trace is explicitly **truncated**, with no terminal completion event. Algorithm complexity excludes snapshot storage, rendering and trace generation; pedagogical implementations disclose extra edge-list filtering, repeated sorting and copied-partition costs. The displayed event counter is not a comparison count.

## Persistence and export

DAA experiments are stored under `algodrishti-daa-experiments` in localStorage. They contain the typed input, result, status and full recorded timeline. Keep at most ten experiments and a one-million-character serialized budget; failed/quota-exceeding writes produce feedback and suggest JSON export. Existing Dexie experiments and their schema are unchanged.

Learner completion uses the existing `algodrishti-completed` preference. It never changes syllabus coverage. JSON exports include a version, lesson ID, input, results, timeline and completion/truncation status. DAA CSV exports retain structured state as a quoted JSON column; the common legacy CSV exporter also supports this state column.

## Syllabus evidence and limits

Mappings are checked against the following official source outlines on 14 October 2026:

- [IIT Patna CS5101, Autumn 2026](https://www.iitp.ac.in/~arijit/web/index.php?id=courses/2026/2026_CS5101)
- [IIIT Allahabad DAA, January–May 2022](https://profile.iiita.ac.in/srdubey/teaching/daa2022/)
- [JNTUH UCESTH MC341, MCA R22, effective 2022–23](https://jntuhceh.ac.in/uploads/syllabus/MCA_Syllabus_Department_of_Information_Technology.pdf#page=27)
- [MIT 6.046J outcomes, Spring 2015](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/syllabus/)
- [Duke COMPSCI 330 description/objectives, Spring 2025](https://sites.duke.edu/spring25compsci330/)

These are versioned outline mappings, not promises to reproduce every lecture, assignment or a university's current regulation. JNTUH is an MCA comparison, not a B.Tech baseline. Its greedy-unit 0/1-knapsack wording is linked to an explicit explanation of why general indivisible knapsack is not solved by ratio-greedy.

A topic is **complete** only when all referenced modules have reviewed authored lesson coverage and there is no declared limitation. Existing illustrative suites remain **partial**, even when runnable. No mapped page means **missing**. Topic-specific scope limits override a module's complete status.

The dashboard intentionally retains partial/missing outcomes for advanced prerequisites, hashing and balanced-tree demos, competitive analysis, parallelization, empirical benchmark depth, PTAS/FPTAS construction, and general LP solving/duality. Boyer–Moore implements the bad-character variant; suffix-array construction is direct sorting; reliability assumes independent parallel copies in a series system. The FFT is a forward radix-2 transform with floating-point arithmetic. Randomization uses a reproducible classroom LCG, with expected bounds explicitly stated under the ideal random-pivot model.

## Maintaining the track

Lesson metadata and authored prose live in `src/daa/catalog.ts`; runner families are separate modules in the same folder. `src/daa/syllabi.ts` contains source/topic mappings and suite links. The new workspace renders dedicated lessons and the dashboard. The old visualizer retains its own implementation and gains links from suite overviews.

Add algorithms with correctness reasoning, explicit input limits, derivations matching the actual implementation, known-result examples and meaningful reference/exhaustive tests. Do not equate a module's live status with coverage. Keep the production chunk budget intact; readable TypeScript source is embedded for implementation tabs and must remain available after minification.

Validation commands:

```powershell
npm run check
npm run test:visual
# After building, verify the same tests against the production preview:
$env:DAA_TEST_PRODUCTION = '1'
npm run test:visual
```

Tests include exhaustive knapsack/TSP comparisons, duplicate selection ranks, negative/unreachable graph states, cycle detection, DP reconstruction, impossible constraints, overlapping/empty string matches, FFT versus DFT, approximation preconditions, typed validation, immutable/truncated traces, syllabus-link integrity, desktop/mobile flows, local persistence and visual snapshots.
