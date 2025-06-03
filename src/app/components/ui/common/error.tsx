'use client'

import { Bug } from 'lucide-react'
import { useEffect, useTransition } from 'react'

import { useRouter } from 'nextjs-toploader/app'

import { Button } from '../button'

export default function GenericError({
  error,
}: {
  error?: {
    message: string
    status: number
  }
}) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Bug
            className="h-24 w-24 animate-bounce text-red-900"
            aria-hidden="true"
          />
          <h1 className="text-center text-2xl font-semibold">
            Oops! Looks like we&apos;ve hit a snag
          </h1>
        </div>
        <div className="rounded-md bg-muted p-4">
          <p className="break-words text-sm text-muted-foreground">
            {error?.message ||
              "Don't worry, it's not you - it's us! We're on it."}
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            asChild
            variant="default"
            className="mt-4 font-semibold"
            onClick={() => startTransition(() => router.refresh())}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
