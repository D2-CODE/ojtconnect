import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET — validate token only (used by page on load)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });

    await connectDB();
    const rawUser = await User.collection.findOne({ resetToken: token });
    console.log('[ResetPassword] token:', token, '| rawUser:', rawUser ? { id: rawUser._id, expiry: rawUser.resetTokenExpiry } : null);

    if (!rawUser) return NextResponse.json({ success: false, error: 'Invalid or expired reset link' }, { status: 400 });

    const expiry = rawUser.resetTokenExpiry as Date | undefined;
    if (!expiry || expiry < new Date()) {
      return NextResponse.json({ success: false, error: 'Reset link has expired' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password)
      return NextResponse.json({ success: false, error: 'Token and password are required' }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 422 });

    await connectDB();
    const rawUser = await User.collection.findOne({ resetToken: token });
    const expiry = rawUser?.resetTokenExpiry as Date | undefined;

    if (!rawUser || !expiry || expiry < new Date())
      return NextResponse.json({ success: false, error: 'Invalid or expired reset link' }, { status: 400 });

    await User.collection.updateOne(
      { resetToken: token },
      { $set: { password: await bcrypt.hash(password, 10) }, $unset: { resetToken: '', resetTokenExpiry: '' } }
    );

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
