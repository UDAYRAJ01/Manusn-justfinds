export const jobTypeOptions = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
] as const;

export type JobTypeFilter = "" | (typeof jobTypeOptions)[number]["value"];

export function getJobTypeLabel(value: string) {
  return jobTypeOptions.find(option => option.value === value)?.label ?? value.replace(/_/g, " ");
}

export function hasJobFact(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}
