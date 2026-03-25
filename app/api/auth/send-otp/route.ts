import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/email';

const OTP_SECRET = process.env.NEXTAUTH_SECRET + '_otp';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Sign OTP into JWT — expires in 10 minutes, no DB storage needed
    const token = jwt.sign({ email: email.toLowerCase(), otp }, OTP_SECRET, { expiresIn: '10m' });

    await sendOtpEmail(email, otp);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
