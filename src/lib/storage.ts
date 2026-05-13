import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadImage(file: Buffer, path: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `images/${path}`,
    Body: file,
    ContentType: contentType,
  })

  await r2.send(command)
  return `${process.env.R2_PUBLIC_URL}/images/${path}`
}

export async function deleteImage(path: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `images/${path}`,
  })

  await r2.send(command)
}

export async function getPresignedUploadUrl(path: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `images/${path}`,
    ContentType: contentType,
  })

  return await getSignedUrl(r2, command, { expiresIn: 3600 })
}
