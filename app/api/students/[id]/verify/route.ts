import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import University from '@/models/University';
import { auth } from '@/lib/auth';
import { sendStudentVerifiedEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const { action, reason } = await req.json();

    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });

    const role = session.user.roleName;

    // Student can only request verification for their own profile
    if (action === 'request') {
      if (role !== 'student' || session.user.profileRef !== id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      if (!student.universityId) {
        return NextResponse.json({ success: false, error: 'Set your university in your profile first' }, { status: 400 });
      }
      if (!['unverified', 'rejected'].includes(student.universityVerificationStatus)) {
        return NextResponse.json({ success: false, error: 'Already pending or verified' }, { status: 400 });
      }
      student.universityVerificationStatus = 'pending';
      await student.save();
      return NextResponse.json({ success: true, data: student });
    }

    // verify / reject — only university_admin or super_admin
    if (!['university_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // University admin can only act on students from their university
    if (role === 'university_admin') {
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
      if (student.universityId) {
        await University.findByIdAndUpdate(student.universityId, { $inc: { studentCount: 1 } });
      }
    } else if (action === 'reject') {
      student.universityVerificationStatus = 'rejected';
      student.universityRejectionReason = reason || '';
      student.isVisible = false;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await student.save();

    // Send email notification to student
    const [studentUser, university] = await Promise.all([
      User.findById(student.userId).lean<{ email: string; name: string }>(),
      student.universityId ? University.findById(student.universityId).lean<{ name: string }>() : null,
    ]);
    const studentEmail = studentUser?.email || student.contactEmail;
    const studentName = studentUser?.name || `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student';
    const uniName = university?.name ?? 'your university';
    if (studentEmail) {
      sendStudentVerifiedEmail(
        studentEmail,
        studentName,
        uniName,
        action === 'verify' ? 'verified' : 'rejected',
        reason
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
