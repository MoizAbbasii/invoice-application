import QRCode from 'qrcode';
import { ComputedTotals, InvoiceData } from '../types/invoice';

export interface ZatcaTlvField {
  tag: number;
  label: string;
  value: string;
  byteLength: number;
}

function encodeTlvField(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  // ZATCA Phase 1 uses 1-byte tag and 1-byte length (max 255 bytes per field)
  const clampedLength = Math.min(valueBytes.length, 255);
  const result = new Uint8Array(2 + clampedLength);
  result[0] = tag & 0xff;
  result[1] = clampedLength & 0xff;
  result.set(valueBytes.subarray(0, clampedLength), 2);
  return result;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function buildZatcaTlvFields(
  invoice: InvoiceData,
  totals: ComputedTotals
): ZatcaTlvField[] {
  const encoder = new TextEncoder();
  const rawFields = [
    {
      tag: 1,
      label: 'Seller Name',
      value: invoice.sellerNameArabic.trim() || 'Seller',
    },
    {
      tag: 2,
      label: 'VAT Registration No.',
      value: invoice.sellerVat.trim() || '000000000000000',
    },
    {
      tag: 3,
      label: 'Invoice Timestamp',
      value: invoice.zatcaTimestampIso.trim() || new Date().toISOString(),
    },
    {
      tag: 4,
      label: 'Invoice Total (incl. VAT)',
      value: totals.totalAmountDue.toFixed(2),
    },
    {
      tag: 5,
      label: 'VAT Total',
      value: totals.totalVat.toFixed(2),
    },
  ];

  return rawFields.map((field) => ({
    ...field,
    byteLength: Math.min(encoder.encode(field.value).length, 255),
  }));
}

export function encodeZatcaQrBase64(
  invoice: InvoiceData,
  totals: ComputedTotals
): string {
  const fields = buildZatcaTlvFields(invoice, totals);
  const chunks = fields.map((f) => encodeTlvField(f.tag, f.value));
  const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalBytes);

  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return uint8ArrayToBase64(combined);
}

export function decodeZatcaQrBase64(base64: string): ZatcaTlvField[] {
  const tagLabels: Record<number, string> = {
    1: 'Seller Name',
    2: 'VAT Registration No.',
    3: 'Invoice Timestamp',
    4: 'Invoice Total (incl. VAT)',
    5: 'VAT Total',
  };

  try {
    const bytes = base64ToUint8Array(base64);
    const decoder = new TextDecoder();
    const fields: ZatcaTlvField[] = [];
    let cursor = 0;

    while (cursor + 2 <= bytes.length) {
      const tag = bytes[cursor];
      const len = bytes[cursor + 1];
      cursor += 2;
      const slice = bytes.subarray(cursor, cursor + len);
      cursor += len;
      fields.push({
        tag,
        label: tagLabels[tag] || `Tag ${tag}`,
        value: decoder.decode(slice),
        byteLength: len,
      });
    }
    return fields;
  } catch {
    return [];
  }
}

export function buildQrPayload(
  invoice: InvoiceData,
  totals: ComputedTotals
): string {
  if (invoice.qrMode === 'plain-summary') {
    return [
      `Seller: ${invoice.sellerNameArabic}`,
      `VAT: ${invoice.sellerVat}`,
      `Invoice: ${invoice.invoiceNo.replace(/\s+/g, ' ')}`,
      `Date: ${invoice.invoiceDateDisplay}`,
      `Total: ${totals.totalAmountDue.toFixed(2)} ${invoice.currency}`,
      `VAT Amount: ${totals.totalVat.toFixed(2)} ${invoice.currency}`,
    ].join('\n');
  }
  return encodeZatcaQrBase64(invoice, totals);
}

export async function generateQrSvgString(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });
}

export async function generateQrPngDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
