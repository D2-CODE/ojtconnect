import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OjtWall from '@/models/OjtWall';
import EmailLog from '@/models/EmailLog';
import { auth } from '@/lib/auth';

type Period = 'day' | 'week' | 'month';

function getBuckets(period: Period) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (period === 'day') {
    // Last 24 hours, 1-hour buckets
    for (let i = 23; i >= 0; i--) {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - i);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      buckets.push({ label: `${start.getHours()}:00`, start, end });
    }
  } else if (period === 'week') {
    // Last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      buckets.push({ label: days[start.getDay()], start, end });
    }
  } else {
    // Last 30 days, grouped by week
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i * 7 - 6);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() - i * 7);
      const weekNum = 4 - i;
      buckets.push({ label: `Week ${weekNum}`, start, end });
    }
  }
  return buckets;
}

async function countInBuckets(
  model: typeof User | typeof OjtWall | typeof EmailLog,
  buckets: ReturnType<typeof getBuckets>,
  dateField: string
) {
  return Promise.all(
    buckets.map(({ start, end }) =>
      (model as any).countDocuments({ [dateField]: { $gte: start, $lt: end } })
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const period = (req.nextUrl.searchParams.get('period') || 'week') as Period;
    await connectDB();

    const buckets = getBuckets(period);

    const [userCounts, postCounts, emailCounts] = await Promise.all([
      countInBuckets(User, buckets, 'createdAt'),
      countInBuckets(OjtWall, buckets, 'createdAt'),
      countInBuckets(EmailLog, buckets, 'createdAt'),
    ]);

    const data = buckets.map((b, i) => ({
      label: b.label,
      users: userCounts[i],
      posts: postCounts[i],
      emails: emailCounts[i],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
