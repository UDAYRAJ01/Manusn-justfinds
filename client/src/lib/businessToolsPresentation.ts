export const supportedBusinessTools = [
  { key: "profile", label: "Profile" },
  { key: "photos", label: "Photos" },
  { key: "hours", label: "Hours" },
  { key: "services", label: "Services" },
  { key: "leads", label: "Leads & CRM" },
  { key: "availability", label: "Booking availability" },
  { key: "appointments", label: "Appointments" },
  { key: "verification", label: "Verification" },
  { key: "analytics", label: "Analytics" },
  { key: "website", label: "Website builder" },
] as const;

export type SupportedBusinessTool = (typeof supportedBusinessTools)[number]["key"];

export function isSupportedBusinessTool(value: string): value is SupportedBusinessTool {
  return supportedBusinessTools.some((tool) => tool.key === value);
}

export function getBusinessToolLabel(value: string) {
  return supportedBusinessTools.find((tool) => tool.key === value)?.label ?? "Profile";
}

export function destructiveActionMessage(label: string) {
  return `Confirm ${label.toLowerCase()}. This change is recorded against this business and may affect its public information.`;
}
