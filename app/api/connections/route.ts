import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';
import Student from '@/models/Student';
import Company from '@/models/Company';
import User from '@/models/User';
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

    // Populate names from profiles
    const profileIds = new Set<string>();
    connections.forEach((c) => { if (c.fromProfileId) profileIds.add(c.fromProfileId); if (c.toProfileId) profileIds.add(c.toProfileId); });

    const [students, companies] = await Promise.all([
      Student.find({ _id: { $in: [...profileIds] } }).select('_id firstName lastName displayName').lean(),
      Company.find({ _id: { $in: [...profileIds] } }).select('_id companyName').lean(),
    ]);

    const nameMap: Record<string, string> = {};
    students.forEach((s) => { nameMap[s._id] = s.displayName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'; });
    companies.forEach((c) => { nameMap[c._id] = c.companyName; });

    const enriched = connections.map((c) => ({
      ...c,
      fromName: nameMap[c.fromProfileId] || 'Unknown',
      toName: nameMap[c.toProfileId] || 'Unknown',
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const role = session.user.roleName;
    if (role !== 'company' && role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only companies and students can connect' }, { status: 403 });
    }

    await connectDB();
    const { toId, toType, message } = await req.json();

    if (!toId || !toType) {
      return NextResponse.json({ success: false, error: 'toId and toType are required' }, { status: 400 });
    }

    const fromProfileId = session.user.profileRef;
    const fromType = role as 'company' | 'student';

    // Resolve toUserId from the target profile
    const toUser = await User.findOne({ profileRef: toId }).lean();
    if (!toUser) return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });

    // Prevent duplicate pending connection
    const existing = await Connection.findOne({
      fromUserId: session.user.userId,
      toUserId: toUser._id,
      status: 'pending',
    }).lean();
    if (existing) return NextResponse.json({ success: false, error: 'Connection request already sent' }, { status: 409 });

    const conn = await Connection.create({
      _id: generateId(),
      fromUserId: session.user.userId,
      fromType,
      fromProfileId,
      toUserId: toUser._id,
      toType,
      toProfileId: toId,
      message: message || '',
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: conn }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
