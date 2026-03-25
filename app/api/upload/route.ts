import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const MAX_SIZE = 200 * 1024; // 200 KB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP or SVG allowed' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, error: 'File must be under 200 KB' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
