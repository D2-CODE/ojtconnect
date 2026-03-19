import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search');
    const setup = searchParams.get('setup');
    const universityId = searchParams.get('universityId');
    const verificationStatus = searchParams.get('verificationStatus');

    const isAdmin = session?.user?.roleName === 'super_admin';
    const isUniAdmin = session?.user?.roleName === 'university_admin';

    const query: Record<string, unknown> = {};
    if (!isAdmin) query.isVisible = true;
    if (setup) query.preferredSetup = setup;
    if (universityId) query.universityId = universityId;
    if (verificationStatus) query.universityVerificationStatus = verificationStatus;
    else if (!isAdmin && !isUniAdmin) query.universityVerificationStatus = 'verified';
    if (search) {
      query['$or'] = [
        { displayName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: students, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
