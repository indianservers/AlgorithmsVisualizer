# Site discovery and multilingual sitemap

The home page ends with a compact topic map: 11px on desktop, 12px on phones, with expandable category groups. All catalog algorithms have an ordinary anchor to their visualization, their original purpose/summary, and an anchor to the detailed theory page. The same visible markup is included in the generated home HTML, not injected only for crawlers.

## Published resources

- `/sitemap`: full English (India) HTML directory.
- `/sitemap/hi`, `/sitemap/te`, `/sitemap/ru`, `/sitemap/ar`, `/sitemap/de`: localized directory headings, navigation and category descriptions. Individual algorithm descriptions retain exact English where a translation is missing. HTML `lang` attributes and JSON language fields identify the fallback; technical algorithm names may remain English.
- `/sitemap.xml`: all 395 canonical HTML URLs, including the six real directory variants. Reciprocal `hreflang` annotations apply only to those directory pages. No nonexistent translated algorithm URLs are advertised.
- `/sitemap.json`: English machine-readable catalog; `/sitemaps/<locale>.json` provides each directory language with stable identifiers, purpose descriptions, theory and visualization URLs, complexity, and per-field language tags.
- `/llms.txt`: linked reading guide for AI agents; `/sitemaps/<locale>.txt` provides language-specific versions.
- `/robots.txt`: advertises the XML sitemap and retains the existing crawl policy.

Full directory documents are generated as readable static HTML, including self-canonical metadata, reciprocal language alternates and `CollectionPage`/`ItemList` JSON-LD. They do not require the application JavaScript bundle. Selecting a directory language also preserves that explicit preference when returning to the interactive application with JavaScript enabled.

The catalog is derived from `allModules`, category metadata and existing route helpers. Add new lessons to the normal application catalog; do not maintain a separate SEO-only list. Regenerate resources with `npm run i18n:generate` before building. The build regenerates HTML, XML, JSON and text from the same catalog. Sitemap-specific translation drafts live in `scripts/i18n/sitemap-translations.json` and merge into the existing six-namespace translation resources; they require the same native review as other target-language drafts.

## Validation

`npm run check` covers catalog completeness, original descriptions, canonical links, resource validation, localization and the production build. `tests/visual/sitemap.spec.ts` checks the compact footer, mobile sizing, language changes, no-JavaScript localized pages and machine-readable endpoints. Existing home, localization and encyclopedia browser tests also exercise shared behavior.

The XML follows the [Sitemaps protocol](https://www.sitemaps.org/protocol.html). Localized directory alternates follow [Google Search Central guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). Descriptions belong to the HTML, structured data and JSON/text catalogs; they are not added as unsupported XML sitemap elements.

### Executed verification

Production build, TypeScript, ESLint, translation/resource validation, all 568 unit tests and the 23 JavaScript chunk budgets passed. Across the production-browser runs, all 32 distinct home, sitemap, encyclopedia and localization cases passed on desktop/mobile after the home assertion and tablet header fixes. All six directory languages were read with JavaScript disabled; XML parsed successfully, catalog counts matched the live algorithm catalog, and English fallback fields retained language tags. Desktop compact-footer and Arabic phone screenshots are saved in `artifacts/`.
