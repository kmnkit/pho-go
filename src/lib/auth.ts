import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import type { Provider } from 'next-auth/providers';

/**
 * Check if Google OAuth credentials are available in environment variables
 * This allows the app to run without OAuth for development/testing
 */
const hasGoogleAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Configure authentication providers based on available credentials
 * Only includes Google OAuth if credentials are present
 */
const providers: Provider[] = hasGoogleAuth
  ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ]
  : [];

/**
 * NextAuth configuration with flexible provider support
 *
 * Features:
 * - Optional Google OAuth (falls back to JWT if not configured)
 * - Database adapter for persistent sessions (when OAuth enabled)
 * - Custom session handling for both database and JWT strategies
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * Only use database adapter if OAuth providers are configured
   * This prevents database connection errors in minimal setup
   */
  adapter: hasGoogleAuth ? DrizzleAdapter(db) : undefined,
  providers,
  callbacks: {
    /**
     * Session callback - ensures user ID is included in session
     * Handles both database sessions (with user object) and JWT sessions (with token)
     */
    async session({ session, user, token }) {
      // Handle both database and JWT sessions
      if (session?.user) {
        if (user) {
          // Database session - user object available
          session.user.id = user.id;
        } else if (token?.sub) {
          // JWT session - extract ID from token
          session.user.id = token.sub;
        }
      }
      return session;
    },
    /**
     * JWT callback - adds user ID to token for JWT sessions
     */
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  /**
   * Use appropriate session strategy based on provider availability
   * - Database strategy: When OAuth is configured (persistent sessions)
   * - JWT strategy: When no OAuth (stateless sessions)
   */
  session: {
    strategy: hasGoogleAuth ? 'database' : 'jwt',
  },
});