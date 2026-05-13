import sharp from 'sharp'

/**
 * Compresses an image buffer to a high degree (target size in KBs)
 * without significant visual quality loss.
 */
export async function compressImage(buffer: Buffer, quality = 85): Promise<Buffer> {
  return await sharp(buffer)
    .resize(1200, null, { 
      withoutEnlargement: true,
      fit: 'inside'
    })
    .jpeg({ 
      quality: quality, 
      progressive: true, 
      mozjpeg: true 
    })
    .toBuffer()
}

/**
 * Generates a thumbnail version of the image
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(400, null, { 
      withoutEnlargement: true,
      fit: 'inside'
    })
    .jpeg({ 
      quality: 70, 
      progressive: true, 
      mozjpeg: true 
    })
    .toBuffer()
}
