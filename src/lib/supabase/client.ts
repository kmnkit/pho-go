/**
 * Supabase Client for Client Components
 *
 * Use this in client-side React components (use client directive)
 * Handles authentication state automatically with cookies
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for use in Client Components
 *
 * This client:
 * - Runs in the browser
 * - Has access to cookies for auth state
 * - Updates automatically when auth state changes
 * - Should be created per component (not singleton)
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export default function MyComponent() {
 *   const supabase = createClient()
 *
 *   const handleSignIn = async () => {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email: 'user@example.com',
 *       password: 'password',
 *     })
 *   }
 *
 *   return <button onClick={handleSignIn}>Sign In</button>
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
