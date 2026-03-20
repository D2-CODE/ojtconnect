import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import University from '@/models/University';
import Student from '@/models/Student';
import Company from '@/models/Company';
import OjtWall from '@/models/OjtWall';
import Connection from '@/models/Connection';
import EmailLog from '@/models/EmailLog';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const [totalUsers, totalUniversities, pendingUniversities, totalStudents, pendingStudents, totalCompanies, totalPosts, totalConnections, emailsSent] = await Promise.all([
      User.countDocuments(),
      University.countDocuments(),
      University.countDocuments({ verificationStatus: 'pending' }),
      Student.countDocuments(),
      Student.countDocuments({ universityVerificationStatus: 'pending' }),
      Company.countDocuments(),
      OjtWall.countDocuments({ isActive: true }),
      Connection.countDocuments(),
      EmailLog.countDocuments({ status: 'sent' }),
    ]);
    return NextResponse.json({ success: true, data: { users: totalUsers, universities: totalUniversities, pendingUniversities, students: totalStudents, pendingStudents, companies: totalCompanies, wallPosts: totalPosts, connections: totalConnections, emailLogs: emailsSent } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
