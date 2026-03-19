import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Company from '@/models/Company';
import University from '@/models/University';
import { auth } from '@/lib/auth';

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
    const body = await req.json();
    let profile = null;
    if (profileType === 'student') profile = await Student.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    else if (profileType === 'company') profile = await Company.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    else if (profileType === 'university_admin') profile = await University.findByIdAndUpdate(profileRef, body, { new: true }).lean();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
