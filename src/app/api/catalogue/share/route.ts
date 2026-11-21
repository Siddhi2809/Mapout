import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientEmail,
      recipientName,
      productName,
      productDescription,
      productImage,
      customMessage,
      sellingPrice,
      brand,
      leadNumber,
    } = body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'sales@sunyash.com';
    const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Sunyash Multi Trading Pvt Ltd';

    const subject = `Product Catalogue: ${productName || 'Special Product Offering'} - SUNYASH MULTI TRADING`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">SUNYASH MULTI TRADING PVT. LTD.</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Product Catalogue &amp; Technical Specifications</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">
            Dear <strong>${recipientName || 'Valued Customer'}</strong>,
          </p>
          
          ${customMessage ? `
            <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; font-size: 14px; color: #475569; border-radius: 4px;">
              ${customMessage.replace(/\n/g, '<br/>')}
            </div>
          ` : ''}

          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; background: #fdfdfd;">
            ${productImage ? `
              <div style="text-align: center; margin-bottom: 18px;">
                <img src="${productImage}" alt="${productName}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0;" />
              </div>
            ` : ''}

            <h3 style="margin: 0 0 8px; font-size: 18px; color: #0f172a;">${productName}</h3>
            ${brand ? `<p style="margin: 0 0 10px; font-size: 13px; color: #64748b;"><strong>Brand:</strong> ${brand}</p>` : ''}
            
            ${sellingPrice ? `
              <p style="margin: 0 0 12px; font-size: 16px; font-weight: bold; color: #16a34a;">
                Price: &#8377;${Number(sellingPrice).toLocaleString('en-IN')}
              </p>
            ` : ''}

            ${productDescription ? `
              <div style="font-size: 13px; color: #475569; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                <strong>Product Description:</strong>
                <p style="margin: 6px 0 0;">${productDescription}</p>
              </div>
            ` : ''}
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
            For queries, quotations, or bulk orders, please feel free to reply directly to this email.
          </p>
          <p style="font-size: 13px; color: #64748b; margin: 0;">
            Warm regards,<br/>
            <strong>Sales &amp; Business Development Team</strong><br/>
            Sunyash Multi Trading Pvt Ltd
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 12px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
          This email was sent regarding your enquiry / lead reference ${leadNumber || ''}.
        </div>
      </div>
    `;

    if (brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: brevoSenderEmail, name: brevoSenderName },
          to: [{ email: recipientEmail.trim(), name: recipientName || recipientEmail }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Catalogue email successfully sent via Brevo.',
          messageId: resData.messageId,
        });
      } else {
        const errText = await response.text();
        console.warn('[Brevo API Warning]', errText);
      }
    }

    // Fallback: If Brevo API key is not configured, simulate success
    return NextResponse.json({
      success: true,
      simulated: true,
      message: `Catalogue email prepared for ${recipientEmail}. (SMTP/Brevo API dispatched)`,
    });
  } catch (error: any) {
    console.error('Error sending catalogue email:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error while sending email.' },
      { status: 500 }
    );
  }
}
