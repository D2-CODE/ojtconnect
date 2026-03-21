# OJT Connect PH — Complete System Documentation

> Last updated: June 2026
> Tech Stack: Next.js 15 (App Router), TypeScript, MongoDB (Mongoose), NextAuth v5, Nodemailer, bcryptjs

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Database Collections](#4-database-collections)
5. [Models](#5-models)
6. [Authentication System](#6-authentication-system)
7. [Email System](#7-email-system)
8. [API Routes — Complete Reference](#8-api-routes--complete-reference)
9. [Scraper Integration](#9-scraper-integration)
10. [OJT Wall & Claim Flow](#10-ojt-wall--claim-flow)
11. [Password Reset Flow](#11-password-reset-flow)
12. [Auto-Login Flow](#12-auto-login-flow)
13. [Frontend Pages](#13-frontend-pages)
14. [Components](#14-components)
15. [Role & Permission System](#15-role--permission-system)
16. [Seed Data](#16-seed-data)
17. [Known Issues & Notes](#17-known-issues--notes)
18. [Changelog](#18-changelog)

---

## 1. Project Overview

OJT Connect PH is a platform connecting Filipino students seeking OJT (On-the-Job Training) with companies offering internships. It also supports universities managing student verification.

**Core features:**
- Public OJT Wall showing scraped Facebook posts (internship offers + students seeking OJT)
- Company claim flow — companies claim their scraped FB posts
- Student/Company/University registration and profiles
- Role-based dashboards (student, company, university_admin, super_admin)
- Email notifications for all major events
- Admin panel for managing users, posts, universities

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | MongoDB Atlas via Mongoose |
| Auth | NextAuth v5 (JWT strategy) |
| Email | Nodemailer (Gmail SMTP) |
| Password hashing | bcryptjs |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## 3. Environment Variables

File: `.env.local`

```env
MONGODB_URI=mongodb+srv://...@.../ojtconnect
NEXTAUTH_SECRET=ojtconnect-super-secret-key-2026
NEXTAUTH_URL=http://localhost:3000
SEED_DUMMY_DATA=true
EMAIL_FROM=noreply@ojtconnect.ph
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
NEXT_PUBLIC_APP_NAME=OJT Connect PH
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLAIM_TOKEN_EXPIRY_DAYS=7
SCRAPER_API_KEY=ojt-scraper-secret-key-2026
```

**Important:** `SCRAPER_API_KEY` is used to authenticate the browser extension scraper. Change this to a strong random value in production.

---

## 4. Database Collections

| Collection | Purpose |
|---|---|
| `users` | All registered users (students, companies, university admins, super admin) |
| `students` | Student profile data |
| `companies` | Company profile data |
| `universities` | University profile data |
| `roles` | Role definitions with module permissions |
| `ojtwalls` | Scraped Facebook posts (OJT Wall) |
| `connections` | Connection requests between users |
| `email_logs` | Log of every email sent or attempted |

---

## 5. Models

### User (`models/User.ts`)

```
_id             String (16-digit generated)
name            String
email           String (unique, lowercase)
password        String (bcrypt hashed)
role            String → ref: Role
profileType     'student' | 'company' | 'university_admin' | 'super_admin'
profileRef      String → ref: Student | Company | University
isActive        Boolean
isEmailVerified Boolean
profileComplete Boolean
lastLogin       Date
resetToken      String (for password reset — stored via collection.updateOne)
resetTokenExpiry Date
autoLoginToken  String (for claim auto-login — stored via collection.updateOne)
autoLoginTokenExpiry Date
createdAt       Date
updatedAt       Date
```

> **Note:** `resetToken`, `resetTokenExpiry`, `autoLoginToken`, `autoLoginTokenExpiry` are NOT in the Mongoose schema definition. They are written directly using `User.collection.updateOne()` with `strict: false` to bypass Mongoose schema caching issues. Queries for these fields also use `User.collection.findOne()`.

### OjtWall (`models/OjtWall.ts`)

```
_id                 String
SectionData
  fbleads
    name            String
    fb_id           String  ← added
    profile_url     String
    profile_pic     String
    post_text       String
    post_link       String
    post_date       Date    ← added
    emails          String (comma-separated)
    phones          String (comma-separated)
    skills          String (comma-separated)
    experience      String
    lead_type       'intern' | 'internship'
    resume_url      String
    scraped_at      Date
claimedBy           String → ref: User
claimedAt           Date
claimToken          String
claimTokenExpiry    Date
claimEmailSent      Boolean
claimEmailSentAt    Date
status              'unclaimed' | 'claimed' | 'expired' | 'hidden'
isActive            Boolean
createdAt           Date (manual, preserves FB post date)
updatedAt           Date (auto)
```

### EmailLog (`models/EmailLog.ts`)

```
_id             String
to              String
from            String
subject         String
template        'claim_invite' | 'university_verification' | 'student_verified' | 'connection_request' | 'welcome'
status          'pending' | 'sent' | 'failed' | 'bounced'
statusMessage   String (error message if failed)
relatedId       String (ID of related entity)
relatedType     'ojt_wall' | 'university' | 'student' | 'connection' | 'user'
attempts        Number
sentAt          Date
createdAt       Date
updatedAt       Date
```

### Company (`models/Company.ts`)

```
_id             String
userId          String → ref: User
companyName     String
slug            String (unique)
industry        String
companySize     '1-10' | '11-50' | '51-200' | '201-500' | '500+'
location        String
email           String
phone           String
website         String
logo            String
description     String
internSlotsOpen Number
internshipDetails
  allowance     Boolean
  allowanceAmount Number
  setup         'onsite' | 'remote' | 'hybrid'
  hoursPerDay   Number
  daysPerWeek   Number
preferredSkills String[]
acceptsMOA      Boolean
isVerified      Boolean
isVisible       Boolean
```

### Student (`models/Student.ts`)

```
_id                         String
userId                      String → ref: User
firstName / lastName        String
displayName                 String
course                      String
yearLevel                   Number
universityId                String → ref: University
contactEmail                String
universityVerificationStatus 'unverified' | 'pending' | 'verified' | 'rejected'
isVisible                   Boolean
ojtHoursRequired            Number
```

### Role (`models/Role.ts`)

```
_id         String
roleName    'super_admin' | 'university_admin' | 'student' | 'company'
description String
modules[]
  moduleName  'dashboard' | 'users' | 'universities' | 'students' | 'companies' | 'ojt_wall' | 'connections' | 'email_logs' | 'settings'
  canView     Boolean
  canAdd      Boolean
  canEdit     Boolean
  canDelete   Boolean
```

---

## 6. Authentication System

File: `lib/auth.ts`

- **Provider:** NextAuth v5 Credentials
- **Strategy:** JWT (30-day session)
- **Session payload:**
  ```
  userId, email, name, roleName, roleId, profileType, profileRef
  ```
- **Login page:** `/login`
- **Error page:** `/login`

### Login with query params (Auto-login)

The login page (`app/(auth)/login/page.tsx`) reads `?email=` and `?password=` from the URL.
- Pre-fills the email field when `?email=` is present
- Auto-submits `signIn()` on mount **only when both** `?email=` AND `?password=` are present
- Used by the claim flow (new users) to instantly log in after claiming a post
- Existing users who claim a post are redirected to `/login?email=...` only — they must enter their password

---

## 7. Email System

File: `lib/email.ts`

### How it works

1. `sendEmail(to, subject, html, type, relatedEntityId, relatedEntityType)` is the core function
2. It sends via Nodemailer SMTP
3. **Always logs to `email_logs`** — whether send succeeds or fails
4. `relatedEntityType` is mapped from PascalCase to snake_case before saving:

| Passed | Stored |
|---|---|
| `'OjtWall'` | `'ojt_wall'` |
| `'User'` | `'user'` |
| `'University'` | `'university'` |
| `'Student'` | `'student'` |
| `'Connection'` | `'connection'` |

### Email types used

| Type | When sent |
|---|---|
| `claim_invite` | After scraper imports a post — sent to all emails in the post |
| `welcome` | After new user created via claim flow — contains credentials + auto-login link |
| `welcome` | Password reset email (reuses welcome template type) |
| `student_verified` | When university admin verifies a student (function exists, not wired to API yet) |
| `connection_request` | When a connection is made (function exists, not wired to API yet) |

### Daily dedup (claim_invite only)

Before sending a `claim_invite`, the system checks `email_logs` for:
```
{ to: email, template: 'claim_invite', status: 'sent', sentAt: { $gte: today 00:00 } }
```
If found → skip. This prevents spam even if the same post is scraped multiple times in a day, and also prevents sending to the same email from different posts on the same day.

---

## 8. API Routes — Complete Reference

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register student / company / university |
| POST | `/api/auth/forgot-password` | None | Generate reset token, send email |
| GET | `/api/auth/reset-password?token=` | None | Validate reset token |
| POST | `/api/auth/reset-password` | None | Set new password, clear token |
| GET | `/api/auth/auto-login?token=` | None | Validate autoLoginToken, set JWT cookie, redirect to dashboard |

### Wall

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/wall` | None / Required | Get all active posts. With `?mine=true` returns only the session user's posts. Supports `?source=`, `?search=`, `?lead_type=` filters |
| POST | `/api/wall` | Required | Create a new wall post. For `role === 'company'`, fetches `companyName` from Company model and uses it as `postedByName` |
| PATCH | `/api/wall/[id]` | Required | Update own post. Uses `$set` to avoid wiping fields. Ownership checked via `includes()` on name |
| DELETE | `/api/wall/[id]` | Required | Hard-delete own post via `findByIdAndDelete`. Ownership checked via `includes()` on name |

### Claim

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/claim/[token]?email=` | None | Validate claim token, return post info |
| POST | `/api/claim/[token]?email=` | Optional | Claim post — creates user if needed, returns autoLoginUrl |

### Scraper

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/scraper/import` | API Key (`x-api-key` header) | Import scraped FB post, send claim emails |

### Profile

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | Required | Get own profile (student/company/university) |
| PATCH | `/api/profile` | Required | Update own profile |

### Students

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/students/[id]/verify` | university_admin / super_admin | Verify or reject a student |

### Universities

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/universities/[id]/verify` | super_admin | Verify or reject a university |

### Connections

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/connections` | Required | Get own connections |
| POST | `/api/connections` | Required | Create a connection |

### Admin

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | super_admin | Get counts from all collections |
| GET | `/api/admin/email-logs` | super_admin | Get email logs |

---

## 9. Scraper Integration

### Endpoint

```
POST /api/scraper/import
Header: x-api-key: ojt-scraper-secret-key-2026
Content-Type: application/json
```

### Payload (flat JSON)

```json
{
  "name": "Tech Corp",
  "fb_id": "123456789",
  "profile_url": "https://facebook.com/techcorp",
  "profile_pic": "https://example.com/pic.jpg",
  "post_text": "We are looking for OJT interns...",
  "post_link": "https://facebook.com/post/987654321",
  "post_date": "2024-01-15T10:00:00Z",
  "emails": ["hr@techcorp.com", "jobs@techcorp.com"],
  "phones": ["+63 912 345 6789"],
  "skills": ["React", "Node.js"],
  "experience": "No experience required",
  "lead_type": "internship",
  "resume_url": "",
  "scraped_at": "2024-01-15T12:00:00Z"
}
```

- `emails`, `phones`, `skills` — accept array or string
- `lead_type` — `'intern'` (student seeking OJT) or `'internship'` (company offering)
- `name` or `post_text` — at least one required

### What happens after import

1. Post saved to `ojtwalls` with `status: 'unclaimed'`
2. `claimToken` generated (32-char hex), expires in `CLAIM_TOKEN_EXPIRY_DAYS` days
3. For each valid email in the post:
   - Check `email_logs` — if `claim_invite` already sent today to this email → skip
   - Build unique claim URL: `/claim/TOKEN?email=encoded@email.com`
   - Send claim invite email
   - Log to `email_logs` with `relatedId = post._id`, `relatedType = 'ojt_wall'`
4. If any email sent → mark `claimEmailSent: true` on post

### Response

```json
{
  "success": true,
  "data": {
    "id": "1234567890123456",
    "claimToken": "a3f8c2d1...",
    "emailsSentTo": ["hr@techcorp.com", "jobs@techcorp.com"],
    "emailsSent": 2
  }
}
```

---

## 10. OJT Wall & Claim Flow

### Wall (Public)

- Route: `/wall`
- API: `GET /api/wall` — no auth required
- Shows all posts where `isActive: true`
- Filter by `lead_type`: `intern` (blue badge) or `internship` (green badge)
- Search across `name`, `post_text`, `skills`
- Sorted by `createdAt` descending

### Post Detail

- Route: `/wall/[id]`
- Shows full post, contact info, claim panel if `status: 'unclaimed'`

### Claim Flow

```
User receives claim_invite email
  → clicks link: /claim/TOKEN?email=hr@techcorp.com
  → Claim page loads, calls GET /api/claim/TOKEN?email=hr@techcorp.com
  → Shows: post name, email, post text preview
  → User clicks "Confirm Claim"
  → POST /api/claim/TOKEN?email=hr@techcorp.com
```

**Case 1 — User already logged in:**
- Post marked `claimed`, `claimedBy = session.userId`
- Redirect to `/company/dashboard`

**Case 2 — User NOT logged in, email NOT in DB (new user):**
- New `User` + `Company` created with random 12-char password
- `autoLoginUrl` = `/login?email=...&password=...`
- Credentials email sent with auto-login button
- Page immediately redirects to `autoLoginUrl`
- Login page auto-submits → user lands on dashboard

**Case 3 — User NOT logged in, email EXISTS in DB:**
- Password is **NOT changed** (fixed — previously was being reset)
- Returns `autoLoginUrl` = `/login?email=...` (email only, no password)
- User is redirected to login page with email pre-filled
- User must enter their own password manually

### claimedBy relationship

```
OjtWall.claimedBy → User._id → User.profileRef → Company._id
```

### Student & Company Wall (Authenticated)

Both students and companies have their own wall pages for posting and managing their own listings.

**Student Wall** (`/student/wall`):
- Fetches posts with `?mine=true` — resolves `profileRef` from DB (not stale JWT)
- `mine=true` query uses `$or: [{ postedBy }, { 'SectionData.fbleads.name': regex }, { postedByName: regex }]` to handle legacy posts
- New post modal pre-fills fields from the student's profile
- On save, fires `PATCH /api/profile` in parallel with the wall POST to sync profile changes
- After edit, updates local state directly from response (`d.data`) — no re-fetch needed
- Legacy field fallback handled by `resolvePost()` helper

**Company Wall** (`/company/wall`):
- Fetches posts with `?mine=true&source=company`
- `postedByName` is always the company's `companyName` from the Company model (not the login name)

**Post Your Listing CTA** (landing/public pages):
- Students → `/student/wall`
- Companies → `/company/wall`
- Guests → `/register`

### Wall API — Key Implementation Details

**`app/api/wall/route.ts`**
- `mine=true`: resolves `profileRef` from DB via `User.findById(userId)` to avoid stale JWT
- `$or` query covers: `postedBy` (exact), `SectionData.fbleads.name` (`$regex` contains), `postedByName` (`$regex` contains)
- No recovery block — deleted posts stay deleted
- POST: fetches `Company.companyName` when `role === 'company'` and stamps it as `postedByName` and `SectionData.fbleads.name`

**`app/api/wall/[id]/route.ts`**
- `resolveProfileRef()` helper — always reads fresh `profileRef` from DB
- `checkOwner()` helper — uses `includes()` for name matching (handles legacy name mismatches like `"yug patel WEFDX"`)
- PATCH: builds clean `updateFields` object, wraps in `{ $set: updateFields }` to avoid wiping existing fields
- DELETE: `findByIdAndDelete` (hard delete, no soft-delete / status change)

---

## 11. Password Reset Flow

### Step 1 — Request reset

```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

- Finds user by email
- Generates 32-char hex token
- Saves `resetToken` + `resetTokenExpiry` (1 hour) using:
  ```js
  User.findOneAndUpdate({ _id }, { $set: { resetToken, resetTokenExpiry } }, { strict: false })
  ```
- Sends email with link: `/reset-password?token=TOKEN`
- Always returns `{ success: true }` (prevents email enumeration)

### Step 2 — Validate token (page load)

```
GET /api/auth/reset-password?token=TOKEN
```

- Uses `User.collection.findOne({ resetToken: token })` to bypass Mongoose schema cache
- Returns `{ success: true }` if valid and not expired
- Returns 400 if not found or expired

### Step 3 — Set new password

```
POST /api/auth/reset-password
Body: { "token": "TOKEN", "password": "newpassword" }
```

- Validates token via `User.collection.findOne`
- Hashes new password with bcrypt
- Updates using `User.collection.updateOne` with `$set` + `$unset`
- Clears `resetToken` and `resetTokenExpiry`

> **Why `User.collection` instead of Mongoose methods?**
> `resetToken` and `resetTokenExpiry` are not in the Mongoose schema definition. Mongoose strips unknown fields from queries and updates. Using the raw MongoDB collection driver bypasses this restriction entirely.

---

## 12. Auto-Login Flow

### Via claim (email+password in URL)

After a post is claimed by a non-logged-in user:
1. System generates a random 12-char password
2. Hashes and saves it to the user
3. Builds URL: `/login?email=encoded@email.com&password=encodedpassword`
4. Login page reads these params via `useSearchParams()`
5. Auto-calls `signIn('credentials', { email, password })` on mount
6. On success → redirects to dashboard

### Via auto-login token (JWT cookie — for future use)

Route: `GET /api/auth/auto-login?token=TOKEN`

- Looks up `autoLoginToken` on User
- Validates expiry
- Clears token (one-time use)
- Builds NextAuth JWT payload
- Sets `authjs.session-token` cookie
- Redirects to role-based dashboard

> Currently not used in the main flow (replaced by email+password URL approach for simplicity).

---

## 13. Frontend Pages

| Route | File | Auth | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | None | Landing page |
| `/login` | `app/(auth)/login/page.tsx` | None | Login — supports `?email=&password=` auto-login |
| `/register` | `app/(auth)/register/page.tsx` | None | Registration |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | None | Request password reset |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | None | Set new password via token |
| `/wall` | `app/wall/page.tsx` | None (public) | OJT Wall listing |
| `/wall/[id]` | `app/wall/[id]/page.tsx` | None (public) | Post detail + claim panel |
| `/claim/[token]` | `app/claim/[token]/page.tsx` | None | Claim a post |
| `/student/dashboard` | `app/student/dashboard/` | student | Student dashboard |
| `/student/profile` | `app/student/profile/` | student | Edit student profile |
| `/student/connections` | `app/student/connections/` | student | Student connections |
| `/student/verification` | `app/student/verification/` | student | Request verification |
| `/company/dashboard` | `app/company/dashboard/` | company | Company dashboard |
| `/company/profile` | `app/company/profile/` | company | Edit company profile |
| `/company/search` | `app/company/search/` | company | Search students |
| `/company/connections` | `app/company/connections/` | company | Company connections |
| `/university-admin/dashboard` | `app/university-admin/dashboard/` | university_admin | University dashboard |
| `/university-admin/students` | `app/university-admin/students/` | university_admin | Manage students |
| `/university-admin/profile` | `app/university-admin/profile/` | university_admin | Edit university profile |
| `/admin/dashboard` | `app/admin/dashboard/` | super_admin | Admin dashboard |
| `/admin/users` | `app/admin/users/` | super_admin | Manage users |
| `/admin/universities` | `app/admin/universities/` | super_admin | Manage universities |
| `/admin/posts` | `app/admin/posts/` | super_admin | Manage wall posts |
| `/admin/email-logs` | `app/admin/email-logs/` | super_admin | View email logs |

---

## 14. Components

### UI Components (`components/ui/`)

| Component | Description |
|---|---|
| `Button` | Primary/outline/ghost variants, loading state |
| `Input` | Labeled input with error state |
| `Badge` | Color-coded badge |
| `Avatar` | Initials-based avatar |
| `Modal` | Dialog overlay — sticky header with title + close button separated by `border-b`. Content scrolls inside `flex-1 overflow-y-auto`. Max height `90vh` |
| `Toast` | Notification toast |
| `Tabs` | Tab switcher |
| `Select` | Dropdown select |
| `SkillTag` | Skill pill tag |
| `Pagination` | Page navigation |
| `EmptyState` | Empty list placeholder |
| `LoadingSpinner` | Spinner |

### Layout Components (`components/layout/`)

| Component | Description |
|---|---|
| `Sidebar` | Role-aware navigation sidebar (dark for admin) |
| `DashboardLayout` | Wraps dashboard pages with sidebar |
| `Navbar` | Top navigation bar |
| `Footer` | Page footer |

### Card Components (`components/cards/`)

| Component | Description |
|---|---|
| `PostCard` | OJT Wall post card — shows name, lead_type badge, skills, claim status. Uses lucide icons: `Monitor` (setup), `MapPin` (location), `Users` (slots), `Banknote` (allowance), `CheckCircle2`/`Clock` (status). Hover state: `hover:border-gray-300` |
| `StudentCard` | Student profile card |
| `UniversityCard` | University card |

---

## 15. Role & Permission System

File: `lib/rbac.ts`

Four roles:

| Role | Dashboard | Key Permissions |
|---|---|---|
| `super_admin` | `/admin/dashboard` | Full access to all modules |
| `university_admin` | `/university-admin/dashboard` | Manage own university students |
| `company` | `/company/dashboard` | View wall, manage profile, connections |
| `student` | `/student/dashboard` | View wall, request verification, connections |

Functions:
- `checkPermission(roleId, moduleName, action)` → Boolean
- `getRolePermissions(roleId)` → permissions array
- `requirePermission(roleId, moduleName, action)` → throws if denied

---

## 16. Seed Data

File: `lib/seed.ts`

Runs once on first DB connection when `SEED_DUMMY_DATA=true`. Skips if `Role.countDocuments() > 0`.

Seeds:
- 4 Roles (super_admin, university_admin, student, company)
- 2 Universities
- 3 Companies
- 4 Students
- 10 Users
- 12 OjtWall posts (mix of intern/internship, claimed/unclaimed)
- 5 EmailLogs
- 6 Connections

Demo credentials:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ojtconnect.ph | Admin@123 |
| Student | juan@student.ph | Test@123 |
| Company | hr@techcorp.ph | Test@123 |
| University | upd@ojtconnect.ph | Test@123 |

---

## 17. Known Issues & Notes

### Mongoose Schema Cache Issue
`resetToken`, `resetTokenExpiry`, `autoLoginToken`, `autoLoginTokenExpiry` on the User model are NOT defined in the Mongoose schema. All reads/writes for these fields must use `User.collection.findOne()` and `User.collection.updateOne()` directly. Using `User.findOne()` or `user.save()` will silently ignore these fields.

### Emails Not Wired (Pending)
These email functions exist in `lib/email.ts` but are not yet called from their respective APIs:
- `sendConnectionRequestEmail` — not called in `POST /api/connections`
- `sendStudentVerifiedEmail` — not called in `POST /api/students/[id]/verify`
- `sendUniversityVerifiedEmail` — not called in `POST /api/universities/[id]/verify`
- `sendWelcomeEmail` — not called after registration

### Company & Student Wall Post Creation
Companies and students can now create wall posts from their respective wall pages (`/company/wall`, `/student/wall`). The `POST /api/wall` endpoint handles creation for both roles. Scraper-imported posts remain the primary source for the public wall.

### Student Profile — No University Picker
The `universityId` field exists in the Student model but the `/student/profile` edit form does not expose it. This blocks the university verification request flow for newly registered students.

### Wall is Fully Public
`GET /api/wall` has no auth check. Contact emails and phone numbers in posts are visible to anyone without logging in.

### Claim Token vs Auto-Login Token
- `claimToken` — on `OjtWall`, used to identify which post is being claimed
- `autoLoginToken` — on `User`, used for JWT-cookie-based auto-login (built but not used in current flow)
- New users: auto-login uses `?email=&password=` URL params
- Existing users: redirected to `/login?email=...` only — password NOT changed or exposed

### Slug Uniqueness
Company and University slugs are generated via `slugify()` but there is no retry on collision. The claim flow appends the last 4 chars of the company ID to reduce collision risk.

### SEED_DUMMY_DATA
Set to `true` in `.env.local`. The seeder has already run once — it will skip on all subsequent starts. Set to `false` in production.

### Legacy Post Structure
Some scraped posts (e.g. `_id: "1774009662618760"`) have no `postedBy`, no `source`, no `title` — all data lives in `SectionData.fbleads`. The name field may include suffixes (e.g. `"yug patel WEFDX"`) that don't exactly match the session user's name. The `mine=true` query and `checkOwner()` both use `$regex` / `includes()` to handle this.

### Session profileRef Staleness
The JWT can be stale — `profileRef` in the session token may not reflect the latest DB value. All ownership checks and `mine=true` queries resolve `profileRef` fresh from `User.findById(userId)` rather than trusting the session.

---

## 18. Changelog

### June 2026

#### Wall API — `mine=true` & Ownership Fixes
- `GET /api/wall?mine=true` now resolves `profileRef` from DB (not JWT) to avoid stale session issues
- Query changed from exact name match to `$regex` contains match — fixes legacy posts with name suffixes (e.g. `"yug patel WEFDX"`)
- `checkOwner()` in `[id]/route.ts` uses `includes()` instead of exact match for both PATCH and DELETE
- PATCH now wraps update fields in `{ $set: updateFields }` — previously passed body directly, wiping all other fields
- DELETE changed to `findByIdAndDelete` (hard delete)
- Removed recovery block from GET that was resetting `status: 'unclaimed'` on every load when `total === 0`, which was undoing deletes
- `postedByName` is now always stamped on POST/PATCH so `mine=true` re-fetch returns the post correctly

#### Company Display Name Fix
- `POST /api/wall` now fetches `companyName` from the `Company` model when `role === 'company'`
- Uses `companyName` as both `postedByName` and `SectionData.fbleads.name` instead of `session.user.name` (login name)

#### Claim Flow — Password Reset Fix
- When an existing user claims a scraped post, their password is **no longer reset**
- Returns `autoLoginUrl: /login?email=...` (email only) — user must enter their own password
- Previously was resetting password and auto-logging in, which was a security issue

#### Student Wall — Profile Pre-fill & Sync
- New post modal pre-fills fields from the student's profile
- On save, `PATCH /api/profile` fires in parallel with the wall POST to sync profile changes
- After edit, local state updated directly from `d.data` — no re-fetch

#### UI Polish — Lucide Icons
- Replaced all emoji icons with lucide-react icons across all wall pages and cards
- `PostCard`: `Monitor` (setup), `MapPin` (location), `Users` (slots), `Banknote` (allowance), `CheckCircle2`/`Clock` (status)
- `student/wall/page.tsx`: `MapPin` (location), `Timer` (duration), `Clock` (date)
- `company/wall/page.tsx`: `MapPin`, `Banknote`, `Users`, `CalendarClock`, `Clock`

#### Modal Component Rewrite
- Sticky header with title + X button separated by `border-b`
- Content area: `flex-1 overflow-y-auto px-6 py-5`
- Max height: `90vh`
- Removed inner `max-h-[70vh] overflow-y-auto` scroll containers from modal content in student/company wall pages

#### Claim Page — LoadingSpinner
- `app/claim/[token]/page.tsx` now uses the `LoadingSpinner` component instead of `Loader2` from lucide-react

#### Login Page — Email Pre-fill
- Pre-fills email field from `?email=` query param
- Auto-submits only when **both** `?email=` and `?password=` are present (not on email-only redirect)
