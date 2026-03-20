/**
 * Email sender utilities for OJT Connect PH.
 *
 * All functions send via Nodemailer SMTP (configured via env vars) and
 * log every send attempt to the `email_logs` MongoDB collection.
 */

import nodemailer from "nodemailer";
import { generateId } from "@/lib/utils";
import type { EmailType, EmailStatus } from "@/types";
import EmailLog from "@/models/EmailLog";

// ---------------------------------------------------------------------------
// Transporter factory (created once per process)
// ---------------------------------------------------------------------------
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
    secure: Number(process.env.EMAIL_SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_SMTP_USER ?? "",
      pass: process.env.EMAIL_SMTP_PASS ?? "",
    },
  });

  return _transporter;
}

// ---------------------------------------------------------------------------
// Internal log helper
// ---------------------------------------------------------------------------
async function logEmail(opts: {
  to: string;
  subject: string;
  type: EmailType;
  status: EmailStatus;
  errorMessage?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}): Promise<void> {
  try {
    await EmailLog.create({
      _id: generateId(),
      to: opts.to,
      from: process.env.EMAIL_FROM ?? "noreply@ojtconnect.ph",
      subject: opts.subject,
      template: opts.type as import("@/models/EmailLog").EmailTemplate,
      status: opts.status === "sent" ? "sent" : "failed",
      statusMessage: opts.errorMessage,
      relatedId: opts.relatedEntityId,
      relatedType: (() => {
        const map: Record<string, string> = {
          OjtWall: 'ojt_wall',
          ojt_wall: 'ojt_wall',
          User: 'user',
          user: 'user',
          University: 'university',
          university: 'university',
          Student: 'student',
          student: 'student',
          Connection: 'connection',
          connection: 'connection',
        };
        return opts.relatedEntityType ? (map[opts.relatedEntityType] ?? undefined) : undefined;
      })(),
      attempts: 1,
      sentAt: opts.status === "sent" ? new Date() : undefined,
    });
  } catch (err) {
    console.error("[EmailLog] Failed to write log:", err);
  }
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Sends an email and returns true on success, false on failure.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  type: EmailType = "generic",
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<boolean> {
  let sendError: string | undefined;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_APP_NAME ?? "OJT Connect PH"}" <${process.env.EMAIL_FROM ?? "noreply@ojtconnect.ph"}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send to ${to}:`, sendError);
  }

  // Always log — success or failure
  await logEmail({
    to,
    subject,
    type,
    status: sendError ? "failed" : "sent",
    errorMessage: sendError,
    relatedEntityId,
    relatedEntityType,
  });

  return !sendError;
}

// ---------------------------------------------------------------------------
// Specific email senders
// ---------------------------------------------------------------------------

/**
 * Sends a claim invitation email with a unique claim URL.
 */
export async function sendClaimInviteEmail(
  to: string,
  name: string,
  claimUrl: string
): Promise<boolean> {
  const subject = `Claim your ${process.env.NEXT_PUBLIC_APP_NAME ?? "OJT Connect PH"} profile`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">OJT Connect PH</h1>
        </div>
        <h2 style="font-size: 20px;">Hello, ${name}!</h2>
        <p>We found your organization on OJT Connect PH and have created a profile for you.</p>
        <p>Claim your profile to start connecting with OJT students across the Philippines.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${claimUrl}"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Claim Your Profile
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in ${process.env.CLAIM_TOKEN_EXPIRY_DAYS ?? 7} days.<br>
          If you did not expect this email, you can safely ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} OJT Connect PH. All rights reserved.
        </p>
      </body>
    </html>
  `;
  return sendEmail(to, subject, html, "claim_invite");
}

/**
 * Notifies a company of a new connection request from a student (or vice versa).
 */
export async function sendConnectionRequestEmail(
  to: string,
  fromName: string,
  fromType: "student" | "company",
  message: string,
  contactEmail: string
): Promise<boolean> {
  const fromLabel = fromType === "student" ? "student" : "company";
  const subject = `New connection request from ${fromName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">OJT Connect PH</h1>
        </div>
        <h2 style="font-size: 20px;">New Connection Request</h2>
        <p>You have received a connection request from <strong>${fromName}</strong> (${fromLabel}).</p>
        ${message ? `<blockquote style="border-left: 4px solid #2563eb; margin: 16px 0; padding: 12px 16px; background: #eff6ff; border-radius: 4px;">${message}</blockquote>` : ""}
        <p>You can reply directly to this email or contact them at: <a href="mailto:${contactEmail}">${contactEmail}</a></p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View on OJT Connect PH
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} OJT Connect PH. All rights reserved.
        </p>
      </body>
    </html>
  `;
  return sendEmail(to, subject, html, "connection_request");
}

/**
 * Notifies a student of their verification result.
 */
export async function sendStudentVerifiedEmail(
  to: string,
  name: string,
  status: "verified" | "rejected",
  reason?: string
): Promise<boolean> {
  const isVerified = status === "verified";
  const subject = isVerified
    ? "Your OJT Connect PH student profile has been verified!"
    : "Update on your OJT Connect PH student profile verification";

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">OJT Connect PH</h1>
        </div>
        <h2 style="font-size: 20px;">Hello, ${name}!</h2>
        ${
          isVerified
            ? `<p>Great news! Your student profile on OJT Connect PH has been <strong style="color: #16a34a;">verified</strong>. You can now apply to OJT postings and connect with companies.</p>`
            : `<p>Unfortunately, your student profile verification was <strong style="color: #dc2626;">not approved</strong> at this time.</p>
               ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
               <p>Please update your profile and re-submit for verification, or contact support for assistance.</p>`
        }
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/student/dashboard"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} OJT Connect PH. All rights reserved.
        </p>
      </body>
    </html>
  `;
  return sendEmail(to, subject, html, "student_verified");
}

/**
 * Notifies a university admin of their institution's verification result.
 */
export async function sendUniversityVerifiedEmail(
  to: string,
  uniName: string,
  status: "verified" | "rejected",
  reason?: string
): Promise<boolean> {
  const isVerified = status === "verified";
  const subject = isVerified
    ? `${uniName} has been verified on OJT Connect PH`
    : `Update on ${uniName}'s verification on OJT Connect PH`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">OJT Connect PH</h1>
        </div>
        <h2 style="font-size: 20px;">${uniName}</h2>
        ${
          isVerified
            ? `<p>Your university has been <strong style="color: #16a34a;">verified</strong> on OJT Connect PH. Your institution and students are now fully visible to companies on the platform.</p>`
            : `<p>Your university verification was <strong style="color: #dc2626;">not approved</strong> at this time.</p>
               ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
               <p>Please review the feedback and re-submit, or contact support for assistance.</p>`
        }
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/university-admin/dashboard"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} OJT Connect PH. All rights reserved.
        </p>
      </body>
    </html>
  `;
  return sendEmail(to, subject, html, "university_verified");
}

/**
 * Sends a welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "OJT Connect PH";
  const subject = `Welcome to ${appName}!`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">${appName}</h1>
        </div>
        <h2 style="font-size: 20px;">Welcome, ${name}!</h2>
        <p>Thank you for joining <strong>${appName}</strong> — the premier OJT portal for Filipino students and companies.</p>
        <p>Here's what you can do next:</p>
        <ul style="line-height: 1.8;">
          <li>Complete your profile</li>
          <li>Browse internship opportunities on the OJT Wall</li>
          <li>Connect with companies and universities</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Get Started
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </body>
    </html>
  `;
  return sendEmail(to, subject, html, "welcome");
}
