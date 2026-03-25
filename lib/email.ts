import nodemailer from 'nodemailer';
import { generateId } from '@/lib/utils';
import type { EmailType, EmailStatus } from '@/types';
import EmailLog from '@/models/EmailLog';

// ---------------------------------------------------------------------------
// Transporter
// ---------------------------------------------------------------------------
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
    secure: Number(process.env.EMAIL_SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_SMTP_USER ?? '',
      pass: process.env.EMAIL_SMTP_PASS ?? '',
    },
  });
  return _transporter;
}

// ---------------------------------------------------------------------------
// Shared layout wrapper — clean, minimal, brand-consistent
// ---------------------------------------------------------------------------
function layout(content: string): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'OJT Connect PH';
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${appName}</title></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);max-width:600px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:#0F6E56;padding:24px 32px">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">${appName}</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
              You received this email because you have an account on <strong>${appName}</strong>.<br>
              &copy; ${year} ${appName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0">
    <tr>
      <td style="background:#0F6E56;border-radius:8px">
        <a href="${href}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.1px">${label}</a>
      </td>
    </tr>
  </table>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">${text}</h1>`;
}

function p(text: string, style = ''): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#374151;${style}">${text}</p>`;
}

function infoBox(rows: { label: string; value: string }[]): string {
  const cells = rows.map(r =>
    `<tr>
      <td style="padding:8px 14px;font-size:13px;color:#6b7280;white-space:nowrap;width:1%">${r.label}</td>
      <td style="padding:8px 14px;font-size:13px;color:#111827;font-weight:500">${r.value}</td>
    </tr>`
  ).join('');
  return `<table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;width:100%;margin:16px 0">${cells}</table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">`;
}

// ---------------------------------------------------------------------------
// Log helper
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
  const typeMap: Record<string, string> = {
    OjtWall: 'ojt_wall', ojt_wall: 'ojt_wall',
    User: 'user', user: 'user',
    University: 'university', university: 'university',
    Student: 'student', student: 'student',
    Connection: 'connection', connection: 'connection',
  };
  try {
    await EmailLog.create({
      _id: generateId(),
      to: opts.to,
      from: process.env.EMAIL_FROM ?? 'noreply@ojtconnect.ph',
      subject: opts.subject,
      template: opts.type as import('@/models/EmailLog').EmailTemplate,
      status: opts.status === 'sent' ? 'sent' : 'failed',
      statusMessage: opts.errorMessage,
      relatedId: opts.relatedEntityId,
      relatedType: opts.relatedEntityType ? (typeMap[opts.relatedEntityType] ?? undefined) : undefined,
      attempts: 1,
      sentAt: opts.status === 'sent' ? new Date() : undefined,
    });
  } catch (err) {
    console.error('[EmailLog] Failed to write log:', err);
  }
}

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  type: EmailType = 'generic',
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'OJT Connect PH';
  let sendError: string | undefined;
  try {
    await getTransporter().sendMail({
      from: `"${appName}" <${process.env.EMAIL_FROM ?? 'noreply@ojtconnect.ph'}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send to ${to}:`, sendError);
  }
  await logEmail({ to, subject, type, status: sendError ? 'failed' : 'sent', errorMessage: sendError, relatedEntityId, relatedEntityType });
  return !sendError;
}

// ---------------------------------------------------------------------------
// 0. OTP verification
// ---------------------------------------------------------------------------
export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const subject = `Your OJT Connect PH verification code: ${otp}`;
  const html = layout(`
    ${h1('Verify your email address')}
    ${p('Use the code below to verify your email. It expires in <strong>10 minutes</strong>.')}
    <div style="margin:28px 0;text-align:center">
      <span style="display:inline-block;background:#f0faf6;border:2px dashed #0F6E56;border-radius:12px;padding:18px 40px;font-size:36px;font-weight:700;letter-spacing:10px;color:#0F6E56">${otp}</span>
    </div>
    ${p('If you did not request this, you can safely ignore this email.', 'font-size:13px;color:#6b7280')}
  `);
  return sendEmail(to, subject, html, 'generic');
}

