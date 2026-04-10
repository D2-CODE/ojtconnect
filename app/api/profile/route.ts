import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Company from '@/models/Company';
import University from '@/models/University';
import { auth } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { profileType, profileRef } = session.user;
    if (!profileRef) return NextResponse.json({ success: true, data: null });
    let profile = null;
    if (profileType === 'student') profile = await Student.findById(profileRef).lean();
    else if (profileType === 'company') profile = await Company.findById(profileRef).lean();
    else if (profileType === 'university_admin') profile = await University.findById(profileRef).lean();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { profileType, profileRef } = session.user;
    if (!profileRef) return NextResponse.json({ success: false, error: 'No profile found' }, { status: 404 });
    const raw = await req.json();
    // Strip empty strings on enum fields to prevent Mongoose ValidationError
    const ENUM_FIELDS = ['preferredSetup', 'setup', 'companySize'];
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (ENUM_FIELDS.includes(k) && v === '') continue;
      body[k] = v;
    }
    let profile = null;
    if (profileType === 'student') profile = await Student.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    else if (profileType === 'company') profile = await Company.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    else if (profileType === 'university_admin') {
      // Regenerate slug from full name whenever name changes
      if (body.name && typeof body.name === 'string') {
        const newSlug = slugify(body.name);
        // Ensure slug is unique (append id suffix if taken by another university)
        const existing = await University.findOne({ slug: newSlug, _id: { $ne: profileRef } }).lean();
        body.slug = existing ? `${newSlug}-${profileRef.slice(-4)}` : newSlug;
      }
      profile = await University.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    }
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
