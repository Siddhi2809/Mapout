export interface SendBrevoEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachmentName: string;
  attachmentBuffer: Buffer;
  pdfUrl?: string;
  extraAttachments?: Array<{
    name: string;
    content: string; // base64
  }>;
}

/**
 * Sends a transactional email using Brevo (formerly Sendinblue).
 * Uses direct fetch to Brevo REST API (https://api.brevo.com/v3/smtp/email)
 * to avoid heavy bundling overhead and ensure instant execution.
 */
export async function sendEmailViaBrevo(params: SendBrevoEmailParams): Promise<{ success: boolean; message: string; messageId?: string; simulated?: boolean }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'sales@crm.com';
  const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Sunyash Multi Trading Pvt Ltd';

  // Option 1: Official Brevo REST API (direct HTTPS fetch without heavy SDK bundling)
  if (brevoApiKey) {
    try {
      const attachmentsList: Array<{ name: string; content: string }> = [
        {
          name: params.attachmentName,
          content: params.attachmentBuffer.toString('base64'),
        },
      ];

      if (params.extraAttachments && Array.isArray(params.extraAttachments)) {
        params.extraAttachments.forEach((att) => {
          if (att.name && att.content) {
            attachmentsList.push({
              name: att.name,
              content: att.content,
            });
          }
        });
      }

      const emailPayload = {
        sender: {
          email: brevoSenderEmail,
          name: brevoSenderName,
        },
        to: [
          {
            email: params.toEmail.trim(),
            name: params.toName || params.toEmail.trim(),
          },
        ],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent || params.htmlContent.replace(/<[^>]+>/g, ''),
        attachment: attachmentsList,
      };

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Brevo HTTP status ${res.status}`);
      }

      const msgId = data?.messageId || 'brevo-sent';

      return {
        success: true,
        message: `Email with PDF attachment successfully sent via Brevo to ${params.toEmail}!`,
        messageId: msgId,
      };
    } catch (apiError: any) {
      console.error('[Brevo API] Failed with error:', apiError?.message || apiError);
      return {
        success: false,
        message: `Brevo error: ${apiError?.message || 'Failed to dispatch email.'}`,
      };
    }
  }

  // Option 2: Simulation / Test Mode when API Key is not yet configured in .env
  console.log(`[Brevo Email Simulation] Prepared email for ${params.toEmail}`);
  console.log(`[Brevo Email Simulation] Attachment: ${params.attachmentName} (${params.attachmentBuffer.length} bytes)`);
  if (params.pdfUrl) {
    console.log(`[Brevo Email Simulation] Hosted PDF URL on ImageKit: ${params.pdfUrl}`);
  }

  return {
    success: true,
    message: `Email prepared with PDF! (Add BREVO_API_KEY in .env for live dispatch to ${params.toEmail})`,
    simulated: true,
  };
}
