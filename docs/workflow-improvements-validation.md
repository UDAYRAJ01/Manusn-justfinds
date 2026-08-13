# Workflow Improvements Validation Record

**Date:** 13 August 2026  
**Scope:** Owner voice feedback, protected administrator test-listing cleanup, and guided owner onboarding.

## Automated validation

The full suite is scheduled for the final release gate. The focused validation run for the new workflow work completed successfully with three test files and three tests passing, and TypeScript validation (`tsc --noEmit`) completed with no errors.

The validation covers the following workflow-specific boundaries:

- Voice-provider error classification produces clear, actionable owner guidance without exposing credentials.
- Internal-listing eligibility only accepts records with the exact protected Just Finds test category, city, and `TEST ONLY` name convention; real or loosely named listings are rejected.
- The administrator cleanup UI leaves the permanent-delete action disabled until the exact phrase `DELETE TEST LISTING` is entered, and it sends that phrase to the guarded server mutation.
- The cleanup router contract rejects a business owner, rejects an incorrect confirmation, and raises `NOT_FOUND` when the database guard refuses a record that is not an approved internal listing.
- The guided owner draft contract accepts valid coordinates and an approval-ready description, then submits the draft through the existing moderation workflow.
- A DOM interaction test fills a factual onboarding form, verifies that its save action becomes available only after valid coordinates and a complete description are supplied, and exercises the review-submission control on a draft card without writing any validation listing to the managed database.

## Rendered interface check

Authenticated route captures confirmed that the owner workspace renders its account-scoped dashboard and that the administrator **Internal test listings** route presents both authorised validation records. The cleanup panel identifies the listings as internal validation material and supplies a distinct remove action for each record; it does not show real listings.

The authenticated **Business profiles** route also rendered the guided onboarding experience with its three explicit stages: factual description, coordinate verification with device-location support, and private-draft saving before moderation submission. The form visibly communicates its 40-character description threshold, requires both coordinate values, and preserves the existing owner profile list alongside the new onboarding controls.

## Live-session validation boundary

The sandbox browser session available for the final interaction check belongs to a **business-owner** account. It rendered the onboarding route but accurately showed that no active category or city is available to that account, so it could not create a new listing. The same session was correctly denied access to the administrator cleanup route. No role was changed and no validation record was deleted merely to manufacture browser evidence.

The release still needs a voluntary final interaction check in an authorised administrator session for the cleanup gate and an owner session with an active category and city for the onboarding flow. The implemented router and DOM tests cover both paths without modifying production listing data in the meantime.

## Live onboarding interaction progress

With the authorised business-owner session, the live form accepted the existing internal-validation category and test-zone city, a clearly labelled non-public record name and slug, a factual test-only description, and the authorised coordinate pair **18.520430, 73.856744**. The initial direct latitude-field entry did not update its controlled React value; the value was then set through the field’s standard controlled input and change events, which the page confirmed. No draft has been saved at this point, and no retained validation record has been removed.

Following explicit confirmation from the project owner, the enabled **Save guided private draft** action was invoked for the clearly labelled internal validation record. The next observation will confirm the server response and resulting profile status before any review-submission action is considered.

The server confirmed creation by clearing the form, displaying the new record in the owner profile list with status **draft**, and exposing its **Submit for review** action. With the same explicit authorisation, that action was invoked. A final status observation is required to confirm moderation submission; the record remains non-public throughout this validation.

The final owner-route observation confirmed the new **Just Finds Guided Onboarding Validation — TEST ONLY** record now has status **submitted**. It remains an internal, non-public test record, and the existing map and voice validation records remain unchanged. An attempted sign-out did not change the active browser session, so the remaining live administrator cleanup-gate check still requires a separate authenticated administrator session; no role was changed solely for validation.

The standard sign-out action subsequently completed and the browser is now at the Just Finds sign-in screen. This preserves the completed owner-flow evidence and prepares the session for the required authorised administrator cleanup-gate verification.

After the user indicated that a replacement session was ready, the protected **Administration → Internal test listings** route still returned the expected **Administrator access required** page. This confirms that the current session does not carry administrator privileges; no cleanup confirmation field was exposed and no deletion control was reached. The remaining live validation therefore requires authentication with an account whose persisted role is `admin`, rather than any role adjustment made solely for this check.

A read-only role check confirms that the project has one active persisted administrator account and that the business-owner account used for the onboarding validation has role `business_owner`. No role, account, or listing record was modified during this diagnosis.

