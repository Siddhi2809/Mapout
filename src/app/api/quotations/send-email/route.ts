import { NextRequest, NextResponse } from 'next/server';
import { uploadPdfToImageKit } from '@/lib/imagekit';
import { sendEmailViaBrevo } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // 'quotation' | 'invoice'
      data, // quotation or invoice object
      customer, // customer object
      recipientEmail,
      recipientName,
      customMessage,
      extraAttachments, // Array<{ name: string; content: string; url?: string }>
    } = body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient email address is required.' },
        { status: 400 }
      );
    }

    if (!data || !type) {
      return NextResponse.json(
        { success: false, message: 'Missing document type or payload data.' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent Turbopack from pre-bundling jsPDF at startup
    const { generateQuotationPdf, generateInvoicePdf } = await import('@/lib/pdfGenerator');

    // 1. Generate the exact official PDF Buffer
    let pdfBuffer: Buffer;
    let filename: string;
    let subject: string;
    let docRef: string;
    let folder: string;

    if (type === 'quotation') {
      docRef = data.quotationNumber || 'QUOTATION';
      filename = `Quotation_${docRef}.pdf`;
      subject = `Quotation Ref: ${docRef} - SUNYASH MULTI TRADING PVT LTD`;
      folder = '/quotations';
      console.log(`[Send-Email] 1. Generating PDF for quotation ${docRef}...`);
      pdfBuffer = generateQuotationPdf(data, customer);
    } else {
      docRef = data.invoiceNumber || 'INVOICE';
      filename = `Tax_Invoice_${docRef}.pdf`;
      subject = `Tax Invoice: ${docRef} - SUNYASH MULTI TRADING PVT LTD`;
      folder = '/invoices';
      console.log(`[Send-Email] 1. Generating PDF for invoice ${docRef}...`);
      pdfBuffer = generateInvoicePdf(data, customer);
    }
    console.log(`[Send-Email] PDF generated (${pdfBuffer.length} bytes).`);

    // 2. Store PDF in ImageKit (if configured)
    let hostedPdfUrl: string | undefined = undefined;
    if (process.env.IMAGEKIT_PRIVATE_KEY) {
      console.log(`[Send-Email] 2. Uploading PDF to ImageKit...`);
      const imagekitUpload = await uploadPdfToImageKit({
        fileBuffer: pdfBuffer,
        fileName: filename,
        folder: folder,
        tags: [type, docRef, 'sunyash-erp'],
      });
      hostedPdfUrl = imagekitUpload.success ? imagekitUpload.url : undefined;
      console.log(`[Send-Email] ImageKit uploaded: ${hostedPdfUrl || 'skipped/failed'}`);
    } else {
      console.log(`[Send-Email] ImageKit not configured in .env, attaching PDF directly.`);
    }

    // 3. Prepare Email Body (HTML & Plain Text)
    const displayName = recipientName || customer?.contactPerson || customer?.name || 'Valued Customer';
    const emailText =
      customMessage ||
      `Dear ${displayName},\n\nPlease find attached the official ${
        type === 'quotation' ? 'Quotation' : 'Tax Invoice'
      } (${docRef}) from Sunyash Multi Trading Pvt Ltd.\n\nThank you for choosing us!\n\nBest Regards,\nSunyash Multi Trading Pvt Ltd\nPhone: +91 9503009988`;

    const viewOnlineButtonHtml = hostedPdfUrl
      ? `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${hostedPdfUrl}" target="_blank" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            📄 View / Download PDF on Cloud (ImageKit)
          </a>
        </div>
      `
      : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">SUNYASH MULTI TRADING PVT LTD</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Official ${
            type === 'quotation' ? 'Quotation' : 'Tax Invoice'
          } Document</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="margin-top: 0; font-size: 15px;">Dear <strong>${displayName}</strong>,</p>
          <div style="white-space: pre-wrap; font-size: 14px; color: #334155; margin: 16px 0; background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #0f172a;">
${emailText}
          </div>

          ${viewOnlineButtonHtml}

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: bold;">
              📎 Attachment: <span>${filename}</span>
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #3b82f6;">
              The exact official document in PDF format has been attached to this email. You can directly view, save, or forward it.
            </p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If you have any questions or require revisions, reply to this email or call us at <strong>+91 9503009988</strong>.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
          Sunyash Multi Trading Pvt Ltd | GSTIN: 27AATCS9988C1Z4 | Pune, Maharashtra, India
        </div>
      </div>
    `;

    // Format any extra user attachments
    const preparedExtraAttachments: Array<{ name: string; content: string }> = [];
    if (extraAttachments && Array.isArray(extraAttachments)) {
      extraAttachments.forEach((att) => {
        if (att.name && att.content) {
          preparedExtraAttachments.push({
            name: att.name,
            content: att.content,
          });
        }
      });
    }

    // 4. Send Email via Brevo
    const sendResult = await sendEmailViaBrevo({
      toEmail: recipientEmail,
      toName: displayName,
      subject: subject,
      htmlContent: emailHtml,
      textContent: emailText,
      attachmentName: filename,
      attachmentBuffer: pdfBuffer,
      pdfUrl: hostedPdfUrl,
      extraAttachments: preparedExtraAttachments,
    });

    return NextResponse.json({
      success: sendResult.success,
      message: sendResult.message,
      messageId: sendResult.messageId,
      pdfUrl: hostedPdfUrl,
      simulated: sendResult.simulated,
    });
  } catch (error: any) {
    console.error('Error sending document email via Brevo:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send email via Brevo.' },
      { status: 500 }
    );
  }
}
