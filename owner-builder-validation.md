# Owner Builder Validation Notes

- Verified owner route: `/business/120001/website` for VISHNOI FACE HOSPITAL loads the authenticated Website Builder.
- The live public hospital website is already published and accessible through the canonical business slug.
- The deployed builder displays visible **Desktop**, **Tablet**, and **Mobile** preview controls above the live canvas. Each control has an accessible label and exposes its selected state.
- In the final production check, the rightmost **Mobile** control was selected. It showed the active blue styling and the live canvas narrowed to its mobile-width presentation while retaining the real hospital content.

### 2026-08-15 — visible-label release propagation check

- The authenticated production owner builder was reloaded after the `658b1e6b` release propagated. The active production bundle was `index-BLWNPJJW.js`.
- The browser accessibility snapshot exposed visible `Desktop`, `Tablet`, and `Mobile` button text. Selecting Mobile successfully changed the control’s selected state and rendered the narrow live-canvas preview. The final visible-label and mobile-preview acceptance checks are complete.
