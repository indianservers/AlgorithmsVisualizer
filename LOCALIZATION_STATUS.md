# Localization status

Default: **English (India), en-IN**. No browser/IP language detection. Source English wording, algorithm code, numeric data and routes are preserved.

## Inventory

- Discovered routes: **430** (home, directory, categories, visualizations, and Learn articles).
- Routes with migrated presentation bindings: **430**.
- Routes fully translated in every target language: **0**.
- Routes partially translated in non-English languages: **430**.
- Source namespace keys: **12211**, from **197** source files.
- React render files migrated: **97**, with **3115** presentation bindings.
- English keys are extracted from actual source, including metadata and native account UI.

## Translation coverage

English fallback is never counted as a completed translation. Target resources are sparse by design: absence means a safe source-English fallback, not fabricated translated coverage. Percentages below count populated non-English values, not native-speaker certification. All supplied target-language drafts require native review before they can be considered linguistically approved. Technical terms may intentionally remain English.

| Locale | Populated translations | Source coverage | English fallbacks | Awaiting native review |
| --- | ---: | ---: | ---: | ---: |
| en-IN | 12211 | 100% | 0 | 0 |
| hi | 707 | 5.79% | 11504 | 707 |
| te | 707 | 5.79% | 11504 | 707 |
| ta | 463 | 3.79% | 11748 | 463 |
| kn | 463 | 3.79% | 11748 | 463 |
| ml | 463 | 3.79% | 11748 | 463 |
| mr | 463 | 3.79% | 11748 | 463 |
| bn | 463 | 3.79% | 11748 | 463 |
| gu | 463 | 3.79% | 11748 | 463 |
| pa | 463 | 3.79% | 11748 | 463 |
| or | 463 | 3.79% | 11748 | 463 |
| as | 463 | 3.79% | 11748 | 463 |
| ur | 497 | 4.07% | 11714 | 497 |
| ru | 707 | 5.79% | 11504 | 707 |
| fr | 457 | 3.74% | 11754 | 457 |
| de | 493 | 4.04% | 11718 | 493 |
| es | 463 | 3.79% | 11748 | 463 |
| pt | 463 | 3.79% | 11748 | 463 |
| it | 463 | 3.79% | 11748 | 463 |
| nl | 459 | 3.76% | 11752 | 459 |
| pl | 463 | 3.79% | 11748 | 463 |
| uk | 463 | 3.79% | 11748 | 463 |
| ro | 463 | 3.79% | 11748 | 463 |
| el | 463 | 3.79% | 11748 | 463 |
| cs | 463 | 3.79% | 11748 | 463 |
| sv | 463 | 3.79% | 11748 | 463 |
| fi | 463 | 3.79% | 11748 | 463 |
| hu | 463 | 3.79% | 11748 | 463 |
| sw | 463 | 3.79% | 11748 | 463 |
| am | 463 | 3.79% | 11748 | 463 |
| ha | 460 | 3.77% | 11751 | 460 |
| yo | 460 | 3.77% | 11751 | 460 |
| ig | 460 | 3.77% | 11751 | 460 |
| zu | 463 | 3.79% | 11748 | 463 |
| xh | 463 | 3.79% | 11748 | 463 |
| af | 463 | 3.79% | 11748 | 463 |
| so | 460 | 3.77% | 11751 | 460 |
| ar | 499 | 4.09% | 11712 | 499 |
| tr | 463 | 3.79% | 11748 | 463 |
| id | 461 | 3.78% | 11750 | 461 |
| vi | 463 | 3.79% | 11748 | 463 |

## Missing keys and review queue

See [coverage.json](docs/localization/coverage.json) for every missing key by locale and namespace; [source-inventory.json](docs/localization/source-inventory.json) maps keys back to exact source text, file and line. [migration.json](docs/localization/migration.json) lists render bindings. Target dictionaries currently concentrate on shared controls/navigation, with broader Hindi, Telugu and Russian coverage. They do **not** represent complete Phase 1 translation of all descriptions, errors, tooltips or studio copy.

## Remaining Phase 1 work

Complete and linguistically review the missing short UI strings, algorithm descriptions, native authentication feedback, and dynamic templates for all target locales. Preserve placeholders. Review terminology in every target language, especially technical usage in languages with multiple conventions. Dynamic strings not represented by a reviewed template safely remain English. No missing key is displayed to the user.

## Phase 2

Reviewed long-form encyclopedia articles, proofs, worked examples, detailed execution explanations and additional assessment material. Do not translate executable source, formulas, variable identifiers, user data or datasets. The explicit exclusion policy is in src/i18n/exclusions.json.

## Verification

Run npm run i18n:check for locale/schema/placeholder/obsolete-key validation and coverage generation. npm run i18n:generate re-extracts source English and synchronizes static resources. npm run i18n:scan finds unbound JSX text and translatable attributes. Functional and visual test results are recorded in docs/localization/TEST_RESULTS.md after execution.
