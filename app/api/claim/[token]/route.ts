import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import User from '@/models/User';
import Company from '@/models/Company';
import Role from '@/models/Role';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
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
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'OJT Connect PH';

    let userId: string;
    let autoLoginUrl: string | null = null;

    if (session?.user) {
      // Already logged in — just claim
      userId = session.user.userId;
    } else {
      const claimEmail = emailFromQuery || post.SectionData?.fbleads?.emails?.split(',')[0]?.trim() || '';
      if (!claimEmail) return NextResponse.json({ success: false, error: 'No email found to create account' }, { status: 400 });

      let user = await User.findOne({ email: claimEmail.toLowerCase() });
      let rawPassword: string;

      if (!user) {
        // Create new user + company
        rawPassword = generateClaimToken().slice(0, 12);
        const companyRole = await Role.findOne({ roleName: 'company' });
        if (!companyRole) return NextResponse.json({ success: false, error: 'Company role not found' }, { status: 500 });

        const newUserId = generateId();
        const companyId = generateId();
        const companyName = post.SectionData?.fbleads?.name ?? claimEmail.split('@')[0];

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
        });

        // Auto-login URL with credentials in query params
        autoLoginUrl = `${appUrl}/login?email=${encodeURIComponent(claimEmail)}&password=${encodeURIComponent(rawPassword)}`;

        // Send credentials email
        const credentialsHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a">
          <h1 style="color:#0F6E56">${appName}</h1>
          <h2>Welcome, ${companyName}!</h2>
          <p>An account has been created for you on <strong>${appName}</strong> after you claimed your post.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;font-size:14px">
            <p style="margin:4px 0"><strong>Email:</strong> ${claimEmail}</p>
            <p style="margin:4px 0"><strong>Password:</strong> ${rawPassword}</p>
          </div>
          <p>Click the button below to log in automatically:</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${autoLoginUrl}" style="background:#0F6E56;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Login to My Account</a>
          </div>
          <p style="color:#6b7280;font-size:12px">You can also sign in manually at <a href="${appUrl}/login">${appUrl}/login</a> using the credentials above.</p>
        </body></html>`;

        await sendEmail(claimEmail, `Your ${appName} account credentials`, credentialsHtml, 'welcome', user._id, 'User');
      } else {
        // User exists — reset to new temp password and return autoLoginUrl directly (no email)
        rawPassword = generateClaimToken().slice(0, 12);
        user.password = await bcrypt.hash(rawPassword, 10);
        await user.save();

        autoLoginUrl = `${appUrl}/login?email=${encodeURIComponent(claimEmail)}&password=${encodeURIComponent(rawPassword)}`;
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
