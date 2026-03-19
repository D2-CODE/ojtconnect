import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  // Block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DUMMY_DATA !== 'true') {
    return NextResponse.json({ success: false, error: 'Seeding not allowed in production' }, { status: 403 });
  }
  try {
    console.log('[api/seed] Seed endpoint called');
    await seedDatabase();
    console.log('[api/seed] Seed completed');
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('[api/seed] Seed failed:', error);
    return NextResponse.json(
      { success: false, error: String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

// GET — diagnostic: check what's in the DB right now
export async function GET() {
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const Role = (await import('@/models/Role')).default;
    const User = (await import('@/models/User')).default;
    const Student = (await import('@/models/Student')).default;
    const Company = (await import('@/models/Company')).default;
    const University = (await import('@/models/University')).default;
    const OjtWall = (await import('@/models/OjtWall')).default;

    await connectDB();

    const [roles, users, students, companies, universities, wallPosts] = await Promise.all([
      Role.countDocuments(),
      User.countDocuments(),
      Student.countDocuments(),
      Company.countDocuments(),
      University.countDocuments(),
      OjtWall.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      data: { roles, users, students, companies, universities, wallPosts },
      seeded: roles > 0,
      SEED_DUMMY_DATA: process.env.SEED_DUMMY_DATA,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
