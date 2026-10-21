# Encyclopedia and discoverable URLs

The shared Learn tab opens `/category/algorithm/learn`. The visualization remains
at `/category/algorithm` and still opens with Visualization selected. The special
string suite also links to its corresponding encyclopedia article.

## Content sources

- `src/encyclopedia/content.ts`: original definitions, purpose, intuition,
  applications, trade-offs and common mistakes for sorting/searching; category
  context and the shared section model.
- `src/guides/daaTheory.ts` and `src/daa/legacyStudy.ts`: existing authored method
  notes, proofs, examples, exercises and complexity assumptions.
- `src/daa/catalog.ts`: individual lesson definitions, theory, inputs, proofs,
  worked examples and constraints across the other algorithm families.
- `src/encyclopedia/AlgorithmArticle.tsx`: the semantic article used in both the
  browser and the initial HTML. Selection Sort additionally includes a four-pass
  example table, invariant explanation, comparison-count derivation, equal-key
  stability counterexample and a complete in-place JavaScript implementation.

Suites and learning tools are identified as topic-family/workflow articles rather
than falsely claiming a full implementation of every named algorithm. Existing
runner-specific assumptions are retained; optimized Bubble Sort is described
separately from its earlier runner without early exit. Further-reading links
include MIT OpenCourseWare and NIST, with the requested GeeksforGeeks reference
on Selection Sort. The prose is original, not copied from those sites.

## URLs, bookmarks and metadata

- `BrowserRouter` and root-relative assets support direct loads and refreshes.
- `legacyHash.ts` converts old `/#/category/algorithm` links without losing login
  query parameters. Plain section fragments such as `#complexity` are preserved.
- Article headings and the contents list expose stable section fragments.
- Article bookmarks use browser-local storage; the directory can filter saved
  articles. Copy page link includes the current section fragment.
- Every algorithm gets unique titles, descriptions, canonical URLs, Open Graph
  metadata and TechArticle/WebPage plus BreadcrumbList JSON-LD. Unknown routes
  receive a client-side noindex instruction.
- `scripts/prerender-encyclopedia.mjs` emits complete HTML and metadata for every
  catalog article, visualization landing page and category, plus the directory,
  sitemap and robots file. Static articles remain readable without JavaScript.
- Vercel serves actual files first with `cleanUrls: true`; the rewrite fallback
  supports browser application routes. `.html` and extensionless URLs resolve to
  the same canonical clean URL.

## Verification

`npm run check` includes catalog-wide article/anchor/metadata checks, legacy URL
migration tests, implementation-specific theory assertions and the generated
production pages. `tests/visual/encyclopedia.spec.ts` opens every article on
mobile and desktop, checks browser errors, verifies legacy navigation, section
refresh, saved bookmarks, editing input and the server HTML/sitemap/robots.

When adding an algorithm, supply an accurate summary, pseudocode and analysis;
add original topic notes when a useful introductory explanation is missing.
The page generator automatically adds the entry to the directory and sitemap.
Indexing and rankings are controlled by search engines; metadata does not
constitute a guarantee of placement.
