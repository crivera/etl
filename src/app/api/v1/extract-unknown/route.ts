import { ExtractUnknownDocumentSchema } from '@/lib/consts'
import { extractUnknownDocumentData } from '@/server/routes/extracted-data-action'
import { NextResponse } from 'next/server'

/**
 * Extract unknown document data (for first document in collection)
 * @param req - The request
 * @returns The extraction response
 */
export async function POST(req: Request) {
  try {
    const bodyRaw = await req.json()
    const body = ExtractUnknownDocumentSchema.parse(bodyRaw)
    const result = await extractUnknownDocumentData(body)
    
    if (result?.serverError || !result?.data) {
      return NextResponse.json(
        {
          success: false,
          error: result?.serverError?.message || 'Unknown error',
        },
        {
          status: result?.serverError?.status || 500,
        },
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    )
  }
}