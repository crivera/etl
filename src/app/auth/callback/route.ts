import { NextResponse } from 'next/server'
import { createClient } from '@/server/supabase/server'
import userStore from '@/server/db/user-store'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      try {
        const user = await supabase.auth.getUser()
        if (!user.data.user) {
          throw new Error('User not found')
        }
        const existingUser = await userStore.getUserByExternalId(
          user.data.user.id,
        )

        if (!existingUser) {
          await userStore.createUser({
            externalId: user.data.user.id,
          })
        }
      } catch (e) {
        console.error(e)
      }
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
