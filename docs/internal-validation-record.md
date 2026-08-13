# Internal Validation Record

## Test data safeguards

On 13 August 2026, two user-authorized **Just Finds internal validation** listings were created solely to complete platform checks. Both records are visibly marked **TEST ONLY**, state that they are not real businesses, contain no public services or customer claims, and have **zero** reviews and ratings. They use test-only taxonomy and location context; they are owned by the authorized platform account.

## Managed Google Maps check

| Field | Evidence |
|---|---|
| Listing | `Just Finds Internal Map Validation — TEST ONLY` |
| Clean URL | `/just-finds-internal-validation/just-finds-test-zone/just-finds-internal-map-validation-test-only` |
| Coordinate source | Stored listing fields: latitude `1.000000`, longitude `1.000000` |
| Rendered result | The business detail page loaded Google Map and Satellite controls, map tiles, a visible marker, zoom controls, keyboard guidance, and the Maps terms/data attribution. |
| User API key | No user-provided API key was requested. |
| Fallback integrity | The page explicitly labels the address as a test-only coordinate anchor and continues to offer an external directions link. |

> This record documents platform behavior only. The test entries must not be presented as real commercial listings.

## ElevenLabs voice-introduction check

| Field | Evidence |
|---|---|
| Listing | `Just Finds Internal Voice Validation — TEST ONLY` |
| Authorization | The user-authorized internal test owner was granted the `business_owner` role; no other user account was changed. |
| Generation path | The application’s protected `workspace.generateVoiceIntroduction` procedure was invoked using the owned, published listing and the real configured ElevenLabs and storage integrations. |
| Approved-data boundary | The resulting script contains only the listing name, its approved test-only description, and the standard Just Finds information sentence. It introduces no services, reviews, ratings, or customer claims. |
| Persisted result | `voiceIntroductionUrl` stored as `/manus-storage/businesses/2/voice-introduction_6358475c.mp3`, with a corresponding script and generation timestamp. |
| Public playback | The published business detail page shows the **Listen to this business** section, the **Approved voice introduction** disclosure, and an HTML audio control with a loaded duration of 0:17. |
| Map companion check | The same published page also loaded the managed map, coordinate marker, maps controls, and attribution without requesting a user API key. |

> The generated MP3 is restricted to this internal validation listing. Remove the two test-only listings, their category/city context, and associated stored audio when testing is no longer needed.

## Authenticated owner-interface validation

The authenticated `business_owner` workspace exposed both test-only records in **AI content → Business voice introduction**. The owner selected `Just Finds Internal Voice Validation — TEST ONLY`, then activated **Generate voice introduction** through the actual UI. The request completed with the owner-facing success message:

> Voice introduction created and stored securely. It will be available on the published business profile.

The owner workspace then rendered the refreshed audio control for the selected listing, with a loaded duration of 0:17. The published business-detail page was reopened immediately afterward and continued to render the **Listen to this business** section, approved-data disclosure, and public audio player. This confirms the complete owner UI → ElevenLabs → secure storage → public-profile playback path for a user-authorized test-only record.

### Explicit post-generation audio verification

The browser inspected both audio elements after the owner-interface generation. Each exposed the same secure stored source, was ready for playback, and retained controls:

| Surface | Audio URL | Duration | Ready state |
|---|---|---:|---:|
| Published profile | `/manus-storage/businesses/2/voice-introduction_ad0cc10d.mp3` | 17.832925 seconds | 4 |
| Authenticated owner workspace | `/manus-storage/businesses/2/voice-introduction_ad0cc10d.mp3` | 17.832925 seconds | 4 |

The database record for internal listing `id = 2` also contained the matching relative URL and a refreshed `voiceIntroductionUpdatedAt` timestamp of `2026-08-13 14:59:21` immediately after the owner-interface request.

## Dedicated managed-map validation

The separate published route for `Just Finds Internal Map Validation — TEST ONLY` loaded the managed Google Maps surface without a user API-key prompt, credential field, or configuration step. Browser resource inspection observed twelve `maps.googleapis.com` assets, including the managed Maps JavaScript runtime, map configuration endpoint, Static Map image, and tile requests. The rendered DOM contained the managed map `DIV` with `aria-label="Map"`, visible map controls, Street View control, and an **Open this area in Google Maps** link. This evidence was captured on the dedicated map-validation record rather than inferred from the voice-validation page.
