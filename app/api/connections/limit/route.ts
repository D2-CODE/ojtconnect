import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'company') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await Connection.countDocuments({
      fromUserId: session.user.userId,
      fromType: 'company',
      createdAt: { $gte: since },
    });

    const oldest = await Connection.findOne({
      fromUserId: session.user.userId,
      fromType: 'company',
      createdAt: { $gte: since },
    }).sort({ createdAt: 1 }).lean<{ createdAt: Date }>();

    const resetAt = oldest ? new Date(oldest.createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

    return NextResponse.json({ success: true, used, limit: 3, remaining: Math.max(0, 3 - used), resetAt });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
