import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';

const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
const IS_HTTPS = process.env.NEXTAUTH_URL?.startsWith('https') ?? false;
const COOKIE_NAME = IS_HTTPS ? '__Secure-authjs.session-token' : 'authjs.session-token';
// Auth.js v5 uses the cookie name as the salt for JWT encoding
const JWT_SALT = COOKIE_NAME;

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);

    await connectDB();
    console.log('[AutoLogin] looking up token:', token);
    const user = await User.findOne({ autoLoginToken: token }).select('_id email name role profileType profileRef autoLoginToken autoLoginTokenExpiry');
    console.log('[AutoLogin] user found:', user ? { id: user._id, email: user.email, expiry: user.autoLoginTokenExpiry } : null);

    if (!user) return NextResponse.redirect(`${appUrl}/login?error=invalid_token`);
    if (!user.autoLoginTokenExpiry || user.autoLoginTokenExpiry < new Date()) {
      console.log('[AutoLogin] token expired');
      return NextResponse.redirect(`${appUrl}/login?error=token_expired`);
    }

    // One-time use — clear immediately
    user.autoLoginToken = undefined;
    user.autoLoginTokenExpiry = undefined;
    await user.save();

    const role = await Role.findOne({ _id: user.role }).lean<{ _id: string; roleName: string }>();
    const roleName = role?.roleName ?? 'company';

    // Build JWT payload matching the session shape in lib/auth.ts
    const jwt = await encode({
      token: {
        sub: String(user._id),
        userId: String(user._id),
        email: user.email as string,
        name: user.name as string,
        roleName,
        roleId: String(user.role),
        profileType: user.profileType as string,
        profileRef: user.profileRef ? String(user.profileRef) : null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      secret: AUTH_SECRET!,
      salt: JWT_SALT,
    });

    const dashboardMap: Record<string, string> = {
      company: '/company/dashboard',
      student: '/student/dashboard',
      university_admin: '/university-admin/dashboard',
      super_admin: '/admin/dashboard',
    };

    console.log('[AutoLogin] roleName:', roleName, '→', dashboardMap[roleName]);

    const res = NextResponse.redirect(`${appUrl}${dashboardMap[roleName] ?? '/company/dashboard'}`);
    res.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: IS_HTTPS,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error('[AutoLogin]', err);
    return NextResponse.redirect(`${appUrl}/login?error=autologin_failed`);
  }
}
