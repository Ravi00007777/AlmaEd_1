// Blocks email addresses and phone-number-shaped digit runs in doubt chat
// text — teachers and students are meant to coordinate entirely through
// the platform, never exchange direct contact details (see
// ARCHITECTURE.md's privacy rule). This is a heuristic on plain text only;
// it can't inspect image attachments.

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_CANDIDATE_REGEX = /\d[\d\-\s().]{5,}\d/g;
const MIN_PHONE_DIGITS = 7;

export function containsContactInfo(text: string): boolean {
  if (EMAIL_REGEX.test(text)) return true;

  const candidates = text.match(PHONE_CANDIDATE_REGEX) ?? [];
  return candidates.some((candidate) => candidate.replace(/\D/g, '').length >= MIN_PHONE_DIGITS);
}
