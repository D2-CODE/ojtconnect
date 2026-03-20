import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateClaimToken } from '@/lib/utils';
import { sendEmail } from '@/lib/email';

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
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'OJT Connect PH';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a">
      <h1 style="color:#0F6E56">${appName}</h1>
      <h2>Hello, ${user.name}!</h2>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="background:#0F6E56;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Reset Password</a>
      </div>
      <p style="color:#6b7280;font-size:14px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      <p style="color:#6b7280;font-size:12px">Or copy this link: ${resetUrl}</p>
    </body></html>`;

    await sendEmail(user.email, `Reset your ${appName} password`, html, 'welcome', user._id, 'User');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
