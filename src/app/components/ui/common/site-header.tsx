'use client'

import { links } from '@/app/sitemap'
import { env } from '@/env'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { FileText, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '../avatar'
import { Button } from '../button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'

export function SiteHeader() {
  const supabase = createClient()
  const auth = useAuth()

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center max-h-16">
      <Link className="flex items-center justify-center" href="#">
        <FileText className="h-6 w-6 text-primary mr-2" />
        <span className="ml-2 text-2xl font-bold text-gray-900">Website</span>
      </Link>
      <div className="ml-auto">
        {auth.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer size-10">
                <AvatarImage
                  src={auth.user.user_metadata.picture ?? undefined}
                  className="border-2 border-slate-400 rounded-full"
                />
                <AvatarFallback>
                  {getInitials(auth.user.user_metadata.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {links.map((link) => (
                <DropdownMenuItem asChild key={link.href}>
                  <Link href={link.href}>
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={async () =>
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`,
                },
              })
            }
          >
            Log in
          </Button>
        )}
      </div>
    </header>
  )
}
