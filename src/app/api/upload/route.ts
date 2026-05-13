import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { compressImage } from '@/lib/image-processing'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'news'
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json({ error: 'Missing file or filename' }, { status: 400 })
    }

    // Convert File to Buffer for sharp
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Get optional quality from formData
    const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : 85

    // Compress image
    let finalBuffer: any = buffer
    try {
      finalBuffer = await compressImage(buffer, quality)
    } catch (compressError) {
      console.error('Compression failed, using original buffer:', compressError)
      // Fallback to original buffer if sharp fails (e.g. missing binaries)
    }

    // Sanitize filename and prepare key
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `images/${folder}/${safe}`

    console.log('Attempting upload to R2:', {
      key,
      folder,
      bucket: process.env.R2_BUCKET,
      accountId: process.env.R2_ACCOUNT_ID ? 'Set' : 'MISSING',
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY
    })

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('Missing R2 credentials in environment')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
          Body: finalBuffer,
          ContentType: 'image/jpeg',
        })
      )
      console.log('Upload successful:', key)
    } catch (s3Error: any) {
      console.error('S3/R2 Upload specific error:', {
        message: s3Error.message,
        code: s3Error.code,
        requestId: s3Error.$metadata?.requestId
      })
      throw s3Error
    }
 
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_URL}/${key}`
 
    return NextResponse.json({
      success: true,
      publicUrl,
      key,
      size: finalBuffer.length,
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed', details: err.message }, { status: 500 })
  }
}
