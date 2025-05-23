'use client'

import { TooltipProvider } from '@/app/components/ui/tooltip'
import { ThemeProvider } from '@/providers/theme-provider'
import type { ThemeProviderProps } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider {...props}>
      <TooltipProvider delayDuration={320}>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  )
}
