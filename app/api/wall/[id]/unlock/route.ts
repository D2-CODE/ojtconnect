import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import mongoose, { Schema, Model } from 'mongoose';
import { generateId } from '@/lib/utils';

interface IContactUnlock {
  _id: string;
  companyProfileId: string;
  postId: string;
  unlockedAt: Date;
}

const ContactUnlockSchema = new Schema<IContactUnlock>(
  {
    _id: { type: String, required: true },
    companyProfileId: { type: String, required: true },
    postId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ContactUnlock: Model<IContactUnlock> =
  (mongoose.models.ContactUnlock as Model<IContactUnlock>) ||
  mongoose.model<IContactUnlock>('ContactUnlock', ContactUnlockSchema);

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ unlocked: false, remaining: 3, requiresLogin: true });

    const { id: postId } = await params;
    await connectDB();

    const profileId = session.user.profileRef;
    if (!profileId) return NextResponse.json({ unlocked: false, remaining: 3 });

    const since = since24h();
    const [alreadyUnlocked, usedToday, oldest] = await Promise.all([
      ContactUnlock.findOne({ companyProfileId: profileId, postId }).lean(),
      ContactUnlock.countDocuments({ companyProfileId: profileId, unlockedAt: { $gte: since } }),
      ContactUnlock.findOne({ companyProfileId: profileId, unlockedAt: { $gte: since } })
        .sort({ unlockedAt: 1 }).lean<{ unlockedAt: Date }>(),
    ]);

    const resetAt = oldest ? new Date(oldest.unlockedAt.getTime() + 24 * 60 * 60 * 1000) : null;

    return NextResponse.json({
      unlocked: !!alreadyUnlocked,
      remaining: Math.max(0, 3 - usedToday),
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

    const since = since24h();

    // Already unlocked this post — free re-view
    const existing = await ContactUnlock.findOne({ companyProfileId: profileId, postId }).lean();
    if (existing) return NextResponse.json({ success: true, unlocked: true });

    // Check daily limit
    const usedToday = await ContactUnlock.countDocuments({ companyProfileId: profileId, unlockedAt: { $gte: since } });
    if (usedToday >= 3) {
      const oldest = await ContactUnlock.findOne({ companyProfileId: profileId, unlockedAt: { $gte: since } })
        .sort({ unlockedAt: 1 }).lean<{ unlockedAt: Date }>();
      const resetAt = oldest ? new Date(oldest.unlockedAt.getTime() + 24 * 60 * 60 * 1000) : null;
      return NextResponse.json({ success: false, error: 'Daily limit reached', resetAt }, { status: 429 });
    }

    await ContactUnlock.create({ _id: generateId(), companyProfileId: profileId, postId, unlockedAt: new Date() });

    return NextResponse.json({ success: true, unlocked: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
