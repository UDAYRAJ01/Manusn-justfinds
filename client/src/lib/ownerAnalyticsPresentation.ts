export const analyticsRangeOptions = [
  { days: 7 as const, label: "Last 7 days" },
  { days: 30 as const, label: "Last 30 days" },
  { days: 90 as const, label: "Last 90 days" },
];

type ActionCount = { action: string; count: number | string };
type DailyCount = { day: string; count: number | string };

export function analyticsSummary(actions: ActionCount[], totalInteractions: number, daily: DailyCount[]) {
  const countFor = (...names: string[]) => actions.filter(item => names.includes(item.action)).reduce((total, item) => total + Number(item.count || 0), 0);
  return {
    totalInteractions,
    enquiries: countFor("inquiry"),
    contactActions: countFor("call", "whatsapp", "website", "directions"),
    activeDays: daily.filter(item => Number(item.count || 0) > 0).length,
  };
}

export function analyticsEmptyMessage(rangeDays: number) {
  return `Customer interactions recorded in the next ${rangeDays} days will appear here with their activity trend and latest actions.`;
}

export function readableAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
