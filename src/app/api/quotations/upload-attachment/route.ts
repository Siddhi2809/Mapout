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
        { success: false, message: 'No file uploaded.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || '';
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `att_${Date.now()}_${safeBaseName}${ext}`;

    // 1. Try uploading to ImageKit
    const ikResult = await uploadFileToImageKit({
      fileBuffer: buffer,
      fileName,
      folder: '/quotations/attachments',
      tags: ['quotation', 'attachment'],
    });

    let publicUrl = ikResult.success ? ikResult.url : undefined;

    // 2. Fallback to local file storage if ImageKit unavailable
    if (!publicUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotations');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, fileName);
      fs.writeFileSync(localFilePath, buffer);
      publicUrl = `/uploads/quotations/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: publicUrl,
      base64: buffer.toString('base64'),
      message: 'Attachment uploaded successfully.',
    });
  } catch (error: any) {
    console.error('Error in /api/quotations/upload-attachment:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload attachment.' },
      { status: 500 }
    );
  }
}
