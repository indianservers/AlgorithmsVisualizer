# Maintaining localization

The application uses i18next/react-i18next in the existing React tree. English (India), `en-IN`, remains the literal source of truth. No browser/IP detector or runtime translation service is installed.

## Adding a page or message

1. Keep the existing English wording in the component/metadata. Import `tx` and `useLocaleRender` from `src/i18n/render`; subscribe once per component with `useLocaleRender()` and wrap only displayed human-readable text with `tx(source, namespace)`. Namespaces are `common`, `navigation`, `studios`, `algorithms`, `controls`, and `messages`.
2. Never wrap dataset values, user text/profile information, executable code, identifiers, CSS, SVG geometry, event handlers, URLs, or stored state. Translate display labels, never the values used for routing, comparisons or simulation calculations. Protected tags and terminology are listed in `src/i18n/exclusions.json`.
3. Run `npm run i18n:generate`. The AST audit extracts current source text and locations, creates deterministic source-hash keys and synchronizes `src/i18n/locales` to `public/locales`. This command preserves existing target entries. `scripts/i18n/migrate.mjs` is a one-time migration aid, not a substitute for reviewing new component bindings.
4. Find the exact source/key in `docs/localization/source-inventory.json` or `src/i18n/locales/en-IN/<namespace>.json`. Add reviewed text to the corresponding target JSON. Omit uncertain entries: missing entries fall back to the exact English source, never a hash or invented wording. `seed-translations.json` holds initial drafts; changing a draft already generated requires updating its target resource too.
5. Preserve every interpolation placeholder and markup. Extracted template literals use `{{value0}}`, `{{value1}}`, etc. The renderer matches their source segments and passes captured values unchanged to i18next. For count templates, supply locale-appropriate i18next plural suffixes (`_one`, `_few`, `_many`, `_other`, etc.). Do not join separately translated fragments to construct grammatical sentences in new code.
6. Run `npm run i18n:check`, `npm run check`, and the localization browser suite. Review long labels on small screens, keyboard interaction, RTL direction and state preservation. The JSX scanner catches literal text/attributes; metadata, dynamic expressions and technical context still require the generated inventory and human review.

## Adding a locale

Register `[code, nativeName, englishName, region]` in `src/i18n/languages.json`, create six target namespace objects and run generation/validation. The selector renders this configuration; it never requires a second page implementation. Update the explicit RTL language rule in `languages.ts` when adding another RTL locale. No language-specific URL changes are introduced.

## Runtime behavior

A first visit renders exact English without fetching translation JSON. Selection loads only the current route's required namespaces from same-origin static `/locales/` assets, caches bundles, and re-renders existing components without remounting simulations. Failed requests retain the active language and show a retry message. Only an explicit choice is stored under `algodrishti-language`; unsupported saved codes reset to `en-IN`. Technical/math/code views stay LTR inside Arabic/Urdu document layouts.

System script font fallbacks avoid additional font downloads. Glyph coverage ultimately depends on installed platform fonts; inspect the required scripts on supported devices before certifying typography. No target dictionary has native-speaker approval yet. `LOCALIZATION_STATUS.md` distinguishes populated draft entries, English fallbacks and the outstanding review queue.

## Reports

- `source-inventory.json`: exact discovered source text, namespace, key and source locations, with exclusions.
- `migration.json`: migrated component binding/subscription counts.
- `coverage.json`: missing keys per locale/namespace, route namespace dependencies and per-route locale coverage for those dependencies. Route coverage is a dependency inventory, not a claim that every sentence has a reviewed translation.
- `LOCALIZATION_STATUS.md`: generated completion summary and remaining Phase 1/Phase 2 work.
- `TEST_RESULTS.md`: executed verification results and limitations.

The native account shell is not React; its narrowly scoped adapter localizes only account UI text and accessible labels while protecting personal data. It does not rewrite the React application DOM.
