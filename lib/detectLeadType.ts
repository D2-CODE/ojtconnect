export type LeadType = 'intern' | 'internship';

// High-confidence company keywords — each match scores +3
export const COMPANY_PRIORITY: { pattern: string; label: string }[] = [
  { pattern: '\\bhiring\\b', label: 'hiring' },
  { pattern: '\\bwe are hiring\\b', label: 'we are hiring' },
  { pattern: '\\bnow hiring\\b', label: 'now hiring' },
  { pattern: "\\bwe('re| are) looking for\\b", label: "we're looking for" },
  { pattern: '\\bwe (are |\'re )?accepting (ojt|intern|application)', label: 'we are accepting' },
  { pattern: '\\bnow accepting (ojt|intern|application)', label: 'now accepting' },
  { pattern: '\\bcurrently accepting (ojt|intern|application)', label: 'currently accepting' },
  { pattern: '\\bopen for (ojt |intern)', label: 'open for ojt/intern' },
  { pattern: '\\bslots? (available|open|left)\\b', label: 'slots available' },
  { pattern: '\\b\\d+\\s*slots?\\b', label: 'N slots' },
  { pattern: '\\bhow to apply\\b', label: 'how to apply' },
  { pattern: '\\bsend (your |a )?(resume|cv|portfolio)\\b', label: 'send resume/cv' },
  { pattern: '\\bsubmit (your )?(resume|cv)\\b', label: 'submit resume/cv' },
  { pattern: '\\bplease (pm|dm|message) (me|us)\\b', label: 'please pm/dm us' },
  { pattern: '\\bpm (me|us)\\b', label: 'pm us' },
  { pattern: '\\bdm (me|us)\\b', label: 'dm us' },
  { pattern: '\\binterested applicants?\\b', label: 'interested applicants' },
  { pattern: '\\bjoin our team\\b', label: 'join our team' },
  { pattern: '\\bjoin us\\b', label: 'join us' },
  { pattern: '\\bwe (offer|provide|are offering)\\b', label: 'we offer/provide' },
  { pattern: '\\binternship (program|opportunity|opening|position)\\b', label: 'internship program/position' },
  { pattern: '\\bpaid internship\\b', label: 'paid internship' },
  { pattern: '\\bunpaid internship\\b', label: 'unpaid internship' },
  { pattern: '\\bojt program\\b', label: 'ojt program' },
  { pattern: '\\bqualifications?:', label: 'qualifications:' },
  { pattern: '\\brequirements?:', label: 'requirements:' },
  { pattern: "\\bwhat we('re| are) looking for\\b", label: "what we're looking for" },
  { pattern: '\\bfor interested\\b', label: 'for interested' },
  { pattern: '\\bkindly send\\b', label: 'kindly send' },
  { pattern: '\\bemail (your|us|me)\\b', label: 'email us/me' },
];

// High-confidence student keywords — each match scores +3
export const STUDENT_PRIORITY: { pattern: string; label: string }[] = [
  { pattern: '\\blooking for (an? )?(ojt|internship)\\b', label: 'looking for ojt/internship' },
  { pattern: '\\bseeking (an? )?(ojt|internship)\\b', label: 'seeking ojt/internship' },
  { pattern: "\\bi('m| am) looking\\b", label: "i'm looking" },
  { pattern: "\\bi('m| am) seeking\\b", label: "i'm seeking" },
  { pattern: '\\bi am currently (a |an )?\\w+ student\\b', label: 'i am currently a student' },
  { pattern: '\\bcurrently (a |an )?\\w+ student\\b', label: 'currently a student' },
  { pattern: "\\bi('m| am) a (student|graduating|4th|3rd|2nd)\\b", label: "i'm a student" },
  { pattern: "\\bi('m| am) a \\d+(st|nd|rd|th)[- ]year\\b", label: "i'm a Nth-year" },
  { pattern: '\\b\\d+(st|nd|rd|th)[- ]year (student|college)\\b', label: 'Nth-year student' },
  { pattern: '\\binterested in (the |an? )?\\w+ (intern|ojt|position)\\b', label: 'interested in intern position' },
  { pattern: "\\bi('m| am) interested in\\b", label: "i'm interested in" },
  { pattern: '\\bwilling to (start|work|extend|report|render)\\b', label: 'willing to report/work' },
  { pattern: '\\bhire me\\b', label: 'hire me' },
  { pattern: '\\bopen for ojt\\b', label: 'open for ojt' },
  { pattern: '\\bavailable for ojt\\b', label: 'available for ojt' },
  { pattern: '\\bojt applicant\\b', label: 'ojt applicant' },
  { pattern: '\\bmy (resume|cv|portfolio)\\b', label: 'my resume/cv' },
  { pattern: '\\bi can (do|work|handle)\\b', label: 'i can do/work' },
  { pattern: '\\bmy skills\\b', label: 'my skills' },
  { pattern: '\\bi have experience\\b', label: 'i have experience' },
  { pattern: '\\bcurrently enrolled\\b', label: 'currently enrolled' },
  { pattern: '\\bcurrently (a )?student\\b', label: 'currently student' },
  { pattern: '\\bfresh graduate\\b', label: 'fresh graduate' },
  { pattern: '\\bgraduating (student|this)\\b', label: 'graduating student' },
  { pattern: '\\bminimum of \\d+ hours\\b', label: 'minimum of N hours' },
  { pattern: '\\bwilling to (start|work|extend)\\b', label: 'willing to start/work' },
  { pattern: '\\bi am willing\\b', label: 'i am willing' },
  { pattern: '\\bif your company\\b', label: 'if your company' },
  { pattern: '\\bplease feel free to (message|contact)\\b', label: 'please feel free to message' },
  { pattern: '\\bwould (greatly )?appreciate\\b', label: 'would appreciate' },
];

function scoreText(
  text: string,
  companyPatterns: RegExp[],
  studentPatterns: RegExp[],
): { companyScore: number; studentScore: number } {
  let companyScore = 0;
  let studentScore = 0;
  for (const re of companyPatterns) if (re.test(text)) companyScore += 3;
  for (const re of studentPatterns) if (re.test(text)) studentScore += 3;
  return { companyScore, studentScore };
}

// Sync version — uses only hardcoded PRIORITY keywords (for non-DB contexts)
export function detectLeadType(text: string): LeadType | null {
  if (!text || text.trim().length < 10) return null;
  const companyRegs = COMPANY_PRIORITY.map((k) => new RegExp(k.pattern, 'i'));
  const studentRegs = STUDENT_PRIORITY.map((k) => new RegExp(k.pattern, 'i'));
  const { companyScore, studentScore } = scoreText(text, companyRegs, studentRegs);
  if (companyScore === studentScore) return null;
  return companyScore > studentScore ? 'internship' : 'intern';
}

// Async version — accepts pre-fetched DB keywords to avoid server-only imports in client files
export function detectLeadTypeWithDB(
  text: string,
  dbKeywords: { keyword: string; type: 'company' | 'student' }[]
): LeadType | null {
  if (!text || text.trim().length < 10) return null;

  const companyRegs = COMPANY_PRIORITY.map((k) => new RegExp(k.pattern, 'i'));
  const studentRegs = STUDENT_PRIORITY.map((k) => new RegExp(k.pattern, 'i'));

  for (const kw of dbKeywords) {
    const re = new RegExp(`\\b${kw.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (kw.type === 'company') companyRegs.push(re);
    else studentRegs.push(re);
  }

  const { companyScore, studentScore } = scoreText(text, companyRegs, studentRegs);
  if (companyScore === studentScore) return null;
  return companyScore > studentScore ? 'internship' : 'intern';
}
