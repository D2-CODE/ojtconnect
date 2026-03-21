import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import EmailLog from '@/models/EmailLog';
import { generateId, generateClaimToken } from '@/lib/utils';
import { sendClaimInviteEmail } from '@/lib/email';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.SCRAPER_API_KEY;
}

/** Normalise emails field → always returns a clean string[] */
function extractEmails(emails: unknown): string[] {
  if (!emails) return [];
  const raw = Array.isArray(emails) ? emails : [emails];
  return raw
    .map((e) => String(e).trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// ---------------------------------------------------------------------------
// POST /api/scraper/import
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. API key guard
  if (!validateApiKey(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // 3. Basic validation — post_text or name must exist
  const {
    name,
    fb_id,
    profile_url,
    profile_pic,
    post_text,
    post_link,
    post_date,
    emails: rawEmails,
    phones,
    skills,
    experience,
    lead_type,
    resume_url,
    scraped_at,
  } = body as Record<string, unknown>;

  if (!name && !post_text) {
    return NextResponse.json(
      { success: false, error: 'At least one of name or post_text is required' },
      { status: 422 }
    );
  }

  if (lead_type && !['intern', 'internship'].includes(lead_type as string)) {
    return NextResponse.json(
      { success: false, error: 'lead_type must be "intern" or "internship"' },
      { status: 422 }
    );
  }

  // 4. Build document
  await connectDB();

  const claimToken = generateClaimToken();
  const claimTokenExpiry = new Date(
    Date.now() + Number(process.env.CLAIM_TOKEN_EXPIRY_DAYS ?? 7) * 86_400_000
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const doc = await OjtWall.create({
    _id: generateId(),
    SectionData: {
      fbleads: {
        name: name as string | undefined,
        fb_id: fb_id as string | undefined,
        profile_url: profile_url as string | undefined,
        profile_pic: profile_pic as string | undefined,
        post_text: post_text as string | undefined,
        post_link: post_link as string | undefined,
        post_date: post_date ? new Date(post_date as string) : undefined,
        emails: Array.isArray(rawEmails) ? (rawEmails as string[]).join(', ') : (rawEmails as string | undefined),
        phones: Array.isArray(phones) ? (phones as string[]).join(', ') : (phones as string | undefined),
        skills: Array.isArray(skills) ? (skills as string[]).join(', ') : (skills as string | undefined),
        experience: experience as string | undefined,
        lead_type: (lead_type as string | undefined) ?? 'internship',
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

  // 5. Send claim invite to ALL valid emails — each with its own ?email= query param
  // Skip any email that already received a sent email today for this post
  const emails = extractEmails(rawEmails);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const posterName = String(name ?? 'there');
  const postText = String(post_text ?? '');

  const emailResults = await Promise.allSettled(
    emails.map(async (email) => {
      const alreadySentToday = await EmailLog.exists({
        to: email,
        template: 'claim_invite',
        status: 'sent',
        sentAt: { $gte: todayStart },
      });
      if (alreadySentToday) return false;
      const claimUrl = `${appUrl}/claim/${claimToken}?email=${encodeURIComponent(email)}`;
      return sendClaimInviteEmail(email, posterName, claimUrl, postText);
    })
  );

  const sentCount = emailResults.filter(
    (r) => r.status === 'fulfilled' && r.value === true
  ).length;

  if (sentCount > 0) {
    await OjtWall.updateOne(
      { _id: doc._id },
      { claimEmailSent: true, claimEmailSentAt: new Date() }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: doc._id,
      claimToken,
      emailsSentTo: emails,
      emailsSent: sentCount,
    },
  }, { status: 201 });
}
