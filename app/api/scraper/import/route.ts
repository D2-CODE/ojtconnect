import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import EmailLog from '@/models/EmailLog';
import { generateId, generateClaimToken, cleanPostText } from '@/lib/utils';
import { sendClaimInviteEmail } from '@/lib/email';
import { detectLeadType } from '@/lib/detectLeadType';

function extractEmails(emails: unknown): string[] {
  if (!emails) return [];
  const raw = Array.isArray(emails) ? emails : [emails];
  return raw
    .map((e) => String(e).trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export async function POST(req: NextRequest) {
  console.log('[Scraper] ── Incoming request ──────────────────────────');

  // 1. API key guard
  const apiKey = req.headers.get('x-api-key');
  console.log('[Scraper] API key received:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');
  console.log('[Scraper] Expected key ends with:', process.env.SCRAPER_API_KEY ? '***' + process.env.SCRAPER_API_KEY.slice(-4) : 'NOT SET');

  if (apiKey !== process.env.SCRAPER_API_KEY) {
    console.log('[Scraper] ❌ Unauthorized — key mismatch');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[Scraper] ✅ API key valid');

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    console.log('Body Direct:- ',body);
    console.log('[Scraper] ✅ Body parsed:', JSON.stringify(body, null, 2));
  } catch {
    console.log('[Scraper] ❌ Invalid JSON body');
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // 3. Validation
  const {
    name, fb_id, profile_url, profile_pic, post_text, post_link,
    post_date, emails: rawEmails, phones, skills, experience,
    lead_type, resume_url, scraped_at,
  } = body as Record<string, unknown>;

  console.log('[Scraper] Fields — name:', name, '| lead_type:', lead_type,'| emails:', rawEmails);

  if (!name && !post_text) {
    console.log('[Scraper] ❌ Validation failed — name and post_text both missing');
    return NextResponse.json({ success: false, error: 'At least one of name or post_text is required' }, { status: 422 });
  }

  if (lead_type && !['intern', 'internship'].includes(lead_type as string)) {
    console.log('[Scraper] ❌ Invalid lead_type:', lead_type);
    return NextResponse.json({ success: false, error: 'lead_type must be "intern" or "internship"' }, { status: 422 });
  }

  // Fetch strip lines from DB then clean post text
  const { getStripLines } = await import('@/lib/detectLeadType');
  const stripLines = await getStripLines();
  const cleanedPostText = cleanPostText(String(post_text ?? ''), stripLines);

  // 4. Deduplicate by fb_id — if already exists skip save and email
  await connectDB();

  if (fb_id) {
    const existing = await OjtWall.findOne({ 'SectionData.fbleads.fb_id': fb_id }).lean();
    if (existing) {
      return NextResponse.json({
        success: true,
        data: { id: (existing as { _id: string })._id, skipped: true, reason: 'duplicate' },
      });
    }
  }

  const claimToken = generateClaimToken();
  const claimTokenExpiry = new Date(Date.now() + Number(process.env.CLAIM_TOKEN_EXPIRY_DAYS ?? 7) * 86_400_000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  console.log('[Scraper] appUrl:', appUrl);


  // 5. Save document
  let doc;
  try {
    doc = await OjtWall.create({
      _id: generateId(),
      source: 'scraped',
      SectionData: {
        fbleads: {
          name: name as string | undefined,
          fb_id: fb_id as string | undefined,
          profile_url: profile_url as string | undefined,
          profile_pic: profile_pic as string | undefined,
          post_text: cleanedPostText || undefined,
          post_link: post_link as string | undefined,
          post_date: post_date ? new Date(post_date as string) : undefined,
          emails: Array.isArray(rawEmails) ? (rawEmails as string[]).join(', ') : (rawEmails as string | undefined),
          phones: Array.isArray(phones) ? (phones as string[]).join(', ') : (phones as string | undefined),
          skills: Array.isArray(skills) ? (skills as string[]).join(', ') : (skills as string | undefined),
          experience: experience as string | undefined,
          lead_type: (await detectLeadType(cleanedPostText)) ?? ((lead_type as string | undefined) ?? 'internship'),
          resume_url: resume_url as string | undefined,
          scraped_at: scraped_at ? new Date(scraped_at as string) : new Date(),
        },
      },
      claimToken,
      claimTokenExpiry,
      claimEmailSent: false,
      status: 'unclaimed',
      isActive: true,
      createdAt: new Date(),
    });
    console.log('Scraper Post Data:- ',doc.SectionData);
    console.log('[Scraper] ✅ Document saved | id:', doc._id, '| isActive:', doc.isActive, '| source:', doc.source, '| status:', doc.status);
  } catch (saveErr) {
    console.log('[Scraper] ❌ Failed to save document:', saveErr);
    return NextResponse.json({ success: false, error: String(saveErr) }, { status: 500 });
  }

  // 6. Send emails
  const emails = extractEmails(rawEmails);
  const posterName = String(name ?? 'there');
  const postText = cleanedPostText;

  const emailResults = await Promise.allSettled(
    emails.map(async (email) => {
      const alreadySent = await EmailLog.exists({
        to: email,
        template: 'claim_invite',
        status: 'sent',
      });
      if (alreadySent) return false;
      const claimUrl = `${appUrl}/claim/${claimToken}?email=${encodeURIComponent(email)}`;
      console.log('[Scraper] Sending claim email to:', email, '| claimUrl:', claimUrl);
      const result = await sendClaimInviteEmail(email, posterName, claimUrl, postText);
      console.log('[Scraper] Email send result for', email, ':', result);
      return result;
    })
  );

  const sentCount = emailResults.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  console.log('[Scraper] Emails sent:', sentCount, '/', emails.length);

  if (sentCount > 0) {
    await OjtWall.updateOne({ _id: doc._id }, { claimEmailSent: true, claimEmailSentAt: new Date() });
  }

  console.log('[Scraper] ✅ Done | docId:', doc._id, '| emailsSent:', sentCount);
  console.log('[Scraper] ────────────────────────────────────────────────');

  return NextResponse.json({
    success: true,
    data: doc,
  }, { status: 201 });
}
