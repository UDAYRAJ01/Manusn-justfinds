import type { businessAppointmentRequests } from "../../drizzle/schema";

type AppointmentRequest = typeof businessAppointmentRequests.$inferSelect;

/**
 * Public, token-scoped request fields. Internal request identifiers, owner notes,
 * customer notes, and the token itself deliberately never leave the customer route.
 */
export function customerAppointmentRequestView(request: AppointmentRequest) {
  return {
    startsAt: request.startsAt,
    endsAt: request.endsAt,
    timeZone: request.timeZone,
    status: request.status,
    proposedStartsAt: request.proposedStartsAt,
    proposedEndsAt: request.proposedEndsAt,
    decidedAt: request.decidedAt,
    cancelledAt: request.cancelledAt,
  };
}
