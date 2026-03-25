import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import User from '@/models/User';
import Company from '@/models/Company';
import Student from '@/models/Student';
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
        leadType: post.SectionData?.fbleads?.lead_type ?? 'internship',
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

    const leadType = post.SectionData?.fbleads?.lead_type ?? 'internship';
    const isStudent = leadType === 'intern';

    let userId: string;
    let profileId: string | null = null;
    let autoLoginUrl: string | null = null;

    if (session?.user) {
      console.log('[Claim] Already logged in as', session.user.userId);
      userId = session.user.userId;
      profileId = session.user.profileRef ?? null;
    } else {
      const claimEmail = emailFromQuery || post.SectionData?.fbleads?.emails?.split(',')[0]?.trim() || '';
      console.log('[Claim] claimEmail:', claimEmail, '| leadType:', leadType);
      if (!claimEmail) return NextResponse.json({ success: false, error: 'No email found to create account' }, { status: 400 });

      let user = await User.findOne({ email: claimEmail.toLowerCase() });
      console.log('[Claim] existing user:', user ? user._id : 'none');

      if (!user) {
        const rawPassword = generateClaimToken().slice(0, 12);
        const alToken = generateClaimToken();
        const alExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const newUserId = generateId();
        const displayName = post.SectionData?.fbleads?.name ?? claimEmail.split('@')[0];

        if (isStudent) {
          // --- Student claim ---
          const studentRole = await Role.findOne({ roleName: 'student' });
          if (!studentRole) return NextResponse.json({ success: false, error: 'Student role not found' }, { status: 500 });

          const studentId = generateId();
          const nameParts = displayName.split(' ');

          await Student.create({
            _id: studentId,
            userId: newUserId,
            firstName: nameParts[0] ?? displayName,
            lastName: nameParts.slice(1).join(' ') || '',
            displayName,
            contactEmail: claimEmail,
            skills: post.SectionData?.fbleads?.skills
              ? post.SectionData.fbleads.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
            ojtHoursRequired: 300,
            isVisible: true,
          });

          user = await User.create({
            _id: newUserId,
            name: displayName,
            email: claimEmail.toLowerCase(),
            password: await bcrypt.hash(rawPassword, 10),
            role: studentRole._id,
            profileType: 'student',
            profileRef: studentId,
            isActive: true,
            profileComplete: false,
            autoLoginToken: alToken,
            autoLoginTokenExpiry: alExpiry,
          });

          profileId = studentId;
          autoLoginUrl = `${appUrl}/api/auth/auto-login?token=${alToken}`;
        } else {
          // --- Company claim ---
          const companyRole = await Role.findOne({ roleName: 'company' });
          if (!companyRole) return NextResponse.json({ success: false, error: 'Company role not found' }, { status: 500 });

          const companyId = generateId();

          await Company.create({
            _id: companyId,
            userId: newUserId,
            companyName: displayName,
            slug: slugify(displayName) + '-' + companyId.slice(-4),
            email: claimEmail,
            isVerified: false,
            isVisible: true,
          });

          user = await User.create({
            _id: newUserId,
            name: displayName,
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

          profileId = companyId;
          autoLoginUrl = `${appUrl}/api/auth/auto-login?token=${alToken}`;
        }

        try {
          await sendClaimCredentialsEmail(claimEmail, displayName, rawPassword, autoLoginUrl);
        } catch (emailErr) {
          console.error('[Claim] Failed to send credentials email:', emailErr);
        }
      } else {
        autoLoginUrl = `${appUrl}/login?email=${encodeURIComponent(claimEmail)}`;
      }

      userId = user._id;
    }

    // Mark post as claimed + stamp ownership so edit/delete works
    post.status = 'claimed';
    post.claimedBy = userId;
    post.claimedAt = new Date();
    if (profileId) {
      post.postedBy = profileId;
      post.postedByName = post.SectionData?.fbleads?.name ?? '';
      post.source = isStudent ? 'student' : 'company';
    }
    await post.save();

    return NextResponse.json({
      success: true,
      data: { id: post._id, autoLoginUrl },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
