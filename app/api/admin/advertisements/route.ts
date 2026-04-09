import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import { auth } from '@/lib/auth';
import { generateId } from '@/lib/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const ads = await Advertisement.find().sort({ slot: 1, order: 1 }).lean();
    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { slot, imageUrl, linkUrl, order } = await req.json();

    if (!slot || !imageUrl)
      return NextResponse.json({ success: false, error: 'slot and imageUrl are required' }, { status: 400 });

    const ad = await Advertisement.create({
      _id: generateId(),
      slot,
      imageUrl,
      linkUrl: linkUrl || undefined,
      order: order ?? 0,
      isActive: true,
    });

    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
