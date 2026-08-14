# Just Finds Clean Local-Discovery UI Specification

## Purpose

The supplied screens establish a clean, structured visual direction for **Just Finds**: white canvas, blue action color, compact navigation, clear location-aware search, precise card rhythm, and practical local-business decisions. This specification translates that direction into the existing Just Finds application without copying external code, branding, content, reviews, ratings, imagery, or fabricated metrics.

## Public discovery system

| Surface | Existing capability preserved | Presentation adjustment |
| --- | --- | --- |
| Global header | Existing public routes, managed sign-in, owner/admin entry points | White compact bar with logo, city context, concise navigation, and one primary sign-in/action treatment. |
| Homepage | Existing search, categories, city context, listings, jobs, and factual signals | Light local-discovery hero with a large search bar, compact popular-search/category controls, structured sections, and less decorative copy. |
| Search results | Existing query, filters, map/list behavior, links, and pagination | Split filter/results hierarchy, dense row cards, direct factual tags, and one high-clarity primary detail action. |
| Categories | Existing category and city data | Left browse rail on wide screens, compact category cards, and clear empty states when no real content is available. |
| Listing profile | Existing contact, availability, services, booking, lead, verification, and data safeguards | Visual-first factual header, persistent action panel, tabbed content rhythm, and concise detail blocks that only render real records. |
| Footer | Existing public routes and legal links | Clear multi-column footer and owner CTA based on real application routes; no invented app-download claims. |

## Workspace system

Authenticated user, owner, and administration pages maintain current authentication and permissions. Their visual language becomes lighter, more structured, and data-first: compact white top bars, decisive blue selected states, consistent metric cards, clean table/list spacing, and task cards that expose real workflow status rather than placeholder analytics.

## Responsive rules

At mobile widths, controls become stacked, filters become compact triggers or horizontally scrollable chips, utility information moves below the main content, and all buttons remain thumb reachable. The current application routes remain unchanged; mobile styling will not replace desktop behavior with mock screens.

## Non-disruption constraints

This is a **presentation-only rebuild**. Existing tRPC contracts, schema, business data, role checks, source labels, review boundaries, appointment behavior, Google Places restrictions, and no-fabrication rules remain unchanged. The updated UI will use current project components and real data paths only.
