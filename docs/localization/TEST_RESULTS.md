# Localization verification

Environment: Windows, Node.js, Chromium, 21 October 2026.

## Automated checks

- `npm run check`: passed ESLint, resource/schema/placeholder validation, literal JSX scanner, 565 unit tests in 20 files, TypeScript build, production bundling, 388 generated HTML pages plus root, and all 22 JavaScript chunk budgets (256,000 bytes per chunk).
- `npm run i18n:check`: passed after the final inventory refresh; 41 locales, six namespaces, 5,783 source keys, 389 catalog-derived routes. Reports missing entries explicitly and rejects malformed/obsolete/placeholder-corrupt entries.
- Localization unit contracts cover default/unsupported locale handling, exact English and object identity, source fallback, cross-namespace metadata, persistence, local asset caching, dynamic interpolation, Russian plural forms and RTL document direction.
- Five development-browser tests passed, including representative pages from all 17 algorithm categories. The final production localization run passed all 12 checks (six on desktop and six on mobile) in the final production run, including actual English-to-Telugu switching on every category. All 32 existing production regression checks selected for this change also passed: encyclopedia, fitted characters, optional login, mobile defaults, problem input and sorting/searching studio. Earlier runs exposed mobile header overlaps and an RTL timeline issue; these were fixed before the final localization run. One earlier regression run was invalidated by rebuilding its served assets; the stable rerun passed those existing checks.

## Visual inspection

Inspected production screenshots of selection sort in English (desktop), Telugu (tablet), Arabic (phone), and Russian (phone). Confirmed readable script rendering on this Windows installation, wrapping controls, no document-level horizontal overflow, unchanged code/data and LTR chart ordering. Fixed an RTL timeline-direction issue and a workshop header menu/selector overlap discovered during testing. The Strings header, preset buttons, tab row, input fields and legend now accommodate longer labels. A dedicated fresh-visit test checks this standalone page in Telugu, Russian, Arabic and English.

## Scope and limits

The registered locales are supported by the engine, not fully translated or linguistically certified. Target dictionaries contain drafts and sparse shared UI coverage; unreviewed/missing technical explanations remain the exact English source. See `LOCALIZATION_STATUS.md` and `coverage.json`. Native-speaker review, complete Phase 1 target copy and cross-platform font inspection remain outstanding. Do not interpret passing functionality tests as linguistic approval.

No algorithm implementation, kernel or numeric calculation files were changed. Browser checks compare route, dataset, array order, timeline position and rendered source code before and after language changes; they also check saved language restoration, invalid/cleared storage, missing fallbacks, same-origin lazy assets, keyboard operation, RTL and native account dialogs.
