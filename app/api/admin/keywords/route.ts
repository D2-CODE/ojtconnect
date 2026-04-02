import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Keywords from '@/models/Keywords';
import defaultKeywords from '@/lib/keywords.json';

async function getOrSeed() {
  let doc = await Keywords.findOne().lean<{ companyPriority: string[]; studentPriority: string[]; stripLines: string[] }>();
  if (!doc) {
    doc = await Keywords.create(defaultKeywords);
  }
  return doc;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const doc = await getOrSeed();
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.roleName !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const { companyPriority, studentPriority, stripLines } = body;
    if (!Array.isArray(companyPriority) || !Array.isArray(studentPriority) || !Array.isArray(stripLines)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    const cleaned = {
      companyPriority: companyPriority.map((k: string) => k.trim()).filter(Boolean),
      studentPriority: studentPriority.map((k: string) => k.trim()).filter(Boolean),
      stripLines:      stripLines.map((k: string) => k.trim()).filter(Boolean),
    };
    const doc = await Keywords.findOneAndUpdate({}, { $set: cleaned }, { new: true, upsert: true }).lean();
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
