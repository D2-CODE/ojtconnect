import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import University from '@/models/University';
import Student from '@/models/Student';
import Company from '@/models/Company';
import OjtWall from '@/models/OjtWall';
import EmailLog from '@/models/EmailLog';
import Connection from '@/models/Connection';

let _idCounter = 0;
function genId(): string {
  return Date.now().toString() + (++_idCounter).toString().padStart(2, '0');
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function seedDatabase(): Promise<void> {
  await connectDB();

  const existing = await Role.countDocuments();
  if (existing > 0) {
    console.log('[seed] Already seeded. Skipping.');
    return;
  }

  // Clear all collections to avoid duplicate key errors from partial previous runs
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    University.deleteMany({}),
    Student.deleteMany({}),
    Company.deleteMany({}),
    OjtWall.deleteMany({}),
    EmailLog.deleteMany({}),
    Connection.deleteMany({}),
  ]);

  console.log('[seed] Seeding database...');

  // ── ROLES ──────────────────────────────────────────────────────────────────
  const roleIds = {
    superAdmin: genId(),
    universityAdmin: genId(),
    student: genId(),
    company: genId(),
  };
  await delay(10);

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

  // ── UNIVERSITIES ────────────────────────────────────────────────────────────
  const uniIds = { upd: genId(), pup: genId() };
  await delay(10);

  await University.insertMany([
    {
      _id: uniIds.upd,
      userId: '', // filled after user creation
      name: 'University of the Philippines Diliman',
      slug: 'up-diliman',
      abbreviation: 'UP Diliman',
      location: 'Quezon City, Metro Manila',
      address: 'University Ave, Diliman, Quezon City, 1101',
      description: 'The national university of the Philippines, known for academic excellence.',
      website: 'https://upd.edu.ph',
      email: 'ojt@upd.edu.ph',
      phone: '+63 2 8981 8500',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      studentCount: 3,
      programs: ['BS Computer Science', 'BS Information Technology', 'BS Multimedia Arts', 'BS Mathematics', 'BS Psychology'],
      isActive: true,
    },
    {
      _id: uniIds.pup,
      userId: '',
      name: 'Polytechnic University of the Philippines',
      slug: 'pup-manila',
      abbreviation: 'PUP',
      location: 'Manila, Metro Manila',
      address: 'Anonas St, Santa Mesa, Manila, 1016',
      description: 'One of the largest state universities providing quality education for all Filipinos.',
      website: 'https://pup.edu.ph',
      email: 'ojt@pup.edu.ph',
      phone: '+63 2 8335 1787',
      verificationStatus: 'pending',
      studentCount: 1,
      programs: ['BS Business Administration', 'BS Accountancy', 'BS Engineering', 'BS Industrial Technology'],
      isActive: true,
    },
  ]);

  // ── COMPANIES ───────────────────────────────────────────────────────────────
  const companyIds = { tech: genId(), bpo: genId(), mfg: genId() };
  await delay(10);

  await Company.insertMany([
    {
      _id: companyIds.tech,
      userId: '',
      companyName: 'TechCorp Philippines Inc.',
      slug: 'techcorp-ph',
      industry: 'Information Technology',
      companySize: '51-200',
      location: 'Makati City, Metro Manila',
      address: '32nd Floor, GT Tower, Ayala Ave, Makati',
      description: 'Leading software development company building solutions for Southeast Asia.',
      website: 'https://techcorp.ph',
      email: 'hr@techcorp.ph',
      phone: '+63 2 8123 4567',
      internSlotsOpen: 3,
      internshipDetails: { allowance: true, allowanceAmount: 500, setup: 'hybrid', hoursPerDay: 8, daysPerWeek: 5 },
      preferredSkills: ['React', 'Node.js', 'TypeScript', 'Python'],
      acceptsMOA: true,
      isVerified: true,
      isVisible: true,
    },
    {
      _id: companyIds.bpo,
      userId: '',
      companyName: 'GlobalBPO Corp',
      slug: 'globalbpo-corp',
      industry: 'Business Process Outsourcing',
      companySize: '201-500',
      location: 'Pasig City, Metro Manila',
      address: '5th Floor, Robinsons Cyberscape, Ortigas, Pasig',
      description: 'Multi-awarded BPO company serving global clients across 15 countries.',
      website: 'https://globalbpo.ph',
      email: 'careers@bpocorp.ph',
      phone: '+63 2 8456 7890',
      internSlotsOpen: 5,
      internshipDetails: { allowance: true, allowanceAmount: 400, setup: 'onsite', hoursPerDay: 8, daysPerWeek: 5 },
      preferredSkills: ['MS Office', 'Communication', 'Customer Service', 'Data Entry'],
      acceptsMOA: true,
      isVerified: false,
      isVisible: true,
    },
    {
      _id: companyIds.mfg,
      userId: '',
      companyName: 'ManufacturePH Inc.',
      slug: 'manufactureph-inc',
      industry: 'Manufacturing',
      companySize: '201-500',
      location: 'Caloocan City, Metro Manila',
      address: 'MEPZ, Caloocan Industrial Area, Caloocan',
      description: 'Philippine manufacturing company specializing in electronics and industrial products.',
      website: 'https://manufactureph.com',
      email: 'jobs@mfgph.ph',
      phone: '+63 2 8234 5678',
      internSlotsOpen: 2,
      internshipDetails: { allowance: false, allowanceAmount: 0, setup: 'onsite', hoursPerDay: 8, daysPerWeek: 5 },
      preferredSkills: ['Engineering', 'AutoCAD', 'Quality Control', 'Production Planning'],
      acceptsMOA: true,
      isVerified: false,
      isVisible: true,
    },
  ]);

  // ── STUDENTS ────────────────────────────────────────────────────────────────
  const studentIds = { juan: genId(), maria: genId(), pedro: genId(), anna: genId() };
  await delay(10);

  await Student.insertMany([
    {
      _id: studentIds.juan,
      userId: '',
      universityId: uniIds.upd,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      displayName: 'Juan Dela Cruz',
      studentNumber: '2020-12345',
      course: 'BS Computer Science',
      major: 'Software Engineering',
      yearLevel: 4,
      bio: 'Passionate CS student with experience in full-stack web development. Looking for a software development internship in Makati or BGC.',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Git'],
      ojtHoursRequired: 300,
      preferredSetup: 'hybrid',
      preferredLocation: 'Makati, BGC, Pasig',
      contactEmail: 'juan@gmail.com',
      universityVerificationStatus: 'verified',
      universityVerifiedAt: new Date(),
      isVisible: true,
    },
    {
      _id: studentIds.maria,
      userId: '',
      universityId: uniIds.upd,
      firstName: 'Maria',
      lastName: 'Santos',
      displayName: 'Maria Santos',
      studentNumber: '2021-67890',
      course: 'BS Information Technology',
      major: 'Data Science',
      yearLevel: 3,
      bio: 'IT student specializing in data science and Python development. Open to remote internships.',
      skills: ['Python', 'Django', 'SQL', 'Figma', 'Data Analysis'],
      ojtHoursRequired: 300,
      preferredSetup: 'remote',
      preferredLocation: 'Remote',
      contactEmail: 'maria@gmail.com',
      universityVerificationStatus: 'verified',
      universityVerifiedAt: new Date(),
      isVisible: true,
    },
    {
      _id: studentIds.pedro,
      userId: '',
      universityId: uniIds.pup,
      firstName: 'Pedro',
      lastName: 'Reyes',
      displayName: 'Pedro Reyes',
      studentNumber: '2020-11111',
      course: 'BS Business Administration',
      major: 'Financial Management',
      yearLevel: 4,
      bio: 'Business student with strong accounting and financial analysis skills. Can start ASAP.',
      skills: ['MS Excel', 'Accounting', 'SAP', 'Financial Analysis', 'Bookkeeping'],
      ojtHoursRequired: 300,
      preferredSetup: 'onsite',
      preferredLocation: 'Manila, Quezon City',
      contactEmail: 'pedro@gmail.com',
      universityVerificationStatus: 'pending',
      isVisible: false,
    },
    {
      _id: studentIds.anna,
      userId: '',
      universityId: uniIds.upd,
      firstName: 'Anna',
      lastName: 'Lim',
      displayName: 'Anna Lim',
      studentNumber: '2022-22222',
      course: 'BS Multimedia Arts',
      yearLevel: 3,
      bio: 'Creative multimedia arts student skilled in graphic design, video editing, and UI/UX.',
      skills: ['Adobe Photoshop', 'Illustrator', 'Premiere Pro', 'Figma', 'UI/UX Design'],
      ojtHoursRequired: 300,
      preferredSetup: 'hybrid',
      preferredLocation: 'Quezon City, Makati',
      contactEmail: 'anna@gmail.com',
      universityVerificationStatus: 'unverified',
      isVisible: false,
    },
  ]);

  // ── USERS ───────────────────────────────────────────────────────────────────
  const hash = async (pw: string) => bcrypt.hash(pw, 10);
  const userIds = {
    admin: genId(), upd: genId(), pup: genId(),
    juan: genId(), maria: genId(), pedro: genId(), anna: genId(),
    tech: genId(), bpo: genId(), mfg: genId(),
  };
  await delay(10);

  await User.insertMany([
    { _id: userIds.admin, name: 'System Admin', email: 'admin@ojtconnect.ph', password: await hash('Admin@123'), role: roleIds.superAdmin, profileType: 'super_admin', isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.upd, name: 'UP Diliman Admin', email: 'upd@ojtconnect.ph', password: await hash('Test@123'), role: roleIds.universityAdmin, profileType: 'university_admin', profileRef: uniIds.upd, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.pup, name: 'PUP Admin', email: 'pup@ojtconnect.ph', password: await hash('Test@123'), role: roleIds.universityAdmin, profileType: 'university_admin', profileRef: uniIds.pup, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.juan, name: 'Juan Dela Cruz', email: 'juan@student.ph', password: await hash('Test@123'), role: roleIds.student, profileType: 'student', profileRef: studentIds.juan, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.maria, name: 'Maria Santos', email: 'maria@student.ph', password: await hash('Test@123'), role: roleIds.student, profileType: 'student', profileRef: studentIds.maria, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.pedro, name: 'Pedro Reyes', email: 'pedro@student.ph', password: await hash('Test@123'), role: roleIds.student, profileType: 'student', profileRef: studentIds.pedro, isActive: true, isEmailVerified: true, profileComplete: false },
    { _id: userIds.anna, name: 'Anna Lim', email: 'anna@student.ph', password: await hash('Test@123'), role: roleIds.student, profileType: 'student', profileRef: studentIds.anna, isActive: true, isEmailVerified: true, profileComplete: false },
    { _id: userIds.tech, name: 'HR TechCorp', email: 'hr@techcorp.ph', password: await hash('Test@123'), role: roleIds.company, profileType: 'company', profileRef: companyIds.tech, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.bpo, name: 'Careers BPO Corp', email: 'careers@bpocorp.ph', password: await hash('Test@123'), role: roleIds.company, profileType: 'company', profileRef: companyIds.bpo, isActive: true, isEmailVerified: true, profileComplete: true },
    { _id: userIds.mfg, name: 'Jobs MFG PH', email: 'jobs@mfgph.ph', password: await hash('Test@123'), role: roleIds.company, profileType: 'company', profileRef: companyIds.mfg, isActive: true, isEmailVerified: true, profileComplete: false },
  ]);

  // Update university & company with userId
  await University.updateOne({ _id: uniIds.upd }, { userId: userIds.upd });
  await University.updateOne({ _id: uniIds.pup }, { userId: userIds.pup });
  await Company.updateOne({ _id: companyIds.tech }, { userId: userIds.tech });
  await Company.updateOne({ _id: companyIds.bpo }, { userId: userIds.bpo });
  await Company.updateOne({ _id: companyIds.mfg }, { userId: userIds.mfg });
  await Student.updateOne({ _id: studentIds.juan }, { userId: userIds.juan });
  await Student.updateOne({ _id: studentIds.maria }, { userId: userIds.maria });
  await Student.updateOne({ _id: studentIds.pedro }, { userId: userIds.pedro });
  await Student.updateOne({ _id: studentIds.anna }, { userId: userIds.anna });

  // ── OJT WALL POSTS ──────────────────────────────────────────────────────────
  const wallPosts = [
    // INTERNS (students seeking OJT)
    {
      _id: '1773656953241301',
      SectionData: { fbleads: { name: 'Cyrille Fullantes', profile_url: 'https://www.facebook.com/groups/741000422657606/user/100003886490647/', profile_pic: '', post_text: 'SEEKING OJT / INTERNSHIP OPPORTUNITIES\nGood day!\nWe are fourth-year BSBA Major in Human Resource Management students from University of Rizal System – Binangonan Campus. We are searching for a company that accepts interns for OJT related to finance, or business operations.\nProgram: BSBA – Human Resource Management\nPreferred Areas: Cainta, Taytay, Angono and Binangonan\nSet up: On-site\nTotal Hours Required: 300 hours\nCAN START ASAP\nEmail: fullantescyrille@gmail.com', post_link: '', emails: 'fullantescyrille@gmail.com', phones: '', skills: 'HRM, business operations, finance, MS Office', experience: '', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-16T10:29:12.516Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-16T10:31:00Z'), status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-16T10:29:13.241Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Jhun Mark Villanueva', profile_url: '', profile_pic: '', post_text: 'LOOKING FOR OJT COMPANY\nHello! I am a 4th year BS Computer Science student from Mapua University. I am actively looking for an internship opportunity in software development or web development.\nSkills: React.js, Node.js, MySQL, Java\nAvailable: March – June 2026\nLocation: Makati, Taguig, Pasig, or Remote\nEmail: jhunmark@gmail.com', post_link: '', emails: 'jhunmark@gmail.com', phones: '+63 912 345 6789', skills: 'React.js, Node.js, MySQL, Java, Git', experience: '2 projects', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-15T08:00:00Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-15T08:05:00Z'), status: 'claimed', claimedBy: userIds.juan, claimedAt: new Date('2026-03-15T10:00:00Z'), isActive: true, createdAt: new Date('2026-03-15T08:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Rhea Mae Domingo', profile_url: '', profile_pic: '', post_text: 'OJT APPLICANT – ACCOUNTING\nGood day po! I am Rhea Mae Domingo, a 4th year BS Accountancy student from De La Salle University. I am seeking an internship in accounting, auditing, or finance.\nPreferred: BGC, Makati, or Ortigas\nHours: 300 hours\nCan start immediately\nEmail: rheamae.domingo@gmail.com', post_link: '', emails: 'rheamae.domingo@gmail.com', phones: '', skills: 'Accounting, QuickBooks, MS Excel, Financial Statements, Taxation', experience: '', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-14T09:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-14T09:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Carlo Mendoza', profile_url: '', profile_pic: '', post_text: 'SEEKING OJT – MULTIMEDIA / GRAPHIC DESIGN\nHi! I am Carlo Mendoza, BS Multimedia Arts 3rd year from UST. Looking for an internship in graphic design, video production, or social media management.\nSkills: Adobe Creative Suite, Canva, Video Editing\nLocation: Metro Manila or Remote\nEmail: carlo.mendoza@gmail.com', post_link: '', emails: 'carlo.mendoza@gmail.com', phones: '', skills: 'Photoshop, Illustrator, Premiere Pro, After Effects, Canva', experience: 'Freelance', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-13T07:00:00Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-13T07:05:00Z'), status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-13T07:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Sophia Reyes', profile_url: '', profile_pic: '', post_text: 'LOOKING FOR OJT – PSYCHOLOGY / HR\nHello everyone! I am Sophia Reyes, a 4th year BS Psychology student from Ateneo de Manila. I am seeking an internship in Human Resources, Organizational Development, or Counseling.\nLocation: Quezon City or Makati\nEmail: sophia.reyes@gmail.com', post_link: '', emails: 'sophia.reyes@gmail.com', phones: '', skills: 'HR Management, Employee Relations, Psychological Assessment, Training', experience: '', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-12T11:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-12T11:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Mark Torres', profile_url: '', profile_pic: '', post_text: 'OJT APPLICANT – CIVIL ENGINEERING\nGood morning! I am Mark Torres, 4th year Civil Engineering student from PLM. Looking for OJT in construction, project management, or structural design.\nHours Required: 300 hours\nLocation: Metro Manila\nEmail: mark.torres.eng@gmail.com', post_link: '', emails: 'mark.torres.eng@gmail.com', phones: '+63 998 765 4321', skills: 'AutoCAD, Civil 3D, Structural Analysis, Construction Management', experience: '', lead_type: 'intern', resume_url: '', scraped_at: new Date('2026-03-11T06:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-11T06:00:00Z'),
    },
    // INTERNSHIPS (companies offering OJT)
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Innovatech Solutions PH', profile_url: '', profile_pic: '', post_text: 'HIRING OJT INTERNS – WEB DEVELOPMENT\nInnovatech Solutions is looking for passionate IT interns to join our development team!\nPosition: Web Development Intern\nLocation: BGC, Taguig (Hybrid)\nHours: 300-600 hours\nSlots: 3 slots available\nAllowance: ₱500/day\nRequirements: Knowledge of HTML/CSS/JS, any framework is a plus\nEmail: hr@innovatech.ph', post_link: '', emails: 'hr@innovatech.ph', phones: '', skills: 'HTML, CSS, JavaScript, React, PHP', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-16T09:00:00Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-16T09:05:00Z'), status: 'claimed', claimedBy: userIds.tech, claimedAt: new Date('2026-03-16T11:00:00Z'), isActive: true, createdAt: new Date('2026-03-16T09:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Ayala Corporation – HR Department', profile_url: '', profile_pic: '', post_text: 'OJT SLOTS AVAILABLE – BUSINESS/HR/FINANCE\nAyala Corporation is accepting OJT applications for the following departments:\n• Human Resources\n• Finance & Accounting\n• Corporate Communications\nLocation: Makati City\nDuration: 300-400 hours\nAllowance provided\nSend CV to: internship@ayala.com.ph', post_link: '', emails: 'internship@ayala.com.ph', phones: '', skills: 'HR, Finance, Accounting, Business Administration, Communication', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-15T10:00:00Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-15T10:05:00Z'), status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-15T10:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'DataMind Analytics PH', profile_url: '', profile_pic: '', post_text: 'DATA SCIENCE / ANALYTICS INTERN NEEDED\nDataMind Analytics is looking for motivated students interested in data science, machine learning, or business analytics.\nSetup: Remote / WFH\nSlots: 2\nStipend: ₱300/day\nRequirements: Python or R, basic statistics\nEmail your resume to: careers@datamind.ph', post_link: '', emails: 'careers@datamind.ph', phones: '', skills: 'Python, R, Data Science, Machine Learning, Statistics, SQL', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-14T08:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-14T08:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'DesignStudio PH', profile_url: '', profile_pic: '', post_text: 'CREATIVE INTERNS WANTED!\nDesignStudio PH is a branding and digital marketing agency accepting OJT interns for:\n- Graphic Design\n- Social Media Management\n- Video Editing\nLocation: Quezon City or Remote\nAllowance: ₱400/day\nContact: hello@designstudio.ph', post_link: '', emails: 'hello@designstudio.ph', phones: '', skills: 'Graphic Design, Social Media, Video Editing, Canva, Adobe Creative Suite', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-13T09:00:00Z') } },
      claimEmailSent: true, claimEmailSentAt: new Date('2026-03-13T09:05:00Z'), status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-13T09:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'MegaWorld Corp – Training Dept', profile_url: '', profile_pic: '', post_text: 'REAL ESTATE OJT OPPORTUNITY\nMegaWorld Corporation is offering internship slots in:\n• Property Management\n• Marketing & Sales\n• Engineering & Construction\nLocation: Eastwood City, Libis, QC\nHours: 300 hours\nWith certificate and performance evaluation\nEmail: training@megaworld.com.ph', post_link: '', emails: 'training@megaworld.com.ph', phones: '', skills: 'Real Estate, Property Management, Marketing, Sales, Engineering', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-12T10:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-12T10:00:00Z'),
    },
    {
      _id: genId(),
      SectionData: { fbleads: { name: 'Philhealth – IT Department', profile_url: '', profile_pic: '', post_text: 'PHILHEALTH ACCEPTING IT INTERNS\nPhilHealth is accepting OJT applications for our Information Technology department.\nDepartments: Systems Development, Network Administration, Data Management\nLocation: Pasig City (On-site)\nDuration: 300-500 hours\nRequirements: IT-related courses only\nContact: itd.ojt@philhealth.gov.ph', post_link: '', emails: 'itd.ojt@philhealth.gov.ph', phones: '', skills: 'IT, Systems Development, Network, Database, Java, PHP', experience: '', lead_type: 'internship', resume_url: '', scraped_at: new Date('2026-03-11T07:00:00Z') } },
      claimEmailSent: false, status: 'unclaimed', isActive: true, createdAt: new Date('2026-03-11T07:00:00Z'),
    },
  ];

  await OjtWall.insertMany(wallPosts);

  // ── EMAIL LOGS ──────────────────────────────────────────────────────────────
  await EmailLog.insertMany([
    { _id: genId(), to: 'fullantescyrille@gmail.com', from: 'noreply@ojtconnect.ph', subject: 'Claim Your OJT Connect PH Listing', template: 'claim_invite', status: 'sent', relatedId: '1773656953241301', relatedType: 'ojt_wall', attempts: 1, sentAt: new Date('2026-03-16T10:31:00Z') },
    { _id: genId(), to: 'jhunmark@gmail.com', from: 'noreply@ojtconnect.ph', subject: 'Claim Your OJT Connect PH Listing', template: 'claim_invite', status: 'sent', relatedType: 'ojt_wall', attempts: 1, sentAt: new Date('2026-03-15T08:05:00Z') },
    { _id: genId(), to: 'invalid-email@fake.xyz', from: 'noreply@ojtconnect.ph', subject: 'Claim Your OJT Connect PH Listing', template: 'claim_invite', status: 'failed', statusMessage: 'SMTP error: recipient not found', relatedType: 'ojt_wall', attempts: 3 },
    { _id: genId(), to: 'juan@student.ph', from: 'noreply@ojtconnect.ph', subject: 'Your student account has been verified!', template: 'student_verified', status: 'sent', relatedId: studentIds.juan, relatedType: 'student', attempts: 1, sentAt: new Date('2026-03-16T12:00:00Z') },
    { _id: genId(), to: 'juan@student.ph', from: 'noreply@ojtconnect.ph', subject: 'TechCorp Philippines Inc. wants to connect with you!', template: 'connection_request', status: 'sent', relatedType: 'connection', attempts: 1, sentAt: new Date('2026-03-17T09:00:00Z') },
  ]);

  // ── CONNECTIONS ─────────────────────────────────────────────────────────────
  await Connection.insertMany([
    { _id: genId(), fromUserId: userIds.tech, fromType: 'company', fromProfileId: companyIds.tech, toUserId: userIds.juan, toType: 'student', toProfileId: studentIds.juan, status: 'accepted', message: 'Hi Juan! We would love to have you intern at TechCorp. Please reach out!', contactEmail: 'hr@techcorp.ph', respondedAt: new Date('2026-03-17T10:00:00Z') },
    { _id: genId(), fromUserId: userIds.tech, fromType: 'company', fromProfileId: companyIds.tech, toUserId: userIds.maria, toType: 'student', toProfileId: studentIds.maria, status: 'pending', message: 'Hi Maria! We have a data science internship opening. Would you be interested?', contactEmail: 'hr@techcorp.ph' },
    { _id: genId(), fromUserId: userIds.bpo, fromType: 'company', fromProfileId: companyIds.bpo, toUserId: userIds.juan, toType: 'student', toProfileId: studentIds.juan, status: 'rejected', message: 'We have openings for IT interns at our Pasig office.', contactEmail: 'careers@bpocorp.ph', respondedAt: new Date('2026-03-16T14:00:00Z') },
    { _id: genId(), fromUserId: userIds.bpo, fromType: 'company', fromProfileId: companyIds.bpo, toUserId: userIds.maria, toType: 'student', toProfileId: studentIds.maria, status: 'accepted', message: 'Hello Maria! We have a data analyst intern role available.', contactEmail: 'careers@bpocorp.ph', respondedAt: new Date('2026-03-17T11:00:00Z') },
    { _id: genId(), fromUserId: userIds.mfg, fromType: 'company', fromProfileId: companyIds.mfg, toUserId: userIds.juan, toType: 'student', toProfileId: studentIds.juan, status: 'pending', message: 'Hello Juan, we have an IT systems internship at our Caloocan facility.', contactEmail: 'jobs@mfgph.ph' },
    { _id: genId(), fromUserId: userIds.juan, fromType: 'student', fromProfileId: studentIds.juan, toUserId: userIds.tech, toType: 'company', toProfileId: companyIds.tech, status: 'pending', message: 'Hi, I saw your internship listing and I am very interested in joining TechCorp as a web developer intern.', contactEmail: 'juan@gmail.com' },
  ]);

  console.log('[seed] ✅ Database seeded successfully!');
  console.log('[seed] Admin credentials: admin@ojtconnect.ph / Admin@123');
}

