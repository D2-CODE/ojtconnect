import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateClaimToken } from '@/lib/utils';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true });

    const token = generateClaimToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { resetToken: token, resetTokenExpiry: expiry } },
      { strict: false }
    );

    console.log('[ForgotPassword] token saved for:', user.email, '| token:', token, '| expiry:', expiry);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
