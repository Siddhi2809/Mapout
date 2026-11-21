import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { uploadFileToImageKit } from '@/lib/imagekit';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file uploaded.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Only image files (JPEG, PNG, WEBP, GIF) are allowed.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || '.jpg';
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `prod_${Date.now()}_${safeBaseName}${ext}`;

    // 1. First attempt: Upload directly to ImageKit CDN
    const imagekitResult = await uploadFileToImageKit({
      fileBuffer: buffer,
      fileName,
      folder: '/products',
      tags: ['product-master', 'catalogue'],
    });

    if (imagekitResult.success && imagekitResult.url) {
      return NextResponse.json({
        success: true,
        imageUrl: imagekitResult.url,
        provider: 'imagekit',
        message: 'Product image uploaded to ImageKit CDN successfully.',
      });
    }

    // 2. Fallback: Save directly to public/uploads/products/ if ImageKit fails or is offline
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/products/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl: relativeUrl,
      provider: 'local',
      message: 'Product image stored locally on server.',
    });
  } catch (error: any) {
    console.error('Error in /api/products/upload-image:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload product image.' },
      { status: 500 }
    );
  }
}
