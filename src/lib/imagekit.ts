let imagekitInstance: any = null;

function getImageKit(): any {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null;
  }

  if (!imagekitInstance) {
    const ImageKit = require('imagekit');
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return imagekitInstance;
}

/**
 * Upload a PDF buffer to ImageKit under the /quotations or /invoices folder
 * Returns the public CDN URL and file details.
 */
export async function uploadPdfToImageKit(params: {
  fileBuffer: Buffer;
  fileName: string;
  folder?: string;
  tags?: string[];
}): Promise<{ success: boolean; url?: string; fileId?: string; message?: string }> {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      // Return immediately without attempting network connection
      return {
        success: false,
        message: 'ImageKit credentials not configured in .env',
      };
    }

    const ik = getImageKit();
    if (!ik) {
      return {
        success: false,
        message: 'ImageKit credentials not configured in .env',
      };
    }

    const base64File = params.fileBuffer.toString('base64');
    const folder = params.folder || '/documents';

    const response = await ik.upload({
      file: base64File,
      fileName: params.fileName,
      folder: folder,
      tags: params.tags || ['erp', 'document'],
      useUniqueFileName: false,
    });

    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error: any) {
    console.error('[ImageKit] Upload failed:', error);
    return {
      success: false,
      message: error.message || 'ImageKit upload failed',
    };
  }
}
