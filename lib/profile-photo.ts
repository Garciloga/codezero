import sharp from "sharp";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_BUCKET = "profile-photos";
export async function normalizeProfilePhoto(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES || !["image/jpeg","image/png","image/webp"].includes(mime)) throw new Error("INVALID_PHOTO");
  const image=sharp(bytes,{limitInputPixels:16000000,animated:false,failOn:"warning"});
  const metadata=await image.metadata();
  if (!metadata.format || !["jpeg","png","webp"].includes(metadata.format) || (metadata.pages ?? 1)>1) throw new Error("INVALID_PHOTO");
  return image.rotate().resize(512,512,{fit:"cover",withoutEnlargement:true}).webp({quality:82}).toBuffer();
}
