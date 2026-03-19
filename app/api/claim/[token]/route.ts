import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const post = await OjtWall.findOne({ claimToken: token }).lean();
    if (!post) return NextResponse.json({ success: false, error: 'Invalid claim link' }, { status: 404 });
    if (post.status === 'claimed') return NextResponse.json({ success: false, error: 'already_claimed', data: post }, { status: 400 });
    if (post.claimTokenExpiry && new Date(post.claimTokenExpiry) < new Date()) {
      return NextResponse.json({ success: false, error: 'token_expired', data: post }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { token } = await params;
    const post = await OjtWall.findOne({ claimToken: token });
    if (!post) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 404 });
    if (post.status === 'claimed') return NextResponse.json({ success: false, error: 'Already claimed' }, { status: 400 });
    post.status = 'claimed';
    post.claimedBy = session.user.userId;
    post.claimedAt = new Date();
    await post.save();
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
