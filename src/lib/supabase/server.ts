/**
 * Supabase Client for Server Components and Route Handlers
 *
 * Use this in:
 * - Server Components (default in App Router)
 * - API Route Handlers
 * - Server Actions
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for use in Server Components
 *
 * This client:
 * - Runs on the server
 * - Reads cookies to determine auth state
 * - Should be created per request (not cached)
 * - Works in Server Components, API routes, and Server Actions
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createServerClient } from '@/lib/supabase/server'
 *
 * export default async function ServerPage() {
 *   const supabase = await createServerClient()
 *
 *   const { data: { session } } = await supabase.auth.getSession()
 *
 *   if (!session) {
 *     return <div>Please log in</div>
 *   }
 *
 *   const { data: progress } = await supabase
 *     .from('user_progress')
 *     .select('*')
 *     .eq('user_id', session.user.id)
 *     .single()
 *
 *   return <div>Level: {progress?.current_level}</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In an API Route Handler
 * import { createServerClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const supabase = await createServerClient()
 *
 *   const { data: { session } } = await supabase.auth.getSession()
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *
 *   // ... rest of handler
 * }
 * ```
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
