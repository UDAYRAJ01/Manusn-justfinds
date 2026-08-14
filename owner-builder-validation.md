# Owner Builder Validation Notes

- Verified owner route: `/business/120001/website` for VISHNOI FACE HOSPITAL loads the authenticated Website Builder.
- The live public hospital website is already published and accessible through the canonical business slug.
- The deployed builder displays the three preview controls above the live canvas. In the observed browser state, the rightmost mobile control is visibly selected (blue active styling) and the canvas renders in the narrow mobile layout.
- The active browser’s element-index listing does not expose these icon-only controls by accessible name, so the rendered selected styling was captured directly from the browser viewport for follow-up validation.
