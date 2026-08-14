# Appointment Enhancement Validation — 2026-08-15

## Automated checks

- TypeScript validation completed successfully.
- The full Vitest suite completed successfully: 56 files and 165 tests.
- The reusable `appointment-workflow` skill passed the required quick validator.

## Desktop validation

- The authenticated owner route `/business/120001/appointments` rendered the appointment schedule controls, weekly time windows, blackout-date control, and empty booking-decision state without layout errors.
- The published hospital website correctly hid the appointment request form while booking requests were disabled; its ordinary enquiry path remained available.
- An unknown customer token at `/appointment/00000000-0000-4000-8000-000000000000` showed the intended neutral unavailable-link state and did not expose appointment information.

## Mobile validation

- The owner appointment calendar remained readable and usable at 375px width, with weekly availability, blackout, and decision areas stacked cleanly.
- The published hospital website remained responsive and retained its normal enquiry form when booking was disabled.
- The initial full-page capture of the invalid customer-link route showed its loading state before the public request completed. The desktop validation confirms the final unavailable-link state; the customer page is additionally covered by token-bound procedure contracts and should be rechecked after a genuine booking request generates a real token.

## Deliberate scope

- No appointment availability was enabled for VISHNOI FACE HOSPITAL during validation, so no fabricated customer booking or appointment history was created.
- The approved-state Google Calendar and iCalendar controls are verified through the dedicated calendar-export regression; live interactive confirmation requires a real owner-approved appointment.
