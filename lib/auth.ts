import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import type { ProfileType } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) throw new Error("Email and password are required.");

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() }).lean<{
          _id: string;
          email: string;
          password: string;
          name: string;
          role: string;
          profileType: string;
          profileRef?: string;
          isActive: boolean;
        }>();

        if (!user) throw new Error("No account found with that email address.");
        if (!user.isActive) throw new Error("Your account has been deactivated.");

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) throw new Error("Incorrect password.");

        const role = await Role.findOne({ _id: user.role }).lean<{
          _id: string;
          roleName: string;
        }>();

        return {
          id: user._id,
          userId: user._id,
          email: user.email,
          name: user.name,
          roleName: role?.roleName ?? "",
          roleId: user.role,
          profileType: user.profileType as ProfileType,
          profileRef: user.profileRef ?? null,
        };
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as { userId: string }).userId ?? user.id;
        token.roleName = (user as { roleName: string }).roleName;
        token.roleId = (user as { roleId: string }).roleId;
        token.profileType = (user as { profileType: ProfileType }).profileType;
        token.profileRef = (user as { profileRef: string | null }).profileRef;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.userId = token.userId as string;
        session.user.roleName = token.roleName as string;
        session.user.roleId = token.roleId as string;
        session.user.profileType = token.profileType as ProfileType;
        session.user.profileRef = token.profileRef as string | null;
      }
      return session;
    },
  },

  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});
