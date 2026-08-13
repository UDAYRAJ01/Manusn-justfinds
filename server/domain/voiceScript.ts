export function buildVoiceIntroductionScript(input: { name: string; approvedDescription: string | null }) {
  const description = input.approvedDescription?.replace(/\s+/g, " ").trim();
  if (!description) throw new Error("An approved business description is required before generating a voice introduction.");

  const safeDescription = description.slice(0, 1_200);
  return `Welcome to ${input.name}. ${safeDescription} Find contact details, directions, and approved business information on Just Finds.`;
}
