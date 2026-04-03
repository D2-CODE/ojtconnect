import defaultKeywords from './keywords.json';

export type LeadType = 'intern' | 'internship';

// High-confidence keywords — counted as 3 matches each
const COMPANY_PRIORITY: RegExp[] = [
  /\bhiring\b/i,
  /\bwe are hiring\b/i,
  /\bnow hiring\b/i,
  /\bwe('re| are) looking for\b/i,
  // Must be company-initiated acceptance, not a student asking "if you are accepting"
  /\bwe (are |'re )?accepting (ojt|intern|application)/i,
  /\bnow accepting (ojt|intern|application)/i,
  /\bcurrently accepting (ojt|intern|application)/i,
  /\bopen for (ojt |intern)/i,
  /\bslots? (available|open|left)\b/i,
  /\b\d+\s*slots?\b/i,
  /\bhow to apply\b/i,
  /\bsend (your |a )?(resume|cv|portfolio)\b/i,
  /\bsubmit (your )?(resume|cv)\b/i,
  /\bplease (pm|dm|message) (me|us)\b/i,
  /\bpm (me|us)\b/i,
  /\bdm (me|us)\b/i,
  /\binterested applicants?\b/i,
  /\bjoin our team\b/i,
  /\bjoin us\b/i,
  /\bwe (offer|provide|are offering)\b/i,
  /\binternship (program|opportunity|opening|position)\b/i,
  /\bpaid internship\b/i,
  /\bunpaid internship\b/i,
  /\bojt program\b/i,
  /\bqualifications?:/i,
  /\brequirements?:/i,
  /\bwhat we('re| are) looking for\b/i,
  /\bfor interested\b/i,
  /\bkindly send\b/i,
  /\bemail (your|us|me)\b/i,
];

// Normal company keywords — counted as 1 match each
const COMPANY_NORMAL: RegExp[] = [
  /\bapply\b/i,
  /\bapplication\b/i,
  /\bvacancy\b/i,
  /\bwe need\b/i,
  /\bour team\b/i,
  /\bwork with us\b/i,
];

// High-confidence student keywords — counted as 3 matches each
const STUDENT_PRIORITY: RegExp[] = [
  /\blooking for (an? )?(ojt|internship)\b/i,
  /\bseeking (an? )?(ojt|internship)\b/i,
  /\bi('m| am) looking\b/i,
  /\bi('m| am) seeking\b/i,
  /\bi am currently (a |an )?\w+ student\b/i,
  /\bcurrently (a |an )?\w+ student\b/i,
  /\bi('m| am) a (student|graduating|4th|3rd|2nd)\b/i,
  /\bplease (hire|consider) me\b/i,
  /\bhire me\b/i,
  /\bopen for ojt\b/i,
  /\bavailable for ojt\b/i,
  /\bojt applicant\b/i,
  /\bmy (resume|cv|portfolio)\b/i,
  /\bi can (do|work|handle)\b/i,
  /\bmy skills\b/i,
  /\bi have experience\b/i,
  /\bcurrently enrolled\b/i,
  /\bcurrently (a )?student\b/i,
  /\bfresh graduate\b/i,
  /\bgraduating (student|this)\b/i,
  // Student stating their own hour/allowance requirements
  /\bminimum of \d+ hours\b/i,
  /\bwilling to (start|work|extend)\b/i,
  /\bi am willing\b/i,
  /\bif your company\b/i,
  /\bplease feel free to (message|contact)\b/i,
  /\bwould (greatly )?appreciate\b/i,
];

// Normal student keywords — counted as 1 match each
const STUDENT_NORMAL: RegExp[] = [
  /\bbs (computer|information|accountancy|business|education|nursing|engineering|psychology)/i,
  /\b(4th|3rd|2nd|1st) year\b/i,
  /\bcollege student\b/i,
  /\buniversity student\b/i,
  /\bstudent\b/i,
  /\bgraduate\b/i,
  /\bthesis\b/i,
  /\bschool\b/i,
  /\bremote\b/i,
  /\bhybrid\b/i,
  /\bonsite\b/i,
  /\bon-site\b/i,
  /\ballowance\b/i,
  /\bstipend\b/i,
  /\bintern(s)?\b/i,
  /\bposition\b/i,
];

export async function detectLeadType(text: string): Promise<LeadType | null> {
  if (!text || text.trim().length < 10) return null;

  const kw = await getKeywords();
  const lower = text.toLowerCase();

  let companyScore = 0;
  let studentScore = 0;

  for (const k of kw.companyPriority) if (lower.includes(k.toLowerCase())) companyScore++;
  for (const k of kw.studentPriority) if (lower.includes(k.toLowerCase())) studentScore++;

  if (companyScore === studentScore) return null;
  return companyScore > studentScore ? 'internship' : 'intern';
}

export function detectLeadTypeSync(text: string): LeadType | null {
  if (!text || text.trim().length < 10) return null;
  const kw = cache ?? defaultKeywords;
  const lower = text.toLowerCase();
  let companyScore = 0;
  let studentScore = 0;
  for (const k of kw.companyPriority) if (lower.includes(k.toLowerCase())) companyScore++;
  for (const k of kw.studentPriority) if (lower.includes(k.toLowerCase())) studentScore++;
  if (companyScore === studentScore) return null;
  return companyScore > studentScore ? 'internship' : 'intern';
}
