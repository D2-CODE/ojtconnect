import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const OTP_SECRET = process.env.NEXTAUTH_SECRET + '_otp';

export async function POST(req: NextRequest) {
  try {
    const { token, otp } = await req.json();
    if (!token || !otp) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    let payload: { email: string; otp: string };
    try {
      payload = jwt.verify(token, OTP_SECRET) as { email: string; otp: string };
    } catch {
      return NextResponse.json({ success: false, error: 'OTP expired or invalid. Please request a new one.' }, { status: 400 });
    }

    if (payload.otp !== otp.trim()) {
      return NextResponse.json({ success: false, error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: payload.email });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
