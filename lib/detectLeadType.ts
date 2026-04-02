import defaultKeywords from './keywords.json';

export type LeadType = 'intern' | 'internship';

interface KeywordSet {
  companyPriority: string[];
  studentPriority: string[];
  stripLines: string[];
}

// Cache with 5-minute TTL
let cache: KeywordSet | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getKeywords(): Promise<KeywordSet> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;
  try {
    const connectDB = (await import('./mongodb')).default;
    const Keywords = (await import('../models/Keywords')).default;
    await connectDB();
    const doc = await Keywords.findOne().lean<KeywordSet>();
    if (doc) {
      cache = { companyPriority: doc.companyPriority, studentPriority: doc.studentPriority, stripLines: doc.stripLines };
      cacheTime = Date.now();
      return cache;
    }
  } catch {
    // fall through to defaults
  }
  return defaultKeywords;
}

export async function getStripLines(): Promise<string[]> {
  const kw = await getKeywords();
  return kw.stripLines ?? [];
}

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
