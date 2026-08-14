# Owner Listing Flow Investigation

## Live URLs reviewed

- https://justfinds-izng9njy.manus.space/owner/profile
- https://justfinds-izng9njy.manus.space/business

## Observations

The live `/owner/profile` route currently renders the owner shell and a separate guided listing-onboarding form with a separate "Your profiles" list. The live `/business` route renders a different business workspace with its own "Add a business" onboarding state, business selector, selected-business dashboard, and detailed tool links. These are separate UI flows rather than two entry points into one canonical listing-management experience.

## Current code evidence

`OwnerWorkspace.tsx` routes `/owner/profile` to `ProfileManager`, which contains `ProfileForm` and `BusinessRow`.

`BusinessPlatform.tsx` owns a second `Onboarding` component, `myBusinesses` query, business selector, and selected dashboard. Its selected business is currently local state only and does not read or write a URL business context.

`App.tsx` mounts `/business` and `/business/onboarding` to `BusinessPlatform`, while `/owner/:rest*` mounts `OwnerWorkspace`.

## Target behavior

Make `/business` the canonical owner listing-management workspace. `/owner/profile` should redirect to that canonical workspace rather than render a second creation form. The owner overview should link directly to `/business` or `/business?businessId=<id>`, and business selection should be reflected in the URL so the context survives navigation. Detailed `/business/:businessId/:tool` routes remain the edit surface for one owner-scoped listing.
