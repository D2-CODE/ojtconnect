import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import { auth } from '@/lib/auth';
import { sendClaimInviteEmail, sendWelcomeEmail, sendEmail, layout, btn, h1, p, divider } from '@/lib/email';
import { generateClaimToken } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const allContactPosts = await OjtWall.find(
      {
        isActive: true,
        'SectionData.fbleads.emails': { $exists: true, $ne: '' },
      },
      'status SectionData.fbleads.name SectionData.fbleads.emails SectionData.fbleads.phones SectionData.fbleads.lead_type'
    ).lean<{
      _id: string;
      status: string;
      SectionData?: { fbleads?: { name?: string; emails?: string; phones?: string; lead_type?: string } };
    }[]>();

    const totalPostsWithContact = allContactPosts.length;
    const claimedPosts = allContactPosts.filter((p) => p.status === 'claimed');
    const unclaimedPosts = allContactPosts.filter((p) => p.status !== 'claimed');

    const seen = new Set<string>();
    const unclaimedContacts: { postId: string; name: string; email: string; phone: string; leadType: string }[] = [];

    for (const post of unclaimedPosts) {
      const fb = post.SectionData?.fbleads;
      const rawEmails = fb?.emails ?? '';
      const emails = rawEmails.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
      for (const email of emails) {
        if (seen.has(email)) continue;
        seen.add(email);
        unclaimedContacts.push({
          postId: post._id,
          name: fb?.name ?? '',
          email,
          phone: fb?.phones ?? '',
          leadType: fb?.lead_type ?? '',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: unclaimedContacts,
      meta: {
        totalPostsWithContact,
        totalClaimed: claimedPosts.length,
        totalUnclaimed: unclaimedContacts.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { emails, template, customSubject, customBody } = await req.json() as {
      emails: { email: string; name: string; postId?: string }[];
      template: string;
      customSubject?: string;
      customBody?: string;
    };

    if (!emails?.length || !template)
      return NextResponse.json({ success: false, error: 'emails and template are required' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'OJT Connect PH';
    const expiryMs = 7 * 24 * 60 * 60 * 1000;

    const results = await Promise.allSettled(
      emails.map(async ({ email, name, postId }) => {
        const firstName = (name || email).split(' ')[0];

        if (template === 'claim_invite') {
          // Refresh claim token on the post so the link is valid
          let claimUrl = `${appUrl}/wall`;
          if (postId) {
            const newToken = generateClaimToken();
            const expiry = new Date(Date.now() + expiryMs);
            await OjtWall.updateOne(
              { _id: postId },
              { claimToken: newToken, claimTokenExpiry: expiry }
            );
            claimUrl = `${appUrl}/claim/${newToken}?email=${encodeURIComponent(email)}`;
          }
          return sendClaimInviteEmail(email, name || firstName, claimUrl);
        }

        if (template === 'welcome') {
          return sendWelcomeEmail(email, name || firstName, 'company');
        }

        // Custom template — use sendEmail directly with lib/email layout helpers
        const subject = customSubject || `A message from ${appName}`;
        const bodyHtml = (customBody || '')
          .split('\n')
          .map((line) => p(line || '&nbsp;'))
          .join('');
        const html = layout(`${h1(`Hi ${firstName},`)}${bodyHtml}${divider()}${btn(appUrl, `Visit ${appName}`)}`);
        return sendEmail(email, subject, html, 'generic');
      })
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<boolean>).value
    ).length;

    return NextResponse.json({ success: true, sent, failed: results.length - sent });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
