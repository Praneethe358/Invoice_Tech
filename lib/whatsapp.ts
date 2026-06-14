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
        to: `91${to}`,
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
