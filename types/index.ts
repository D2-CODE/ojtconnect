import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Shared primitive — all _id fields are 16-digit numeric strings
// ---------------------------------------------------------------------------
export type OjtId = string;

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------
export interface IModulePermission {
  moduleName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface IRole {
  _id: OjtId;
  name: string; // 'super_admin' | 'university_admin' | 'company' | 'student'
  label: string; // Human-readable label e.g. "Super Admin"
  permissions: IModulePermission[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export type ProfileType = "student" | "company" | "university_admin" | "super_admin";

export interface IUser {
  _id: OjtId;
  email: string;
  passwordHash: string;
  name: string;
  roleId: OjtId;
  roleName: string;
  profileType: ProfileType;
  profileRef: OjtId | null; // References student / company / university _id
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface IUniversity {
  _id: OjtId;
  name: string;
  slug: string;
  address: string;
  city: string;
  province: string;
  region: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  adminUserId?: OjtId; // Linked user account
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: Date;
  claimToken?: string;
  claimTokenExpiresAt?: Date;
  isClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export interface IStudent {
  _id: OjtId;
  userId?: OjtId;
  universityId: OjtId;
  universityName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  course: string;
  yearLevel: number; // 1–5
  ojtHoursRequired: number;
  ojtHoursRendered: number;
  skills: string[];
  bio?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  availableFrom?: Date;
  availableTo?: Date;
  preferredSetup?: "onsite" | "remote" | "hybrid";
  preferredLocation?: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------
export interface ICompany {
  _id: OjtId;
  userId?: OjtId;
  name: string;
  slug: string;
  industry: string;
  size?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  address: string;
  city: string;
  province: string;
  region: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  benefits?: string[];
  techStack?: string[];
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: Date;
  claimToken?: string;
  claimTokenExpiresAt?: Date;
  isClaimed: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// OJT Wall (job postings / internship listings)
// ---------------------------------------------------------------------------
export type WallPostStatus = "open" | "closed" | "draft";
export type WorkSetup = "onsite" | "remote" | "hybrid";

export interface IOjtWall {
  _id: OjtId;
  companyId: OjtId;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  slug: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  workSetup: WorkSetup;
  location: string;
  city: string;
  province: string;
  hoursRequired: number;
  allowance?: number; // PHP
  slots: number;
  status: WallPostStatus;
  applicationDeadline?: Date;
  startDate?: Date;
  viewCount: number;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Facebook Leads (scraped / imported)
// ---------------------------------------------------------------------------
export interface IFbLead {
  _id: OjtId;
  fbPageId?: string;
  fbPageName?: string;
  entityType: "company" | "university";
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  logoUrl?: string;
  fbProfileUrl?: string;
  claimToken?: string;
  claimTokenExpiresAt?: Date;
  claimEmailSentAt?: Date;
  claimEmailStatus?: "pending" | "sent" | "failed" | "claimed";
  linkedEntityId?: OjtId; // ID of created company/university after claim
  rawData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Email Logs
// ---------------------------------------------------------------------------
export type EmailStatus = "sent" | "failed" | "queued";
export type EmailType =
  | "welcome"
  | "claim_invite"
  | "connection_request"
  | "student_verified"
  | "university_verified"
  | "generic";

export interface IEmailLog {
  _id: OjtId;
  to: string;
  subject: string;
  type: EmailType;
  status: EmailStatus;
  errorMessage?: string;
  relatedEntityId?: OjtId;
  relatedEntityType?: string;
  sentAt?: Date;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Connections (student ↔ company)
// ---------------------------------------------------------------------------
export type ConnectionStatus = "pending" | "accepted" | "declined" | "withdrawn";

export interface IConnection {
  _id: OjtId;
  fromType: "student" | "company";
  fromId: OjtId;
  fromName: string;
  fromEmail: string;
  toType: "student" | "company";
  toId: OjtId;
  toName: string;
  toEmail: string;
  wallPostId?: OjtId; // If triggered by a job post
  message?: string;
  status: ConnectionStatus;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// NextAuth Session Extensions
// ---------------------------------------------------------------------------
export interface SessionUser {
  userId: OjtId;
  email: string;
  name: string;
  roleName: string;
  roleId: OjtId;
  profileType: ProfileType;
  profileRef: OjtId | null;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: SessionUser & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    userId: OjtId;
    roleName: string;
    roleId: OjtId;
    profileType: ProfileType;
    profileRef: OjtId | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: OjtId;
    roleName: string;
    roleId: OjtId;
    profileType: ProfileType;
    profileRef: OjtId | null;
  }
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>; // Field-level validation errors
  meta?: ApiMeta;
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta;
}
