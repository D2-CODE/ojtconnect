import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const connections = await Connection.find({
      $or: [{ fromUserId: session.user.userId }, { toUserId: session.user.userId }],
    }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const conn = await Connection.create({ _id: generateId(), ...body, fromUserId: session.user.userId });
    return NextResponse.json({ success: true, data: conn }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
