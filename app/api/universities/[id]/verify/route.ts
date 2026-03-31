import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import University from '@/models/University';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { sendUniversityVerifiedEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const { action, reason } = await req.json();

    const update: Record<string, unknown> = {};
    if (action === 'verify') {
      update.verificationStatus = 'verified';
      update.verifiedAt = new Date();
      update.verifiedBy = session.user.userId;
    } else if (action === 'reject') {
      update.verificationStatus = 'rejected';
      update.rejectionReason = reason;
    }

    const uni = await University.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!uni) return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });

    // Send email to the school admin
    if (action === 'verify' || action === 'reject') {
      const adminUser = await User.findById(uni.userId).lean<{ email: string; name: string }>();
      const adminEmail = adminUser?.email || uni.email;
      const adminName = adminUser?.name || uni.name;
      if (adminEmail) {
        sendUniversityVerifiedEmail(
          adminEmail,
          adminName,
          uni.name,
          action === 'verify' ? 'verified' : 'rejected',
          reason
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: uni });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
