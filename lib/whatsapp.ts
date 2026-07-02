import {
  WhatsAppMediaResponse,
  WhatsAppErrorResponse,
} from './types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID');
  return id;
}

function getAccessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('Missing WHATSAPP_ACCESS_TOKEN');
  return token;
}

/**
 * Sanitize the customer phone number for WhatsApp API:
 * - Remove spaces, dashes, brackets
 * - If starts with 0, replace with 91
 * - If already has 91 prefix, return as is
 * - Otherwise add 91
 */
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) return '91' + cleaned.slice(1);
  if (cleaned.startsWith('91')) return cleaned;
  return '91' + cleaned;
}

export class WhatsAppTemplateNotApprovedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppTemplateNotApprovedError';
  }
}

/**
 * Upload a PDF to WhatsApp media endpoint.
 * Returns the media_id to use when sending the document.
 */
export async function uploadMediaToWhatsApp(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append(
    'file',
    new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
    filename
  );
  formData.append('type', 'application/pdf');

  const response = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}/media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = (await response.json()) as WhatsAppErrorResponse;
    throw new Error(
      `WhatsApp media upload failed: ${err.error?.message || response.statusText}`
    );
  }

  const data = (await response.json()) as WhatsAppMediaResponse;
  return data.id;
}

/**
 * Send a document message via WhatsApp Cloud API.
 */
export async function sendDocumentMessage(
  to: string,
  mediaId: string,
  filename: string,
  caption: string
): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();
  const formattedPhone = formatWhatsAppNumber(to);

  const response = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'document',
        document: {
          id: mediaId,
          filename,
          caption,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = (await response.json()) as WhatsAppErrorResponse;
    throw new Error(
      `WhatsApp send failed: ${err.error?.message || response.statusText}`
    );
  }
}

/**
 * Send a plain text message via WhatsApp Cloud API.
 */
export async function sendTextMessage(
  to: string,
  bodyText: string
): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();
  const formattedPhone = formatWhatsAppNumber(to);

  const response = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: bodyText,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = (await response.json()) as WhatsAppErrorResponse;
    throw new Error(
      `WhatsApp text send failed: ${err.error?.message || response.statusText}`
    );
  }
}

/**
 * Send a template message via WhatsApp Cloud API for TruBill invoice notifications.
 */
export async function sendInvoiceTemplateMessage(params: {
  customerPhone: string;
  customerName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  balanceDue: number;
  invoiceId: string;
  shopName: string;
}): Promise<string> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();
  const formattedPhone = formatWhatsAppNumber(params.customerPhone);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trubill.in';
  const statusUrl = `${baseUrl}/status/${params.invoiceId}`;

  const response = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'sales_invoice_delivery',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: params.customerName },
                { type: 'text', text: params.invoiceNumber },
                { type: 'text', text: params.shopName },
                { type: 'text', text: params.invoiceAmount.toString() },
                { type: 'text', text: params.balanceDue.toString() },
              ],
            },
          ],
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorCode = data?.error?.code;
    const errorMessage = data?.error?.message;

    if (errorCode === 132000) {
      throw new WhatsAppTemplateNotApprovedError(
        errorMessage || 'Template not found or not approved yet. Submit sales_invoice_delivery template in Meta Business Manager first.'
      );
    }
    if (errorCode === 131030) {
      throw new Error(`Phone number ${formattedPhone} is not a valid WhatsApp number.`);
    }
    if (errorCode === 131047) {
      throw new Error('Message failed — customer may have blocked the business number.');
    }

    throw new Error(`WhatsApp API error ${errorCode}: ${errorMessage}`);
  }

  return data.messages?.[0]?.id || 'unknown_wa_msg_id';
}
