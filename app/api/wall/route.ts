import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OjtWall from '@/models/OjtWall';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = { isActive: true };
    if (type === 'intern' || type === 'internship') query['SectionData.fbleads.lead_type'] = type;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query['$or'] = [
        { 'SectionData.fbleads.name': { $regex: search, $options: 'i' } },
        { 'SectionData.fbleads.post_text': { $regex: search, $options: 'i' } },
        { 'SectionData.fbleads.skills': { $regex: search, $options: 'i' } },
      ];
    }

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
