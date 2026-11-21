let imagekitInstance: any = null;

function sanitizeEnvVal(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function getImageKit(): any {
  const publicKey = sanitizeEnvVal(process.env.IMAGEKIT_PUBLIC_KEY);
  const privateKey = sanitizeEnvVal(process.env.IMAGEKIT_PRIVATE_KEY);
  const urlEndpoint = sanitizeEnvVal(process.env.IMAGEKIT_URL_ENDPOINT);

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null;
  }

  if (!imagekitInstance) {
    try {
      const ImageKit = require('imagekit');
      imagekitInstance = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    } catch (e) {
      console.error('[ImageKit] Initialization error:', e);
      return null;
    }
  }

  return imagekitInstance;
}

/**
 * Upload any file buffer (PDF, Image, Document) to ImageKit
 * Returns the public CDN URL and file details.
 */
export async function uploadFileToImageKit(params: {
  fileBuffer: Buffer;
  fileName: string;
  folder?: string;
  tags?: string[];
}): Promise<{ success: boolean; url?: string; fileId?: string; message?: string }> {
  try {
    const ik = getImageKit();
    if (!ik) {
      return {
        success: false,
        message: 'ImageKit credentials not configured in .env',
      };
    }

    const base64File = params.fileBuffer.toString('base64');
    const folder = params.folder || '/uploads';

    const response = await ik.upload({
      file: base64File,
      fileName: params.fileName,
      folder: folder,
      tags: params.tags || ['erp', 'upload'],
      useUniqueFileName: true,
    });

    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error: any) {
    console.error('[ImageKit] Upload failed:', error?.message || error);
    return {
      success: false,
      message: error?.message || 'ImageKit upload failed',
    };
  }
}

/**
 * Upload a PDF buffer to ImageKit under the /quotations or /invoices folder
 * Alias to uploadFileToImageKit for backwards compatibility.
 */
export async function uploadPdfToImageKit(params: {
  fileBuffer: Buffer;
  fileName: string;
  folder?: string;
  tags?: string[];
}): Promise<{ success: boolean; url?: string; fileId?: string; message?: string }> {
  return uploadFileToImageKit(params);
}
