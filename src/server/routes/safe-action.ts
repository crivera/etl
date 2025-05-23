import { env } from '@/env'
import { SYSTEM_ROBOT } from '@/lib/consts'
import { createSafeActionClient } from 'next-safe-action'
import { zodAdapter } from 'next-safe-action/adapters/zod'
import { headers } from 'next/headers'
import userStore from '../db/user-store'
import { createClient } from '../supabase/server'

export class ActionError extends Error {
  status: number

  constructor(message: string, status: number = 500) {
    super(message)
    this.name = 'ActionError'
    this.status = status
  }

  static Forbidden(message: string = 'Forbidden') {
    return new ActionError(message, 403)
  }

  static NotFound(message: string = 'Not Found') {
    return new ActionError(message, 404)
  }

  static BadRequest(message: string = 'Bad Request') {
    return new ActionError(message, 400)
  }

  static InternalServerError(message: string = 'Internal Server Error') {
    return new ActionError(message, 500)
  }
}

export const client = createSafeActionClient({
  validationAdapter: zodAdapter(),
  // You can provide a custom handler for server errors, otherwise the lib will use `console.error`
  // as the default logging mechanism and will return the DEFAULT_SERVER_ERROR_MESSAGE for all server errors.
  handleServerError: (e) => {
    console.error('Action server error occurred:', e.message, e.cause, e.stack)

    // If the error is an instance of `ActionError`, unmask the message.
    if (e instanceof ActionError) {
      return {
        message: e.message,
        status: e.status,
      }
    }

    // Otherwise return default error message.
    return {
      message: e.message,
      status: 500,
    }
  },
})

export const authClient = client.use(async ({ next }) => {
  const supabase = await createClient()

  const h = await headers()
  const authorization = h.get('authorization')
  if (authorization === `Bearer ${env.SYSTEM_KEY}`) {
    return next({
      ctx: {
        dbUser: SYSTEM_ROBOT,
        supabase,
      },
    })
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    throw ActionError.Forbidden('Session not found!')
  }

  const dbUser = await userStore.getUserByExternalId(user.id)

  if (!dbUser) {
    throw ActionError.NotFound('User not found.')
  }

  return next({
    ctx: {
      dbUser,
      supabase,
    },
  })
})

export const systemClient = client.use(async ({ next }) => {
  const h = await headers()
  const authorization = h.get('authorization')
  if (authorization !== `Bearer ${env.SYSTEM_KEY}`) {
    throw ActionError.Forbidden()
  }

  const supabase = await createClient()

  return next({
    ctx: {
      dbUser: SYSTEM_ROBOT,
      supabase,
    },
  })
})
