# Just Finds Phase 1 Validation Record

## Accessibility and state coverage

The public, managed-auth, owner, and administrator routes were reviewed at desktop and 390px mobile widths. The implemented interface uses native controls for forms, buttons, links, and select elements; protected routes use an authenticated workspace shell and clear access-denied or empty states. A global `:focus-visible` rule applies a high-contrast, offset focus indicator to links, buttons, inputs, selects, textareas, and button-role controls. Public and protected shells expose keyboard skip links that target a programmatically focusable main landmark. The interface also preserves reduced-motion handling for interactive controls.

Live browser validation confirmed that the unauthenticated `/owner/profile` and `/admin/categories` routes resolve to the intentional **Sign in to continue** denial state rather than an error or an exposed workspace. On the public home route, the first interactive element is **Skip to main content**, followed by the branded navigation, primary actions, and search controls; reverse keyboard navigation from the logo moved focus to the visibly exposed skip link. The same route exposes the focusable skip-link target in its rendered DOM. The protected shell has the matching skip-link/landmark contract covered by automated tests.

After adding query gating, a fresh unauthenticated owner and administrator route visit did not produce a new `workspace.ownerOverview`, `workspace.adminOverview`, or related protected-workspace network request. The browser and network logs retain earlier, pre-fix access-denial entries at 13:09 UTC; no matching request was emitted during the final 13:11–13:14 route validation.

### Route-level browser evidence

| Route class | Route checked | Verified outcome |
| --- | --- | --- |
| Public discovery | `/` | **Skip to main content** is present in the route’s native tab order. Reverse keyboard traversal from the focused logo moved to the visibly on-screen skip link, which targets `#main-content`. |
| Public loading and empty states | `/search?q=plumber` | The route first rendered its non-blocking result skeleton, then settled into the explicit **No matches for these filters** state with guidance to adjust the search or city. |
| Managed auth | `/login` | The route exposes the shared skip link, native header navigation, one clear secure-sign-in action, and an honest environment notice that email/password authentication is not simulated. |
| Owner denial | `/owner/profile` | The unauthenticated route rendered the intentional denial card with visible keyboard focus on its branded home link and native Home/sign-in actions. No workspace data was exposed. |
| Administrator denial | `/admin/categories` | The unauthenticated route rendered the same intentional denial state and exposed no category or moderation data. |

For the fresh protected-query check, network and browser log line counts were captured before reopening `/owner/profile` and `/admin/categories` (network line 114; browser line 166). Entries appended after that boundary contained no `workspace.*`, `getPendingBusinesses`, or expected-login error entry.

The shared stylesheet exposes `.skip-link:focus` and `.skip-link[data-focused="true"]` at `top: 1rem`, which applies to both keyboard and script-driven focus. This rule is now part of the automated accessibility contract, while the browser keyboard path independently confirmed the link is visibly exposed when focused. A direct live-browser measurement after the 160 ms transition settled recorded a matching focused selector, `computedTop: 16px`, `rectTop: 16px`, `rectBottom: 61px`, and `visible: true`.

The final direct browser pass captured keyboard focus on each route class. On `/` and `/login`, pressing Tab focused the `A.skip-link` control with text “Skip to main content”, `top: 16px`, `bottom: 61px`, and `visible: true`. The public search route `/search?q=plumber` settled into its no-results state. On `/owner/profile` and `/admin/categories`, the deliberate access-denial screen rendered and Tab focused the native “Just Finds” anchor before the Home and Sign in actions. This confirms a native, visible keyboard order without triggering protected workspace queries for unauthenticated access.

The managed-auth route is intentionally a static account-entry screen rather than an asynchronous data view. It therefore has no loading, empty, or access-denial state to validate: its route-level acceptance criteria are the managed-sign-in explanation, the explicit non-simulation notice for email-password authentication, and native keyboard access to its secure sign-in action. Loading-state verification applies to data-backed public and workspace experiences; the public search route supplied the representative settled empty state, while owner and administrator routes supplied the representative access-denial states.

For the final programmatic check, the live page called `skip.focus()` after removing the focused data attribute. After 250 ms, the browser returned `active: true`, `focusMatches: true`, `dataFocused: "true"`, `computedTop: "16px"`, `rectTop: 16`, `rectBottom: 61`, and `visible: true`.

## Metadata coverage

The static document head supplies the Just Finds title, description, theme color, Open Graph site/title/description/type, and Twitter summary metadata. The runtime `PageMeta` component updates title, description, Open Graph title/description/URL, Twitter title/description, and canonical URL for public discovery, auth, owner, and admin route classes without assuming an unconfigured custom domain. The metadata contract tests cover public, auth, owner, and administrator route classes, including canonical URL normalization.

Live browser inspection of `/` confirmed the emitted title, description, canonical URL, `og:title`, `og:description`, and `og:url` all resolve to the active deployment origin. The DOM test suite checks the same emitted head fields across category, auth, owner, and administrator route classes.

## Automated checks

`pnpm check` completed without TypeScript errors. `pnpm test` completed with 8 test files and 22 assertions passing, including live-head, route-metadata, canonical-URL, keyboard-landmark, ranking, permission, import-status, discovery-contract, and logout coverage.

## Known configuration boundary

The canonical URL resolves from the deployed runtime origin. A permanent branded canonical domain should be configured only after the user supplies and verifies a custom domain. Live maps, voice synthesis, DNS verification, and managed import workers also remain external-provider integrations rather than simulated capabilities.
