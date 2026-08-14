# Just Finds Design System Direction

## Brand premise

Just Finds is a **local-confidence platform**: people should feel they can discover a nearby option, understand the evidence, and take the next step without noise. The interface must feel more like a trusted civic guide than an anonymous directory or generic SaaS dashboard.

## Visual language

| Element | Direction |
| --- | --- |
| Canvas | Warm porcelain `#F8F7F3` with quiet tonal surface variation rather than a flat white application background. |
| Ink | Deep midnight `#0E1B3D` for headlines, primary navigation, high-priority controls, and dark feature panels. |
| Signal blue | Clear cobalt `#2559D6` for primary actions, selected states, active navigation, and useful-location signals. |
| Trust accent | Soft mint/emerald for confirmed or complete states; use coral sparingly only for place/location emphasis. |
| Typography | Tight, editorial display headings with durable, highly readable supporting copy. Preserve DM Sans, improve scale and rhythm. |
| Surfaces | Slightly lifted cards with a precise 1px edge, softer shadow, and more intentional content grouping. Avoid nested-card overload. |
| Motif | A subtle map-grid / local-signal halo in hero and workspace feature panels; never decorative enough to obscure data. |
| Motion | Fast, restrained transform/opacity feedback under 220ms; honor reduced-motion preferences. |

## Screen architecture

Public screens use a stronger dark navigation bar, a purposeful search/search-result hierarchy, richer context bands, and obvious next actions. Owner and admin screens share the same ink, signal-blue, and warm-canvas palette but prioritize operational clarity: compact navigation, a dedicated action rail, primary cards for the current task, and secondary cards for reference information.

## Implementation sequence

1. Global tokens, typography, public frame, common listing cards, search hero, and public discovery pages.
2. Owner workspace, onboarding/add-business, Google import, and business tools.
3. Administration shell and governed management surfaces, then responsive polish and full regression validation.

## Guardrails

The redesign does not change any route, API contract, permissions, listing visibility rule, data source, public user-generated content, or business workflow. Public content will not be fabricated; existing internal validation labels and real data remain truthful.
