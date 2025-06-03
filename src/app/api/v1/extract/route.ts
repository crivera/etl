import { ExtractDocumentSchema } from '@/lib/consts'
import { extractDocumentData } from '@/server/routes/extracted-data-action'
import { NextResponse } from 'next/server'

/**
 * OCR a document
 * @param req - The request
 * @returns The OCR response
 */
export async function POST(req: Request) {
  try {
    const bodyRaw = await req.json()
    const body = ExtractDocumentSchema.parse(bodyRaw)
    const result = await extractDocumentData(body)
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
