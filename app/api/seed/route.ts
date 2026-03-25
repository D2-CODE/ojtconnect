import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import Student from '@/models/Student';
import Company from '@/models/Company';
import University from '@/models/University';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Seeded successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const [roles, users, students, companies, universities] = await Promise.all([
      Role.countDocuments(),
      User.countDocuments(),
      Student.countDocuments(),
      Company.countDocuments(),
      University.countDocuments(),
    ]);
    return NextResponse.json({ success: true, data: { roles, users, students, companies, universities }, seeded: roles > 0 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
