# Localization status

Default: **English (India), en-IN**. No browser/IP language detection. Source English wording, algorithm code, numeric data and routes are preserved.

## Inventory

- Discovered routes: **389** (home, directory, categories, visualizations, and Learn articles).
- Routes with migrated presentation bindings: **389**.
- Routes fully translated in every target language: **0**.
- Routes partially translated in non-English languages: **389**.
- Source namespace keys: **5783**, from **101** source files.
- React render files migrated: **51**, with **2992** presentation bindings.
- English keys are extracted from actual source, including metadata and native account UI.

## Translation coverage

English fallback is never counted as a completed translation. Target resources are sparse by design: absence means a safe source-English fallback, not fabricated translated coverage. Percentages below count populated non-English values, not native-speaker certification. All supplied target-language drafts require native review before they can be considered linguistically approved. Technical terms may intentionally remain English.

| Locale | Populated translations | Source coverage | English fallbacks | Awaiting native review |
| --- | ---: | ---: | ---: | ---: |
| en-IN | 5783 | 100% | 0 | 0 |
| hi | 340 | 5.88% | 5443 | 340 |
| te | 340 | 5.88% | 5443 | 340 |
| ta | 52 | 0.9% | 5731 | 52 |
| kn | 52 | 0.9% | 5731 | 52 |
| ml | 52 | 0.9% | 5731 | 52 |
| mr | 52 | 0.9% | 5731 | 52 |
| bn | 52 | 0.9% | 5731 | 52 |
| gu | 52 | 0.9% | 5731 | 52 |
| pa | 52 | 0.9% | 5731 | 52 |
| or | 52 | 0.9% | 5731 | 52 |
| as | 52 | 0.9% | 5731 | 52 |
| ur | 78 | 1.35% | 5705 | 78 |
| ru | 340 | 5.88% | 5443 | 340 |
| fr | 46 | 0.8% | 5737 | 46 |
| de | 74 | 1.28% | 5709 | 74 |
| es | 52 | 0.9% | 5731 | 52 |
| pt | 52 | 0.9% | 5731 | 52 |
| it | 52 | 0.9% | 5731 | 52 |
| nl | 48 | 0.83% | 5735 | 48 |
| pl | 52 | 0.9% | 5731 | 52 |
| uk | 52 | 0.9% | 5731 | 52 |
| ro | 52 | 0.9% | 5731 | 52 |
| el | 52 | 0.9% | 5731 | 52 |
| cs | 52 | 0.9% | 5731 | 52 |
| sv | 52 | 0.9% | 5731 | 52 |
| fi | 52 | 0.9% | 5731 | 52 |
| hu | 52 | 0.9% | 5731 | 52 |
| sw | 52 | 0.9% | 5731 | 52 |
| am | 52 | 0.9% | 5731 | 52 |
| ha | 49 | 0.85% | 5734 | 49 |
| yo | 49 | 0.85% | 5734 | 49 |
| ig | 49 | 0.85% | 5734 | 49 |
| zu | 52 | 0.9% | 5731 | 52 |
| xh | 52 | 0.9% | 5731 | 52 |
| af | 52 | 0.9% | 5731 | 52 |
| so | 49 | 0.85% | 5734 | 49 |
| ar | 80 | 1.38% | 5703 | 80 |
| tr | 52 | 0.9% | 5731 | 52 |
| id | 50 | 0.86% | 5733 | 50 |
| vi | 52 | 0.9% | 5731 | 52 |

## Missing keys and review queue

See [coverage.json](docs/localization/coverage.json) for every missing key by locale and namespace; [source-inventory.json](docs/localization/source-inventory.json) maps keys back to exact source text, file and line. [migration.json](docs/localization/migration.json) lists render bindings. Target dictionaries currently concentrate on shared controls/navigation, with broader Hindi, Telugu and Russian coverage. They do **not** represent complete Phase 1 translation of all descriptions, errors, tooltips or studio copy.

## Remaining Phase 1 work

Complete and linguistically review the missing short UI strings, algorithm descriptions, native authentication feedback, and dynamic templates for all target locales. Preserve placeholders. Review terminology in every target language, especially technical usage in languages with multiple conventions. Dynamic strings not represented by a reviewed template safely remain English. No missing key is displayed to the user.

## Phase 2

Reviewed long-form encyclopedia articles, proofs, worked examples, detailed execution explanations and additional assessment material. Do not translate executable source, formulas, variable identifiers, user data or datasets. The explicit exclusion policy is in src/i18n/exclusions.json.

## Verification

Run npm run i18n:check for locale/schema/placeholder/obsolete-key validation and coverage generation. npm run i18n:generate re-extracts source English and synchronizes static resources. npm run i18n:scan finds unbound JSX text and translatable attributes. Functional and visual test results are recorded in docs/localization/TEST_RESULTS.md after execution.
