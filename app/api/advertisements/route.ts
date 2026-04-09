import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const slot = req.nextUrl.searchParams.get('slot');
    const query = slot
      ? { slot, isActive: true }
      : { isActive: true };

    const ads = await Advertisement.find(query).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
