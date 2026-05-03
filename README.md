# AlgorithmsVisualizer

Interactive algorithm visualization app built with React, TypeScript, Vite, Vitest, and Playwright.

## Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run test:visual
npm run check
```

## Quality Gates

- ESLint for code checks.
- Vitest for algorithm, routing, persistence, and runner-controller tests.
- Playwright for desktop and mobile visual regression screenshots.
- Bundle budget checks in `scripts/check-bundle-budget.mjs`.
- Prettier and lint-staged are wired through Husky pre-commit.
