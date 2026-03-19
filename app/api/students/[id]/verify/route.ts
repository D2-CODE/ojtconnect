import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import University from '@/models/University';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !['university_admin', 'super_admin'].includes(session.user.roleName)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const { action, reason } = await req.json();

    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });

    // University admin can only verify students from their university
    if (session.user.roleName === 'university_admin') {
      const uniAdmin = await University.findOne({ userId: session.user.userId });
      if (!uniAdmin || String(uniAdmin._id) !== String(student.universityId)) {
        return NextResponse.json({ success: false, error: 'Cannot verify student from another university' }, { status: 403 });
      }
    }

    if (action === 'verify') {
      student.universityVerificationStatus = 'verified';
      student.universityVerifiedAt = new Date();
      student.universityVerifiedBy = session.user.userId;
      student.isVisible = true;
      await User.findOneAndUpdate({ profileRef: id }, { profileComplete: true });
    } else if (action === 'reject') {
      student.universityVerificationStatus = 'rejected';
      student.universityRejectionReason = reason;
      student.isVisible = false;
    } else if (action === 'request') {
      student.universityVerificationStatus = 'pending';
    }

    await student.save();

    // Update university student count
    if (action === 'verify') {
      await University.findByIdAndUpdate(student.universityId, { $inc: { studentCount: 1 } });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
