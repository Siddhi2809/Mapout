import { NextRequest, NextResponse } from 'next/server';
import { uploadPdfToImageKit } from '@/lib/imagekit';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, customer } = body;

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Missing quotation data.' },
        { status: 400 }
      );
    }

    // Dynamic import of pdfGenerator
    const { generateQuotationPdf } = await import('@/lib/pdfGenerator');

    const docRef = data.quotationNumber || `QT-${Date.now()}`;
    const filename = `Quotation_${docRef}.pdf`;

    console.log(`[Upload-PDF] Generating PDF for Quotation ${docRef}...`);
    const pdfBuffer = generateQuotationPdf(data, customer);

    // 1. Upload to ImageKit
    let hostedPdfUrl: string | undefined = undefined;
    const imagekitUpload = await uploadPdfToImageKit({
      fileBuffer: pdfBuffer,
      fileName: filename,
      folder: '/quotations',
      tags: ['quotation', docRef, 'whatsapp-share'],
    });

    if (imagekitUpload.success && imagekitUpload.url) {
      hostedPdfUrl = imagekitUpload.url;
    } else {
      // Fallback: Save to public/uploads/quotations/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotations');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      const host = req.headers.get('host') || 'localhost:3000';
      const proto = req.headers.get('x-forwarded-proto') || 'http';
      hostedPdfUrl = `${proto}://${host}/uploads/quotations/${filename}`;
    }

    // Public web viewer URL
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const previewUrl = `${proto}://${host}/sales/quotations?quoteNumber=${encodeURIComponent(docRef)}`;

    return NextResponse.json({
      success: true,
      pdfUrl: hostedPdfUrl,
      previewUrl,
      fileName: filename,
      message: 'Quotation PDF generated and hosted successfully.',
    });
  } catch (error: any) {
    console.error('Error generating and hosting quotation PDF:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to generate quotation PDF.' },
      { status: 500 }
    );
  }
}
