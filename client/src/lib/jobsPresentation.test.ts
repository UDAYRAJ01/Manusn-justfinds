import { describe, expect, it } from "vitest";
import { getJobTypeLabel, hasJobFact, jobTypeOptions } from "./jobsPresentation";

describe("Jobs presentation facts", () => {
  it("uses the actual persisted job-type values with readable labels", () => {
    expect(jobTypeOptions.map(option => option.value)).toEqual(["full_time", "part_time", "contract", "internship", "freelance"]);
    expect(getJobTypeLabel("full_time")).toBe("Full-time");
  });

  it("only treats supplied record fields as displayable listing facts", () => {
    expect(hasJobFact("  2 years  ")).toBe(true);
    expect(hasJobFact(null)).toBe(false);
    expect(hasJobFact("")).toBe(false);
  });
});