// ---------------------------------------------------------------------------
// 1. Welcome — new registration
// ---------------------------------------------------------------------------
export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: 'student' | 'company' | 'university'
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const firstName = name.split(' ')[0];

  const roleConfig = {
    student: {
      subject: `${firstName}, your OJT Connect PH account is ready`,
      headline: `Welcome aboard, ${firstName}!`,
      body: `Your student account has been created. You can now browse internship opportunities on the OJT Wall, get university-verified, and connect directly with companies looking for OJT candidates.`,
      steps: ['Complete your student profile with your course and skills', 'Set your university and request verification', 'Browse the OJT Wall and connect with companies'],
      cta: `${appUrl}/student/dashboard`,
      ctaLabel: 'Go to My Dashboard',
    },
    company: {
      subject: `${firstName}, start finding OJT candidates on OJT Connect PH`,
      headline: `Welcome to OJT Connect PH, ${firstName}!`,
      body: `Your company account is live. You can now post internship listings, search verified student candidates, and send connection requests — all in one place.`,
      steps: ['Complete your company profile', 'Post your internship listing on the wall', 'Search and connect with verified students'],
      cta: `${appUrl}/company/dashboard`,
      ctaLabel: 'Set Up My Company Profile',
    },
    university: {
      subject: `${firstName}, your university account is pending verification`,
      headline: `Thanks for registering, ${firstName}!`,
      body: `Your university account has been submitted and is currently under review by our admin team. Once verified, your students will be able to request university verification through your dashboard.`,
      steps: ['Wait for admin verification (usually within 24 hours)', 'Complete your university profile', 'Start verifying your students'],
      cta: `${appUrl}/university-admin/dashboard`,
      ctaLabel: 'View My Dashboard',
    },
  }[role];

  const stepsHtml = roleConfig.steps.map((s, i) =>
    `<tr>
      <td style="padding:6px 0;vertical-align:top;width:28px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#0F6E56;color:#fff;border-radius:50%;font-size:11px;font-weight:700">${i + 1}</span>
      </td>
      <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6">${s}</td>
    </tr>`
  ).join('');

  const html = layout(`
    ${h1(roleConfig.headline)}
    ${p(roleConfig.body)}
    <table cellpadding="0" cellspacing="0" style="margin:20px 0">${stepsHtml}</table>
    ${btn(roleConfig.cta, roleConfig.ctaLabel)}
    ${divider()}
    ${p(`If you have any questions, just reply to this email — we're happy to help.`, 'font-size:13px;color:#6b7280')}
  `);

  return sendEmail(to, roleConfig.subject, html, 'welcome');
}

// ---------------------------------------------------------------------------
// 2. Claim invite — scraped post
// ---------------------------------------------------------------------------
export async function sendClaimInviteEmail(
  to: string,
  name: string,
  claimUrl: string,
  postPreview?: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const expiryDays = process.env.CLAIM_TOKEN_EXPIRY_DAYS ?? '7';
  const firstName = name.split(' ')[0];
  const subject = `${firstName}, we found your internship post — claim it on OJT Connect PH`;

  const previewBlock = postPreview
    ? `<blockquote style="border-left:3px solid #0F6E56;margin:16px 0;padding:12px 16px;background:#f0faf6;border-radius:0 6px 6px 0;font-size:13px;color:#374151;line-height:1.6">${postPreview.slice(0, 200)}${postPreview.length > 200 ? '…' : ''}</blockquote>`
    : '';

  const html = layout(`
    ${h1(`Hi ${firstName}, your post is on OJT Connect PH`)}
    ${p(`We found an internship listing associated with <strong>${name}</strong> and added it to our OJT Wall — a free platform connecting Filipino students with companies offering OJT.`)}
    ${previewBlock}
    ${p(`Claim your listing to:`)}
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:2">
      <li>Edit and update your post anytime</li>
      <li>Receive direct connection requests from verified students</li>
      <li>Manage your company profile on the platform</li>
    </ul>
    ${btn(claimUrl, 'Claim My Listing')}
    ${p(`This link expires in <strong>${expiryDays} days</strong>. If this post isn't yours, you can safely ignore this email.`, 'font-size:13px;color:#6b7280')}
    ${divider()}
    ${p(`Questions? Visit <a href="${appUrl}" style="color:#0F6E56">${appUrl}</a> or reply to this email.`, 'font-size:13px;color:#6b7280')}
  `);

  return sendEmail(to, subject, html, 'claim_invite');
}

// ---------------------------------------------------------------------------
// 3. Claim credentials — new user created via claim flow
// ---------------------------------------------------------------------------
export async function sendClaimCredentialsEmail(
  to: string,
  companyName: string,
  rawPassword: string,
  autoLoginUrl: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const firstName = companyName.split(' ')[0];
  const subject = `${firstName}, your OJT Connect PH account credentials`;

  const html = layout(`
    ${h1(`Your account is ready, ${firstName}!`)}
    ${p(`You claimed a listing on OJT Connect PH, so we created an account for you. Here are your login credentials — save them somewhere safe.`)}
    ${infoBox([
      { label: 'Email', value: to },
      { label: 'Password', value: rawPassword },
    ])}
    ${btn(autoLoginUrl, 'Log In to My Account')}
    ${p(`You can also sign in manually at <a href="${appUrl}/login" style="color:#0F6E56">${appUrl}/login</a> using the credentials above.`, 'font-size:13px;color:#6b7280')}
    ${divider()}
    ${p(`We recommend changing your password after your first login.`, 'font-size:13px;color:#6b7280')}
  `);

  return sendEmail(to, subject, html, 'welcome');
}

// ---------------------------------------------------------------------------
// 4. Password reset
// ---------------------------------------------------------------------------
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  const firstName = name.split(' ')[0];
  const subject = `${firstName}, here's your password reset link`;

  const html = layout(`
    ${h1(`Reset your password, ${firstName}`)}
    ${p(`We received a request to reset the password for your OJT Connect PH account. Click the button below to choose a new password.`)}
    ${btn(resetUrl, 'Reset My Password')}
    ${p(`This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.`, 'font-size:13px;color:#6b7280')}
    ${divider()}
    ${p(`Can't click the button? Copy and paste this link into your browser:<br><span style="color:#0F6E56;word-break:break-all">${resetUrl}</span>`, 'font-size:13px;color:#6b7280')}
  `);

  return sendEmail(to, subject, html, 'welcome', undefined, 'User');
}

// ---------------------------------------------------------------------------
// 5. Connection request
// ---------------------------------------------------------------------------
export async function sendConnectionRequestEmail(
  to: string,
  toName: string,
  fromName: string,
  fromType: 'student' | 'company',
  message: string,
  dashboardUrl: string
): Promise<boolean> {
  const firstName = toName.split(' ')[0];
  const fromLabel = fromType === 'student' ? 'student' : 'company';
  const subject = `${fromName} wants to connect with you on OJT Connect PH`;

  const messageBlock = message
    ? `<blockquote style="border-left:3px solid #0F6E56;margin:16px 0;padding:12px 16px;background:#f0faf6;border-radius:0 6px 6px 0;font-size:14px;color:#374151;line-height:1.6;font-style:italic">"${message}"</blockquote>`
    : '';

  const html = layout(`
    ${h1(`${firstName}, you have a new connection request`)}
    ${p(`<strong>${fromName}</strong> (${fromLabel}) sent you a connection request on OJT Connect PH.`)}
    ${messageBlock}
    ${p(`Log in to accept or decline the request.`)}
    ${btn(dashboardUrl, 'View Request')}
    ${divider()}
    ${p(`You can manage all your connection requests from your dashboard.`, 'font-size:13px;color:#6b7280')}
  `);

  return sendEmail(to, subject, html, 'connection_request');
}

// ---------------------------------------------------------------------------
// 6. Student verification result
// ---------------------------------------------------------------------------
export async function sendStudentVerifiedEmail(
  to: string,
  name: string,
  universityName: string,
  status: 'verified' | 'rejected',
  reason?: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const firstName = name.split(' ')[0];

  const subject = status === 'verified'
    ? `${firstName}, your student profile is now verified by ${universityName}`
    : `${firstName}, an update on your verification request`;

  const bodyContent = status === 'verified'
    ? `
      ${h1(`You're verified, ${firstName}! 🎉`)}
      ${p(`<strong>${universityName}</strong> has verified your student profile on OJT Connect PH. Your profile now shows a verified badge, which increases your credibility with companies.`)}
      ${p(`Here's what you can do now:`)}
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:2">
        <li>Post your OJT availability on the student wall</li>
        <li>Accept connection requests from companies</li>
        <li>Browse and apply to internship listings</li>
      </ul>
      ${btn(`${appUrl}/student/dashboard`, 'Go to My Dashboard')}
    `
    : `
      ${h1(`Update on your verification, ${firstName}`)}
      ${p(`Your verification request to <strong>${universityName}</strong> was not approved at this time.`)}
      ${reason ? infoBox([{ label: 'Reason', value: reason }]) : ''}
      ${p(`You can update your profile and resubmit your verification request from your dashboard.`)}
      ${btn(`${appUrl}/student/verification`, 'Resubmit Request')}
      ${divider()}
      ${p(`If you believe this is a mistake, please contact your university OJT coordinator directly.`, 'font-size:13px;color:#6b7280')}
    `;

  const html = layout(bodyContent);
  return sendEmail(to, subject, html, 'student_verified');
}

// ---------------------------------------------------------------------------
// 7. University verification result
// ---------------------------------------------------------------------------
export async function sendUniversityVerifiedEmail(
  to: string,
  adminName: string,
  uniName: string,
  status: 'verified' | 'rejected',
  reason?: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const firstName = adminName.split(' ')[0];

  const subject = status === 'verified'
    ? `${uniName} is now verified on OJT Connect PH`
    : `${firstName}, an update on ${uniName}'s verification`;

  const bodyContent = status === 'verified'
    ? `
      ${h1(`${uniName} is verified! 🎉`)}
      ${p(`Hi ${firstName}, your university has been verified on OJT Connect PH. Your institution is now fully visible to students and companies on the platform.`)}
      ${p(`You can now:`)}
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:2">
        <li>Verify student profiles from your university</li>
        <li>Manage your university's public profile</li>
        <li>Track your students' OJT placements</li>
      </ul>
      ${btn(`${appUrl}/university-admin/dashboard`, 'Go to Dashboard')}
    `
    : `
      ${h1(`Update on ${uniName}'s verification`)}
      ${p(`Hi ${firstName}, your university verification request was not approved at this time.`)}
      ${reason ? infoBox([{ label: 'Reason', value: reason }]) : ''}
      ${p(`Please review the feedback, update your university profile, and resubmit for verification.`)}
      ${btn(`${appUrl}/university-admin/profile`, 'Update Profile')}
      ${divider()}
      ${p(`Need help? Reply to this email and our team will assist you.`, 'font-size:13px;color:#6b7280')}
    `;

  const html = layout(bodyContent);
  return sendEmail(to, subject, html, 'university_verified');
}
