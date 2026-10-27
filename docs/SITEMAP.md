# Site discovery and multilingual sitemap

The home page ends with a compact topic map: 11px on desktop, 12px on phones, with expandable category groups. All catalog algorithms have an ordinary anchor to their visualization, their original purpose/summary, and an anchor to the detailed theory page. The same visible markup is included in the generated home HTML, not injected only for crawlers.

## Published resources

- `/sitemap`: full English (India) HTML directory.
- `/sitemap/<locale>`: directories for all 40 non-English languages configured in `src/i18n/languages.json`, plus the default English directory (41 total). Headings, navigation, category descriptions and all 185 algorithm summaries have local translations. Technical algorithm names and identifiers may retain their established English spelling. Arabic and Urdu use right-to-left page layout.
- `/sitemap.xml`: all 430 canonical HTML URLs, including the 41 directory variants. Each directory has 41 reciprocal language alternates and an `x-default` alternate. Existing algorithm URLs remain canonical destinations.
- `/sitemap.json`: English machine-readable catalog; `/sitemaps/<locale>.json` provides each directory language with stable identifiers, purpose descriptions, theory and visualization URLs, complexity, and per-field language tags.
- `/llms.txt`: linked reading guide for AI agents; `/sitemaps/<locale>.txt` provides language-specific versions.
- `/robots.txt`: advertises the XML sitemap and retains the existing crawl policy.

Full directory documents are generated as readable static HTML, including self-canonical metadata, reciprocal language alternates and `CollectionPage`/`ItemList` JSON-LD. They do not require the application JavaScript bundle. Selecting a directory language also preserves that explicit preference when returning to the interactive application with JavaScript enabled.

The catalog is derived from `allModules`, category metadata and existing route helpers. Add new lessons to the normal application catalog; do not maintain a separate SEO-only list. Regenerate resources with `npm run i18n:generate` before building. The build regenerates HTML, XML, JSON and text from the same catalog. Sitemap translations live in `scripts/i18n/sitemap-translations.json` and merge into the existing six-namespace translation resources. The build rejects missing or unchanged English descriptions in every non-English directory. Catalog text is explicitly extracted into a namespace loaded by the homepage, including computed descriptions excluded by the general code-string heuristic.

The 7,400 non-English algorithm-summary entries were machine-translated with Google Translate during maintenance, with targeted technical corrections. They are checked-in text; visitors never call a translation service. Native-speaker review of these technical translations is still outstanding. `python scripts/i18n/translate-sitemap.py` resumes generation for missing source strings; existing curated translations are retained. Review and edit the seed file before running resource generation. Full encyclopedia article translation is a separate scope; the translated sitemap links to the existing theory routes.

## Validation

`npm run check` covers catalog completeness, original descriptions, canonical links, resource validation, localization and the production build. `tests/visual/sitemap.spec.ts` checks the compact footer, mobile sizing, language changes, no-JavaScript localized pages and machine-readable endpoints. Existing home, localization and encyclopedia browser tests also exercise shared behavior.

The XML follows the [Sitemaps protocol](https://www.sitemaps.org/protocol.html). Localized directory alternates follow [Google Search Central guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). Descriptions belong to the HTML, structured data and JSON/text catalogs; they are not added as unsupported XML sitemap elements.

### Executed verification

Earlier six-language release: 568 unit tests and 32 desktop/mobile browser cases passed. The expanded suite now checks all 41 static directory pages without JavaScript, all algorithm-description language tags, reciprocal alternates and Arabic/Urdu direction. Publication is also blocked by a unit test if translation coverage is incomplete. Compact-footer and Arabic phone screenshots are saved in Playwright's per-test output directories.

Expanded release: 809 unit tests and the production build passed. All 30 scoped home, encyclopedia, localization and sitemap browser cases passed across desktop/mobile runs; the final eight sitemap and language-state cases passed together. Static validation checked all 41 catalogs, 7,400 non-English algorithm-description fields, matching text guides and 430 XML URLs. The existing all-categories selector smoke test still fails on FIFO knapsack in both viewports because its selector is rendered only on a secondary tab; that lesson was not changed by this release.
