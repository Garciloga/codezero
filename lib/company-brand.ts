import sharp from 'sharp';
import {MAX_PHOTO_BYTES} from './profile-photo.ts';
/** Decode and re-encode actual raster bytes; logos retain their aspect ratio. */
export async function normalizeCompanyBrand(bytes:Uint8Array,mime:string,kind:'logo'|'cover'){
 if(!bytes.length||bytes.length>MAX_PHOTO_BYTES||!['image/jpeg','image/png','image/webp'].includes(mime))throw Error('INVALID_IMAGE');
 const image=sharp(bytes,{limitInputPixels:16000000,animated:false,failOn:'warning'});
 const metadata=await image.metadata();
 if(!metadata.format||!['jpeg','png','webp'].includes(metadata.format)||(metadata.pages??1)>1)throw Error('INVALID_IMAGE');
 return image.rotate().resize(kind==='logo'?{width:512,height:512,fit:'inside',withoutEnlargement:true}:{width:1440,height:480,fit:'cover',withoutEnlargement:true}).webp({quality:82}).toBuffer();
}
