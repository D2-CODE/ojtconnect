import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailLog from '@/models/EmailLog';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const search = searchParams.get('search');
    if (search) query['$or'] = [{ to: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      EmailLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EmailLog.countDocuments(query),
    ]);
    return NextResponse.json({ success: true, data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
