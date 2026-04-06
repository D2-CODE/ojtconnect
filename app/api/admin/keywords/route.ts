import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Keywords from '@/models/Keywords';
import { auth } from '@/lib/auth';
import { COMPANY_PRIORITY, STUDENT_PRIORITY } from '@/lib/detectLeadType';
import { ObjectId } from 'mongoose';

async function adminGuard() {
  const session = await auth();
  if (!session?.user || session.user.roleName !== 'super_admin') return null;
  return session;
}

// Ensure one document always exists with both arrays
async function getDoc() {
  await connectDB();
  let doc = await Keywords.findOne().lean<{ _id: unknown; companyKeywords: string[]; studentKeywords: string[] }>();
  if (!doc || !Array.isArray(doc.companyKeywords) || !Array.isArray(doc.studentKeywords)) {
    await Keywords.deleteMany({});
    doc = await Keywords.create({
      companyKeywords: COMPANY_PRIORITY.map(k => k.label),
      studentKeywords: STUDENT_PRIORITY.map(k => k.label),
    }) as unknown as { _id: unknown; companyKeywords: string[]; studentKeywords: string[] };
  }
  return doc;
}

// GET — fetch all keywords
export async function GET() {
  try {
    const session = await adminGuard();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const doc = await getDoc();
    return NextResponse.json({
      success: true,
      message: 'Keywords fetched successfully',
      data: {
        companyKeywords: doc.companyKeywords,
        studentKeywords: doc.studentKeywords,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}

// POST — add a keyword  body: { keyword: string, type: 'company' | 'student' }
export async function POST(req: NextRequest) {
  try {
    const session = await adminGuard();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const keyword = body?.keyword?.trim();
    const type: string = body?.type;
    if (!keyword) return NextResponse.json({ success: false, message: 'Keyword is required' }, { status: 400 });
    if (!['company', 'student'].includes(type)) return NextResponse.json({ success: false, message: 'Type must be company or student' }, { status: 400 });
    const doc = await getDoc();
    const field = type === 'company' ? 'companyKeywords' : 'studentKeywords';
    const existing: string[] = type === 'company' ? doc.companyKeywords : doc.studentKeywords;
    const kw = keyword.toLowerCase();
    if (existing.includes(kw)) return NextResponse.json({ success: false, message: `"${kw}" already exists in ${type} keywords` }, { status: 409 });
    await Keywords.updateOne({ _id: doc._id as ObjectId }, { $addToSet: { [field]: kw } });
    return NextResponse.json({ success: true, message: `"${kw}" added to ${type} keywords` });
  } catch (error) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}

// DELETE — remove a keyword  body: { keyword: string, type: 'company' | 'student' }
export async function DELETE(req: NextRequest) {
  try {
    const session = await adminGuard();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const keyword: string = body?.keyword?.trim();
    const type: string = body?.type;
    if (!keyword) return NextResponse.json({ success: false, message: 'Keyword is required' }, { status: 400 });
    if (!['company', 'student'].includes(type)) return NextResponse.json({ success: false, message: 'Type must be company or student' }, { status: 400 });
    const doc = await getDoc();
    const field = type === 'company' ? 'companyKeywords' : 'studentKeywords';
    await Keywords.updateOne({ _id: doc._id as ObjectId }, { $pull: { [field]: keyword } });
    return NextResponse.json({ success: true, message: `"${keyword}" removed from ${type} keywords` });
  } catch (error) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
