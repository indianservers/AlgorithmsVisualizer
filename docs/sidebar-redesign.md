# Global sidebar redesign

The reference image supplies the sidebar's appearance. The requested 18-category hierarchy supplies its content and order. Existing catalog modules and `algorithmPath` supply every destination. Algorithm implementations and main-content components were not redesigned in this change.

## Shared architecture

`Sidebar.tsx` is the only sidebar implementation. Both `App.tsx` and `HomeDashboard.tsx` mount it through the existing `Layout`. The Dijkstra-specific sidebar was removed. `sidebarOrder.ts` defines the requested display order; `sidebarNavigation.ts` resolves those names to real modules and records traversal aliases. `navigation.tsx` provides distinct Lucide category icons.

The rail is 248 px on desktop and uses a sticky, viewport-height layout. Its header and footer remain visible, and `.sidebar-navigation` is its only scrolling region. Main content retains document scrolling. Expanding a category changes the navigation's scrollable contents, not the document height. The existing compact, focus, and full-canvas modes remain available.

An accordion opens the current route's parent. Clicking another category closes the preceding one; clicking the open category closes it. Links retain native browser navigation and modified-click behavior. Route changes, direct hash URLs, refresh, and browser history restore the correct selection. Navigation scroll position survives remounts; revealing the selected item scrolls only the navigation region. Closed panels are inert, buttons expose `aria-expanded`/`aria-controls`, and current links expose `aria-current`. The 210 ms transitions honor reduced motion.

The mobile drawer uses the existing hamburger/backdrop. It adds a named modal dialog, keyboard focus containment, Escape dismissal, and focus restoration. Selecting a route closes it. Dark theme, recent items, and icon-style preferences are retained.

## Navigation coverage

| Category               | Unique entries |
| ---------------------- | -------------: |
| Home dashboard         |              1 |
| DAA Concepts           |              1 |
| Analysis & Correctness |             10 |
| Divide and Conquer     |              6 |
| Branch and Bound       |              4 |
| Complexity Theory      |              5 |
| DAA Extensions         |             20 |
| Sorting                |             15 |
| Searching              |             14 |
| Data Structures        |             49 |
| Graphs                 |             17 |
| Dynamic Programming    |             14 |
| Strings                |              5 |
| Number Theory          |              2 |
| Backtracking           |              6 |
| Greedy                 |              5 |
| Matrix / Grid          |              2 |
| Games                  |              8 |

All 183 requested submenu names resolve. There are no unresolved mappings or duplicate navigation destinations. BFS and DFS each appear once, using their original `bfs-traversal` and `dfs-traversal` URLs. The `daa-bfs` and `daa-dfs` URLs remain valid, highlighting those same entries. All 185 catalog module URLs, plus Home, are covered.

## Validation

- Unit tests enforce exact requested ordering and names, existing destinations, complete catalog coverage, and explicit BFS/DFS aliases.
- Browser tests exercise every catalog route, direct URL selection, refresh, back/forward history, keyboard links, and mobile drawer focus and dismissal.
- Long-menu tests expand Data Structures and DAA Extensions at desktop heights of 600, 720, 768, 900, and 1080 px. Sidebar height equals the viewport height; document height and main scroll position remain unchanged.
- Screenshots cover 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, and 390×844. Tablet/mobile captures show the open drawer. No horizontal overflow was observed.
- Compact mode was checked at 72 px and restored to 248 px through category selection. Dark theme and zero-duration reduced-motion transitions were checked. No browser exceptions or console errors occurred in the navigation audit.
- Existing visual snapshots were refreshed for the new desktop sidebar and its 248 px rail width. Main algorithms, data, animation controls, exports, and account flows remain covered by the existing regression suite.

`npm run check` passed: lint, 452 unit tests, TypeScript/Vite production build, and bundle budgets. The full 132-case browser suite passed 128 cases initially. The navigation-state defect and outdated navigation assertions were corrected; subsequent focused desktop/mobile reruns passed every affected case, including the complete route audit. The final 8-case rerun passed all history, home navigation, dark-theme navigation, and drawer checks. No known implementation issues remain.

Additional responsive checks used 1152×720 at device scale 1.25 and 960×600 at scale 1.5, representing CSS viewport sizes encountered with enlarged desktop layouts. The sidebar stayed contained without horizontal overflow. This checks responsive sizing rather than invoking browser zoom controls.

| Screenshot                                              | View          |
| ------------------------------------------------------- | ------------- |
| [1920×1080](../artifacts/sidebar/sidebar-1920x1080.png) | Desktop       |
| [1440×900](../artifacts/sidebar/sidebar-1440x900.png)   | Desktop       |
| [1366×768](../artifacts/sidebar/sidebar-1366x768.png)   | Desktop       |
| [1280×720](../artifacts/sidebar/sidebar-1280x720.png)   | Desktop       |
| [1024×768](../artifacts/sidebar/sidebar-1024x768.png)   | Tablet drawer |
| [390×844](../artifacts/sidebar/sidebar-390x844.png)     | Mobile drawer |
| [Dark theme](../artifacts/sidebar/sidebar-dark.png)     | Desktop       |

## Files changed for this sidebar work

- `src/components/Sidebar.tsx`, `sidebar.css`, `navigation.tsx`: shared navigation rendering, appearance, and icons.
- `src/components/Layout.tsx`: accessible mobile drawer focus handling.
- `src/data/sidebarOrder.ts`, `sidebarNavigation.ts`: typed requested hierarchy and route resolution.
- `src/App.tsx`: restore the full rail when selecting a category from compact mode.
- `src/home/HomeDashboard.tsx`, `home.css`: integrate the shared shell while preserving dashboard content.
- `src/daa/dijkstra.css`: remove the obsolete Dijkstra-only sidebar styling.
- `src/data/sidebarNavigation.test.ts`, `tests/visual/sidebar.spec.ts`: coverage and integration checks.
- `tests/visual/home.spec.ts`, `mobile-learning.spec.ts`: synchronize navigation assertions with the shared home sidebar and explicit accordion child selection.
- Desktop visual snapshots under `tests/visual/`: intentional rail appearance and width changes.
- `artifacts/sidebar/`: requested screenshot deliverables.

Implementation is in the local workspace. Publishing is separate from this implementation.
