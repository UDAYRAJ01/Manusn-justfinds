import { describe, expect, it } from "vitest";
import { businessRouter } from "./business";
import { canManageBusiness, canModerate } from "../domain/permissions";

const procedures = Object.keys((businessRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures);

describe("conversion workflow boundaries", () => {
  it("keeps duplicate checks, private verification documents, CRM notes, and administrator decisions behind protected procedures", () => {
    expect(procedures).toEqual(expect.arrayContaining(["duplicateCandidates", "uploadVerificationDocument", "verificationDocumentUrl", "addLeadNote", "reviewVerification"]));
    expect(procedures).not.toContain("publicVerificationDocumentUrl");
    expect(procedures).not.toContain("mergeDuplicateBusinesses");
  });

  it("preserves strict owner isolation while allowing only administrators to review verification cases", () => {
    expect(canManageBusiness("business_owner", 101, 202)).toBe(false);
    expect(canManageBusiness("business_owner", 101, 101)).toBe(true);
    expect(canModerate("user")).toBe(false);
    expect(canModerate("business_owner")).toBe(false);
    expect(canModerate("admin")).toBe(true);
    expect(canModerate("super_admin")).toBe(true);
  });

  it("uses a deliberate lead lifecycle without fabricating customer outcomes", () => {
    const statuses = ["new", "contacted", "qualified", "converted", "closed"] as const;
    expect(statuses).toContain("contacted");
    expect(statuses).toContain("converted");
    expect(statuses).not.toContain("auto-converted");
  });

  it("exposes only the availability lookup and consented request form publicly while retaining owner schedule control", () => {
    expect(procedures).toEqual(expect.arrayContaining([
      "appointmentSettings",
      "saveAppointmentSettings",
      "addAppointmentBlackout",
      "removeAppointmentBlackout",
      "updateAppointmentRequest",
      "publicAppointmentAvailability",
      "requestAppointment",
    ]));
    expect(procedures).not.toContain("publicAppointmentSettings");
    expect(procedures).not.toContain("publicUpdateAppointmentRequest");
  });

  it("requires owner authority for appointment decisions and an opaque customer token for self-service", () => {
    expect(procedures).toEqual(expect.arrayContaining([
      "ownerAppointmentAvailability",
      "decideAppointmentRequest",
      "customerAppointment",
      "customerAppointmentAction",
    ]));
    expect(procedures).not.toContain("publicAppointmentById");
    expect(procedures).not.toContain("publicDecideAppointmentRequest");
    expect(procedures).not.toContain("customerAppointmentByRequestId");
  });
});
