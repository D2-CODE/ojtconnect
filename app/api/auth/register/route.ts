import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import Student from '@/models/Student';
import Company from '@/models/Company';
import University from '@/models/University';
import { generateId, slugify } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, profileType, universityId, course, yearLevel, companyName, industry, location, website, universityName } = body;

    if (!name || !email || !password || !profileType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });

    const role = await Role.findOne({ roleName: profileType === 'university' ? 'university_admin' : profileType });
    if (!role) return NextResponse.json({ success: false, error: 'Invalid profile type' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    const profileId = generateId();

    let profileRef: string | undefined = undefined;
    const actualProfileType = profileType === 'university' ? 'university_admin' : profileType;

    if (profileType === 'student') {
      await Student.create({
        _id: profileId, userId,
        firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') || '',
        displayName: name, course: course || '', yearLevel: yearLevel || 1,
        universityId: universityId || null, contactEmail: email,
        universityVerificationStatus: 'unverified', isVisible: false, ojtHoursRequired: 300,
      });
      profileRef = profileId;
    } else if (profileType === 'company') {
      await Company.create({
        _id: profileId, userId,
        companyName: companyName || name, slug: slugify(companyName || name),
        industry: industry || '', location: location || '', email, website: website || '',
        isVisible: true, isVerified: false, internSlotsOpen: 0, acceptsMOA: true,
      });
      profileRef = profileId;
    } else if (profileType === 'university') {
      await University.create({
        _id: profileId, userId,
        name: universityName || name, slug: slugify(universityName || name),
        location: location || '', email, website: website || '',
        verificationStatus: 'pending', isActive: true, studentCount: 0,
      });
      profileRef = profileId;
    }

    await User.create({
      _id: userId, name, email: email.toLowerCase(),
      password: hashedPassword, role: role._id,
      profileType: actualProfileType, profileRef,
      isActive: true, profileComplete: false,
    });

    // Send welcome email (non-blocking)
    const roleForEmail = profileType as 'student' | 'company' | 'university';
    sendWelcomeEmail(email, name, roleForEmail).catch(() => {});

    return NextResponse.json({ success: true, message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
