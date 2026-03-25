import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import Role from '@/models/Role';
import User from '@/models/User';

let _idCounter = 0;
function genId(): string {
  return Date.now().toString() + (++_idCounter).toString().padStart(2, '0');
}

export async function seedDatabase(): Promise<void> {
  await connectDB();

  const existing = await Role.countDocuments();
  if (existing > 0) {
    console.log('[seed] Already seeded. Skipping.');
    return;
  }

  console.log('[seed] Seeding roles and admin user...');

  // ── ROLES ──────────────────────────────────────────────────────────────────
  const roleIds = {
    superAdmin: genId(),
    universityAdmin: genId(),
    student: genId(),
    company: genId(),
  };

  await Role.insertMany([
    {
      _id: roleIds.superAdmin,
      roleName: 'super_admin',
      description: 'Full system control',
      modules: [
        { moduleName: 'dashboard', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'users', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'universities', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'students', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'companies', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'ojt_wall', canView: true, canAdd: true, canEdit: true, canDelete: true },
        { moduleName: 'connections', canView: true, canAdd: false, canEdit: false, canDelete: true },
        { moduleName: 'email_logs', canView: true, canAdd: false, canEdit: false, canDelete: false },
        { moduleName: 'settings', canView: true, canAdd: true, canEdit: true, canDelete: true },
      ],
    },
    {
      _id: roleIds.universityAdmin,
      roleName: 'university_admin',
      description: 'Manage university and verify students',
      modules: [
        { moduleName: 'dashboard', canView: true, canAdd: false, canEdit: false, canDelete: false },
        { moduleName: 'universities', canView: true, canAdd: false, canEdit: true, canDelete: false },
        { moduleName: 'students', canView: true, canAdd: false, canEdit: true, canDelete: false },
        { moduleName: 'ojt_wall', canView: true, canAdd: false, canEdit: false, canDelete: false },
      ],
    },
    {
      _id: roleIds.student,
      roleName: 'student',
      description: 'Browse wall, manage profile and connections',
      modules: [
        { moduleName: 'dashboard', canView: true, canAdd: false, canEdit: false, canDelete: false },
        { moduleName: 'students', canView: true, canAdd: false, canEdit: true, canDelete: false },
        { moduleName: 'ojt_wall', canView: true, canAdd: false, canEdit: false, canDelete: false },
        { moduleName: 'connections', canView: true, canAdd: true, canEdit: true, canDelete: true },
      ],
    },
    {
      _id: roleIds.company,
      roleName: 'company',
      description: 'Search interns, manage profile and connections',
      modules: [
        { moduleName: 'dashboard', canView: true, canAdd: false, canEdit: false, canDelete: false },
        { moduleName: 'companies', canView: true, canAdd: false, canEdit: true, canDelete: false },
        { moduleName: 'ojt_wall', canView: true, canAdd: true, canEdit: false, canDelete: false },
        { moduleName: 'connections', canView: true, canAdd: true, canEdit: true, canDelete: true },
      ],
    },
  ]);

  // ── SUPER ADMIN USER ───────────────────────────────────────────────────────
  // This is the only hardcoded user — required because super_admin cannot
  // self-register through the public registration flow.
  const adminPassword = 'Admin@123';
  await User.create({
    _id: genId(),
    name: 'System Admin',
    email: 'admin@ojtconnect.ph',
    password: await bcrypt.hash(adminPassword, 10),
    role: roleIds.superAdmin,
    profileType: 'super_admin',
    isActive: true,
    isEmailVerified: true,
    profileComplete: true,
  });

  console.log('[seed] ✅ Roles and admin user seeded successfully.');
  console.log('[seed] Admin login: admin@ojtconnect.ph / Admin@123');
}
