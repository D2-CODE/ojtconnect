import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { detectLeadType, detectLeadTypeWithDB } from '@/lib/detectLeadType';
import Keywords from '@/models/Keywords';

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
    const showHidden = searchParams.get('showHidden') === 'true';
    const hasContact = searchParams.get('hasContact') === 'true';
    const dateFrom = searchParams.get('dateFrom');
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
      andClauses.push({ isActive: true });
    } else {
      if (!showHidden) andClauses.push({ isActive: true });
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

    if (hasContact) {
      andClauses.push({
        $or: [
          { 'SectionData.fbleads.emails': { $exists: true, $ne: '' } },
          { 'SectionData.fbleads.phones': { $exists: true, $ne: '' } },
        ],
      });
    }

    if (dateFrom) {
      andClauses.push({ createdAt: { $gte: new Date(dateFrom) } });
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
    // source is always role-based; detectLeadType is informational only (not used for native posts)
    const finalSource = role === 'company' ? 'company' : 'student';
    const post = await OjtWall.create({
      _id: generateId(),
      source: finalSource,
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

// Bulk reclassify all scraped posts using keyword detection (admin only)
export async function PUT(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const posts = await OjtWall.find({ source: 'scraped' })
      .select('_id SectionData')
      .lean<{ _id: string; SectionData?: { fbleads?: { post_text?: string; lead_type?: string } } }[]>();

    const kwDoc = await Keywords.findOne().lean<{ companyKeywords: string[]; studentKeywords: string[] }>();
    const dbKeywords: { keyword: string; type: 'company' | 'student' }[] = [
      ...(kwDoc?.companyKeywords ?? []).map(k => ({ keyword: k, type: 'company' as const })),
      ...(kwDoc?.studentKeywords ?? []).map(k => ({ keyword: k, type: 'student' as const })),
    ];

    let changed = 0;
    const bulkOps: Array<{ updateOne: { filter: { _id: string }; update: { $set: { 'SectionData.fbleads.lead_type': string } } } }> = [];

    for (const post of posts) {
      const text = post.SectionData?.fbleads?.post_text || '';
      const detected = detectLeadTypeWithDB(text, dbKeywords);
      if (!detected) continue;
      if (detected === post.SectionData?.fbleads?.lead_type) continue;
      bulkOps.push({
        updateOne: {
          filter: { _id: post._id },
          update: { $set: { 'SectionData.fbleads.lead_type': detected } },
        },
      });
      changed++;
    }

    if (bulkOps.length > 0) await OjtWall.bulkWrite(bulkOps as any);

    return NextResponse.json({ success: true, total: posts.length, changed });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
