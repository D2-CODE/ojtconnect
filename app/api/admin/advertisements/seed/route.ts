import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import { generateId } from '@/lib/utils';
import { auth } from '@/lib/auth';

// GET /api/admin/advertisements/seed — run once to seed existing images
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.roleName !== 'super_admin')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const existing = await Advertisement.countDocuments({ slot: 'home_small' });
  if (existing > 0)
    return NextResponse.json({ success: true, message: 'Already seeded' });

  const images = [
    '/advertisment posting/WhatsApp Image 2026-04-09 at 10.51.00 AM.jpeg',
    '/advertisment posting/poster 2.jpeg',
    '/advertisment posting/poster 3.jpeg',
  ];

  await Advertisement.insertMany(
    images.map((imageUrl, i) => ({
      _id: generateId(),
      slot: 'home_small',
      imageUrl,
      order: i,
      isActive: true,
    }))
  );

  return NextResponse.json({ success: true, message: 'Seeded 3 home_small ads' });
}