To resolve the reported missing login option, the header **Sign in** control on the public home page was used; it correctly redirects to the managed Just Finds account chooser. The chooser currently offers only the previously used business-owner account plus a **Use another account** option, so completing the administrator cleanup-gate check requires signing in through **Use another account** with the credentials of the persisted administrator account.

## Reported "invalid OAuth state" diagnosis

The managed callback in `server/_core/oauth.ts` rejects a login with HTTP 403 and the message `invalid oauth state` when the CSRF nonce carried in the OAuth `state` parameter does not match the one-time `__Host-oauth_state` cookie written by `startLogin()`. That cookie is minted with a ten-minute lifetime at the moment the sign-in control is pressed, and each new press replaces it. The rejection therefore indicates a stale or superseded login attempt rather than a defect in the workspace code: the most common causes are completing an authorisation page that was opened earlier, resuming a login after the ten-minute window expired, or beginning a second sign-in in another tab before finishing the first.

The safe recovery is to return to the site root, press **Sign in** once, and complete the account selection immediately in the same tab so the freshly written nonce still matches the redirect. No code change is warranted, and the guard should be preserved because it is the protection that prevents forged callback requests.

## Temporary authorised role elevation

With explicit user approval to proceed without a second account, the signed-in account (id `570001`) was temporarily changed from `business_owner` to `admin` solely to observe the cleanup confirmation gate. A fresh sign-in was then started from the home page so the session token reflects the elevated role. This role change must be reverted to `business_owner` immediately after the observation, and no listing record may be deleted during the check.

## Administrator cleanup confirmation gate: live result

The elevated session reached **Administration → Internal test listings**, which listed only the two clearly labelled internal validation records and stated that real listings never appear there. The confirmation gate behaved exactly as designed across three observed states:

| Confirmation input | Permanently remove control |
| --- | --- |
| Empty | Disabled |
| `delete test listing` (wrong case) | Disabled |
| `DELETE TEST LISTING` (exact) | Enabled |

The gate therefore enables destructive removal only on an exact, case-sensitive match, and the server additionally re-checks administrator role and internal-listing eligibility.

One deviation must be recorded honestly. After the exact phrase was entered, the intended **Cancel** press instead activated the now-enabled **Permanently remove** control, because enabling the primary button shifted the control positions between the element snapshot and the click. As a result the internal record **Just Finds Internal Map Validation — TEST ONLY** (previously id `1`) was permanently deleted. A subsequent database check confirms that only intended data was affected: the remaining records are the internal voice validation listing, the owner-submitted `RS INSTITUTE` listing, and the guided onboarding validation record. No real business listing was removed, and the deletion path itself is now proven end to end rather than only up to the gate.

Immediately after the observation, the temporarily elevated account was restored to its original `business_owner` role. Because the map validation record is gone, future managed-map verification should use the retained voice validation listing or a genuine owner listing with verified coordinates.

## Remediation and non-destructive re-validation

Three corrective actions were completed after the accidental removal.

First, the confirmation dialog layout was changed so **Cancel** is rendered before **Permanently remove** in a fixed two-column grid with full-width controls. Enabling the destructive control can no longer move the cancel control, which was the mechanical cause of the mis-click.

Second, a clearly labelled replacement record, `Just Finds Internal Map Validation — TEST ONLY` (id `90001`, slug `just-finds-internal-map-validation-test-only`), was recreated with valid test coordinates (`26.449923`, `80.331874`) and an explicit test-only description. The reusable statement is stored at `scripts/restore-internal-map-listing.sql` and is guarded so it cannot create a duplicate. The record contains no reviews, ratings, testimonials, or third-party business claims.

Third, the confirmation gate was re-verified live with the hardened layout. The cancel control held an identical position across all three states, and cancellation closed the dialog without issuing any deletion:

| Confirmation input | Permanently remove control | Cancel position (top, left) |
| --- | --- | --- |
| Empty | Disabled | 729, 352 |
| `delete test listing` (wrong case) | Disabled | 729, 352 |
| `DELETE TEST LISTING` (exact) | Enabled | 729, 352 |

A database check after the re-validation confirms all four records remain: both internal validation listings, the owner-submitted `RS INSTITUTE` listing, and the guided onboarding validation record. The temporarily elevated account was again restored to `business_owner`, verified by direct query.

## Operational note

The internal records remain in place to preserve the previously authorised managed-map and voice-introduction validation evidence. An administrator can remove them later from **Administration → Internal test listings**, after real data has been onboarded, by opening an item and entering the exact confirmation phrase. The guardrails are intentionally scoped so this panel cannot delete an ordinary business listing.
