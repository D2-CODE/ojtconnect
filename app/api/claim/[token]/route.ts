import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import User from '@/models/User';
import Company from '@/models/Company';
import Role from '@/models/Role';
import { auth } from '@/lib/auth';
import { sendClaimCredentialsEmail } from '@/lib/email';
import { generateId, generateClaimToken, slugify } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const emailFromQuery = req.nextUrl.searchParams.get('email') ?? '';
    const post = await OjtWall.findOne({ claimToken: token }).lean();
    if (!post) return NextResponse.json({ success: false, error: 'Invalid claim link' }, { status: 404 });
    if (post.status === 'claimed') return NextResponse.json({ success: false, error: 'already_claimed' }, { status: 400 });
    if (post.claimTokenExpiry && new Date(post.claimTokenExpiry) < new Date()) {
      return NextResponse.json({ success: false, error: 'token_expired' }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: {
        postId: post._id,
        postName: post.SectionData?.fbleads?.name ?? 'Unknown',
        email: emailFromQuery || post.SectionData?.fbleads?.emails?.split(',')[0]?.trim() || '',
        postText: post.SectionData?.fbleads?.post_text ?? '',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const emailFromQuery = req.nextUrl.searchParams.get('email') ?? '';

    const post = await OjtWall.findOne({ claimToken: token });
    if (!post) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 404 });
    if (post.status === 'claimed') return NextResponse.json({ success: false, error: 'Already claimed' }, { status: 400 });

    const session = await auth();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    let userId: string;
    let autoLoginUrl: string | null = null;

    if (session?.user) {
      console.log('[Claim] Already logged in as', session.user.userId);
      userId = session.user.userId;
    } else {
      const claimEmail = emailFromQuery || post.SectionData?.fbleads?.emails?.split(',')[0]?.trim() || '';
      console.log('[Claim] claimEmail:', claimEmail);
      if (!claimEmail) return NextResponse.json({ success: false, error: 'No email found to create account' }, { status: 400 });

      let user = await User.findOne({ email: claimEmail.toLowerCase() });
      console.log('[Claim] existing user:', user ? user._id : 'none');

      if (!user) {
        // New user — create account + company, send credentials email
        const rawPassword = generateClaimToken().slice(0, 12);
        const companyRole = await Role.findOne({ roleName: 'company' });
        if (!companyRole) return NextResponse.json({ success: false, error: 'Company role not found' }, { status: 500 });

        const newUserId = generateId();
        const companyId = generateId();
        const companyName = post.SectionData?.fbleads?.name ?? claimEmail.split('@')[0];
        const alToken = generateClaimToken();
        const alExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await Company.create({
          _id: companyId,
          userId: newUserId,
          companyName,
          slug: slugify(companyName) + '-' + companyId.slice(-4),
          email: claimEmail,
          isVerified: false,
          isVisible: true,
          internSlotsOpen: 0,
          acceptsMOA: true,
        });

        user = await User.create({
          _id: newUserId,
          name: companyName,
          email: claimEmail.toLowerCase(),
          password: await bcrypt.hash(rawPassword, 10),
          role: companyRole._id,
          profileType: 'company',
          profileRef: companyId,
          isActive: true,
          profileComplete: false,
          autoLoginToken: alToken,
          autoLoginTokenExpiry: alExpiry,
        });

        autoLoginUrl = `${appUrl}/api/auth/auto-login?token=${alToken}`;

        // Send credentials email — awaited so errors surface in the catch block
        try {
          await sendClaimCredentialsEmail(claimEmail, companyName, rawPassword, autoLoginUrl);
        } catch (emailErr) {
          console.error('[Claim] Failed to send credentials email:', emailErr);
        }
      } else {
        // Existing user — do NOT change password, just pre-fill email on login page
        autoLoginUrl = `${appUrl}/login?email=${encodeURIComponent(claimEmail)}`;
      }

      userId = user._id;
    }

    // Mark post as claimed
    post.status = 'claimed';
    post.claimedBy = userId;
    post.claimedAt = new Date();
    await post.save();

    return NextResponse.json({
      success: true,
      data: { id: post._id, autoLoginUrl },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
