import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const mine = searchParams.get('mine') === 'true';
    let postedBy = searchParams.get('postedBy');

    let mineUserName: string | null = null;
    if (mine) {
      const session = await auth();
      if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      mineUserName = session.user.name ?? null;
      postedBy = session.user.profileRef;
      if (!postedBy) {
        const User = (await import('@/models/User')).default;
        const user = await User.findById(session.user.userId).lean<{ profileRef?: string }>();
        postedBy = user?.profileRef ?? null;
      }
    }

    const andClauses: Record<string, unknown>[] = [];

    if (mine) {
      if (postedBy) andClauses.push({ postedBy });
      else if (mineUserName) andClauses.push({ postedByName: { $regex: mineUserName, $options: 'i' } });
    } else {
      andClauses.push({ isActive: true });
      if (postedBy) andClauses.push({ postedBy });
      if (source) andClauses.push({ source });
      if (type === 'intern' || type === 'internship') {
        const nativeSource = type === 'intern' ? 'student' : 'company';
        andClauses.push({
          $or: [
            { source: nativeSource },
            { source: 'scraped', 'SectionData.fbleads.lead_type': type },
          ],
        });
      }
      if (status && status !== 'all') andClauses.push({ status });
    }

    if (search) {
      andClauses.push({
        $or: [
          { 'SectionData.fbleads.name': { $regex: search, $options: 'i' } },
          { 'SectionData.fbleads.post_text': { $regex: search, $options: 'i' } },
          { 'SectionData.fbleads.skills': { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      OjtWall.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OjtWall.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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
      return NextResponse.json({ success: false, error: 'Only companies and students can post' }, { status: 403 });
    }
    await connectDB();
    let profileRef = session.user.profileRef;
    if (!profileRef) {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.userId).lean<{ profileRef?: string }>();
      profileRef = user?.profileRef ?? null;
    }
    if (!profileRef) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 400 });
    // Fetch student display name — no verification gate
    let displayName = session.user.name;
    let isStudentVerified = false;
    if (role === 'student') {
      const Student = (await import('@/models/Student')).default;
      const student = await Student.findById(profileRef).lean<{ universityVerificationStatus: string }>();
      isStudentVerified = student?.universityVerificationStatus === 'verified';
    }
    const body = await req.json();
    const { title, description, skills, setup, location, allowance, slots, hoursRequired, deadline } = body;
    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }
    // Use company name for display instead of user login name
    if (role === 'company') {
      const Company = (await import('@/models/Company')).default;
      const company = await Company.findById(profileRef).lean<{ companyName?: string }>();
      if (company?.companyName) displayName = company.companyName;
    }
    const leadType = role === 'company' ? 'internship' : 'intern';
    const post = await OjtWall.create({
      _id: generateId(),
      source: role,
      postedBy: profileRef,
      postedByName: displayName,
      isStudentVerified: role === 'student' ? isStudentVerified : undefined,
      title,
      description,
      skills: skills || [],
      setup: setup || '',
      location: location || '',
      allowance: allowance || '',
      slots: slots || 1,
      hoursRequired: hoursRequired || 300,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'unclaimed',
      isActive: true,
      createdAt: new Date(),
    });
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
