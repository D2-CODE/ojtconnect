import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import { auth } from '@/lib/auth';

async function resolveProfileRef(userId: string, sessionProfileRef?: string | null): Promise<string | null> {
  if (sessionProfileRef) return sessionProfileRef;
  const User = (await import('@/models/User')).default;
  const user = await User.findById(userId).lean<{ profileRef?: string }>();
  return user?.profileRef ?? null;
}

function checkOwner(post: any, profileRef: string | null, userName: string | null): boolean {
  if (profileRef && post.postedBy === profileRef) return true;
  if (!post.postedBy && userName) {
    const name = userName.toLowerCase();
    const fbleadsName: string = post.SectionData?.fbleads?.name ?? '';
    const postedByName: string = post.postedByName ?? '';
    return fbleadsName.toLowerCase().includes(name) || postedByName.toLowerCase().includes(name);
  }
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const post = await OjtWall.findById(id).lean();
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const post = await OjtWall.findById(id).lean();
    if (!post) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isAdmin = session.user.roleName === 'super_admin';
    const profileRef = await resolveProfileRef(session.user.userId, session.user.profileRef);
    const isOwner = isAdmin || checkOwner(post, profileRef, session.user.name ?? null);
    if (!isOwner) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    // Admin-only: toggle hide/unhide
    if (isAdmin && body.action === 'toggle-hide') {
      const nowHidden = post.isActive !== false && post.status !== 'hidden';
      const updated = await OjtWall.findByIdAndUpdate(
        id,
        { $set: { isActive: !nowHidden, status: nowHidden ? 'hidden' : 'unclaimed' } },
        { new: true }
      ).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    const { title, description, skills, setup, location, allowance, slots, hoursRequired, deadline } = body;
    const isNativePost = (post.source === 'company' || post.source === 'student') && !post.SectionData?.fbleads?.name;
    const updateFields: Record<string, unknown> = {
      title, description, skills, setup, location, allowance, slots, hoursRequired,
      deadline: deadline ? new Date(deadline) : undefined,
    };
    if (!isNativePost) {
      updateFields['SectionData.fbleads.post_text'] = description;
      updateFields['SectionData.fbleads.skills'] = Array.isArray(skills) ? skills.join(', ') : (skills || '');
    }

    const updated = await OjtWall.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const post = await OjtWall.findById(id).lean();
    if (!post) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isAdmin = session.user.roleName === 'super_admin';
    const profileRef = await resolveProfileRef(session.user.userId, session.user.profileRef);
    const isOwner = isAdmin || checkOwner(post, profileRef, session.user.name ?? null);
    if (!isOwner) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await OjtWall.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
