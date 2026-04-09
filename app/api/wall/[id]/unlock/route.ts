import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import ContactUnlock from '@/models/ContactUnlock';

const DAILY_LIMIT = 5;
const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000);
const withinWindow = (profileId: string) => ({
  companyProfileId: profileId,
  $or: [{ unlockedAt: { $gte: since24h() } }, { unlockedAt: { $exists: false } }],
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ unlocked: false, remaining: DAILY_LIMIT, requiresLogin: true });

    const { id: postId } = await params;
    await connectDB();

    const profileId = session.user.profileRef;
    if (!profileId) return NextResponse.json({ unlocked: false, remaining: 0 });

    const filter = withinWindow(profileId);
    const [alreadyUnlocked, usedToday, oldest] = await Promise.all([
      ContactUnlock.findOne({ ...filter, postId }).lean(),
      ContactUnlock.countDocuments(filter),
      ContactUnlock.findOne(filter).sort({ unlockedAt: 1 }).lean<{ unlockedAt: Date }>(),
    ]);

    const resetAt = oldest?.unlockedAt
      ? new Date(oldest.unlockedAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

    return NextResponse.json({
      unlocked: !!alreadyUnlocked,
      remaining: Math.max(0, DAILY_LIMIT - usedToday),
      resetAt,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });

    const { id: postId } = await params;
    await connectDB();

    const profileId = session.user.profileRef;
    if (!profileId) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 400 });

    const filter = withinWindow(profileId);

    // Already unlocked this post — free re-view
    const existing = await ContactUnlock.findOne({ ...filter, postId }).lean();
    if (existing) {
      const usedToday = await ContactUnlock.countDocuments(filter);
      return NextResponse.json({ success: true, unlocked: true, remaining: Math.max(0, DAILY_LIMIT - usedToday) });
    }

    // Check daily limit
    const usedToday = await ContactUnlock.countDocuments(filter);
    if (usedToday >= DAILY_LIMIT) {
      const oldest = await ContactUnlock.findOne(filter).sort({ unlockedAt: 1 }).lean<{ unlockedAt: Date }>();
      const resetAt = oldest?.unlockedAt
        ? new Date(oldest.unlockedAt.getTime() + 24 * 60 * 60 * 1000)
        : null;
      return NextResponse.json({ success: false, error: 'Daily limit reached', remaining: 0, resetAt }, { status: 429 });
    }

    await ContactUnlock.create({ _id: generateId(), companyProfileId: profileId, postId, unlockedAt: new Date() });

    return NextResponse.json({ success: true, unlocked: true, remaining: Math.max(0, DAILY_LIMIT - (usedToday + 1)) });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
