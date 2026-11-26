import { createClient } from './client';

type CatalogTable = 'apartments' | 'cars' | 'airport_services' | 'extras';
const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
} as const;

export const catalogImageAccept = Object.keys(imageTypes).join(',');

export function catalogError(error: unknown) {
  if (typeof error === 'string' && error) return error;
  if (typeof error === 'object' && error !== null && 'message' in error &&
      typeof error.message === 'string' && error.message) return error.message;
  return 'تعذّر إكمال العملية. حاول مرة تانية.';
}

export function newCatalogId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

export async function uploadCatalogImages(
  folder: 'cars' | 'apartments', files: FileList, available: number, addImage: (url: string) => void
) {
  const bucket = createClient().storage.from('images');
  const errors: string[] = [];
  for (const file of files) {
    if (available <= 0) {
      errors.push('وصلت للحد الأقصى للصور.');
      break;
    }

    const extension = imageTypes[file.type as keyof typeof imageTypes];
    if (typeof extension !== 'string') {
      errors.push('اختار صورة بصيغة JPEG أو PNG أو WebP أو GIF أو AVIF.');
      continue;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      errors.push('حجم كل صورة لازم يكون أكبر من صفر وبحد أقصى 5 ميجا.');
      continue;
    }

    const path = `${folder}/${newCatalogId()}.${extension}`;
    const { error } = await bucket.upload(path, file, { cacheControl: '31536000', contentType: file.type });
    if (error) {
      errors.push('فشل رفع الصورة: ' + catalogError(error));
      continue;
    }
    addImage(bucket.getPublicUrl(path).data.publicUrl);
    available -= 1;
  }
  return [...new Set(errors)].join(' ');
}

export function isCatalogMoney(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 9999999999.99;
}

export async function saveCatalogRecord(
  table: CatalogTable,
  id: string,
  editing: boolean,
  payload: Record<string, string | number | boolean | string[] | null>,
  cost: number | null
) {
  const { error } = await createClient().rpc('save_catalog_item', {
    p_table: table, p_id: id, p_editing: editing, p_values: payload, p_cost: cost,
  });
  return error ? catalogError(error) : '';
}
