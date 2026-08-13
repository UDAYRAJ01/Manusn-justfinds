export function voiceFailureMessage(message: string) {
  if (/not configured|no approved voice/i.test(message)) return "Voice generation is not configured for this workspace yet. Ask an administrator to verify the provider configuration.";
  if (/approved/i.test(message)) return "This listing needs an administrator-approved description before its introduction can be created.";
  if (/temporarily|try again|could not/i.test(message)) return "The voice service did not complete the request. Please wait a moment and try again.";
  return message;
}
