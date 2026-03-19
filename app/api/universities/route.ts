import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import University from '@/models/University';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('verificationStatus');
    const slug = searchParams.get('slug');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (status) query.verificationStatus = status;
    if (slug) query.slug = slug;
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [universities, total] = await Promise.all([
      University.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      University.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: universities, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
