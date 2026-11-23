export interface LineItem {
  id: string;
  srNo: number;
  name: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  manualVatAmount?: number;
  manualAmount?: number;
}

export type CalculationMode = 'auto' | 'manual-replica';
export type QrMode = 'zatca-tlv' | 'plain-summary';

export interface InvoiceData {
  // Header strip
  headerVatNumber: string;
  titleEnglish: string;
  titleArabic: string;

  // Seller info
  sellerNameArabic: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;
  sellerVat: string;
  sellerCrNo: string;
  customLogoDataUrl?: string;

  // Buyer / Bill To
  billToLabelEn: string;
  buyerNameArabic: string;
  billToLabelAr: string;
  buyerNameEnglish: string;
  buyerVat: string;

  // Invoice Metadata
  invoiceNo: string;
  invoiceDateDisplay: string;
  zatcaTimestampIso: string;

  // Line items & calculation mode
  calculationMode: CalculationMode;
  currency: string;
  items: LineItem[];

  // Manual summary overrides (used in manual-replica mode)
  manualTotalExcludingVat: number;
  manualDiscountTotal: number;
  manualTotalTaxable: number;
  manualTotalVat: number;
  manualTotalAmountDue: number;

  // Signature & QR
  signatureArabic: string;
  signatureEnglish: string;
  signatureImageDataUrl?: string;
  qrMode: QrMode;
}

export const EXACT_REPLICA_INVOICE: InvoiceData = {
  headerVatNumber: '310880578500003',
  titleEnglish: 'Tax Invoice',
  titleArabic: 'فاتورة ضريبية',

  sellerNameArabic: 'مؤسسة فاطمة ابراهيم اسماعيل شبير',
  sellerPhone: '0539413957',
  sellerEmail: 'fatima1496sa@yahoo.com',
  sellerAddress: 'Khumra Qarnia Street Khamis Mushait,Aseer, Saudi Arabia, 62455',
  sellerVat: '310660947300023',
  sellerCrNo: '4030411804',

  billToLabelEn: 'Bill To',
  buyerNameArabic: 'شركة النجوم الكم للاتصالات',
  billToLabelAr: 'عميل',
  buyerNameEnglish: 'Al-Nujoom Al-kam\nTelecommunication Company',
  buyerVat: '310880578500003',

  invoiceNo: 'V561',
  invoiceDateDisplay: '17/09/2026',
  zatcaTimestampIso: '2026-09-17T10:30:00Z',

  calculationMode: 'manual-replica',
  currency: 'SAR',
  items: [
    {
      id: 'item-1',
      srNo: 1,
      name: 'مبرد زيت ناقل الحركة',
      quantity: 1,
      rate: 695.65,
      discount: 0,
      taxRate: 15.0,
      manualVatAmount: 0,
      manualAmount: 665.35,
    },
  ],

  manualTotalExcludingVat: 800.0,
  manualDiscountTotal: 0.0,
  manualTotalTaxable: 695.65,
  manualTotalVat: 104.35,
  manualTotalAmountDue: 800.0,

  signatureArabic: 'التوقيع',
  signatureEnglish: 'SIGNATURE',
  qrMode: 'zatca-tlv',
};

export const RAW_PDF_TEXT_REPLICA: InvoiceData = {
  ...EXACT_REPLICA_INVOICE,
  invoiceNo: 'siljulzincuttwed\noosoraموسسم\nسشوكfilt fشر\nكةشنكمسممIN\nV561',
  invoiceDateDisplay: '171/09/2026',
};

export const AUTO_CALCULATED_INVOICE: InvoiceData = {
  ...EXACT_REPLICA_INVOICE,
  invoiceNo: 'INV-2026-V561',
  invoiceDateDisplay: '17/09/2026',
  calculationMode: 'auto',
};

export interface SavedInvoiceRecord {
  id: string;
  savedAt: string;
  totalAmount: number;
  data: InvoiceData;
}

export function formatTodayDisplay(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function createBlankInvoice(keepSellerFrom?: InvoiceData): InvoiceData {
  const now = new Date();
  const randomSuffix = String(Math.floor(100 + Math.random() * 900));
  return {
    headerVatNumber: keepSellerFrom?.headerVatNumber ?? '',
    titleEnglish: 'Tax Invoice',
    titleArabic: 'فاتورة ضريبية',

    sellerNameArabic: keepSellerFrom?.sellerNameArabic ?? '',
    sellerPhone: keepSellerFrom?.sellerPhone ?? '',
    sellerEmail: keepSellerFrom?.sellerEmail ?? '',
    sellerAddress: keepSellerFrom?.sellerAddress ?? '',
    sellerVat: keepSellerFrom?.sellerVat ?? '',
    sellerCrNo: keepSellerFrom?.sellerCrNo ?? '',
    customLogoDataUrl: keepSellerFrom?.customLogoDataUrl,

    billToLabelEn: 'Bill To',
    buyerNameArabic: '',
    billToLabelAr: 'عميل',
    buyerNameEnglish: '',
    buyerVat: '',

    invoiceNo: `INV-${now.getFullYear()}-${randomSuffix}`,
    invoiceDateDisplay: formatTodayDisplay(),
    zatcaTimestampIso: now.toISOString(),

    calculationMode: 'auto',
    currency: keepSellerFrom?.currency ?? 'SAR',
    items: [
      {
        id: `item-${Date.now()}`,
        srNo: 1,
        name: '',
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 15.0,
      },
    ],

    manualTotalExcludingVat: 0,
    manualDiscountTotal: 0,
    manualTotalTaxable: 0,
    manualTotalVat: 0,
    manualTotalAmountDue: 0,

    signatureArabic: 'التوقيع',
    signatureEnglish: 'SIGNATURE',
    signatureImageDataUrl: keepSellerFrom?.signatureImageDataUrl,
    qrMode: 'zatca-tlv',
  };
}

export interface ComputedTotals {
  totalExcludingVat: number;
  discountTotal: number;
  totalTaxable: number;
  totalVat: number;
  totalAmountDue: number;
  lineResults: Array<{
    id: string;
    taxable: number;
    vatAmount: number;
    lineTotal: number;
  }>;
}

export function computeInvoiceTotals(invoice: InvoiceData): ComputedTotals {
  if (invoice.calculationMode === 'manual-replica') {
    return {
      totalExcludingVat: invoice.manualTotalExcludingVat,
      discountTotal: invoice.manualDiscountTotal,
      totalTaxable: invoice.manualTotalTaxable,
      totalVat: invoice.manualTotalVat,
      totalAmountDue: invoice.manualTotalAmountDue,
      lineResults: invoice.items.map((item) => ({
        id: item.id,
        taxable: Math.max(0, item.quantity * item.rate - item.discount),
        vatAmount: item.manualVatAmount ?? 0,
        lineTotal: item.manualAmount ?? Math.max(0, item.quantity * item.rate - item.discount),
      })),
    };
  }

  let totalExcludingVat = 0;
  let discountTotal = 0;
  let totalTaxable = 0;
  let totalVat = 0;

  const lineResults = invoice.items.map((item) => {
    const gross = item.quantity * item.rate;
    const discount = Math.max(0, item.discount);
    const taxable = Math.max(0, gross - discount);
    const vatAmount = taxable * (item.taxRate / 100);
    const lineTotal = taxable + vatAmount;

    totalExcludingVat += gross;
    discountTotal += discount;
    totalTaxable += taxable;
    totalVat += vatAmount;

    return {
      id: item.id,
      taxable,
      vatAmount,
      lineTotal,
    };
  });

  return {
    totalExcludingVat,
    discountTotal,
    totalTaxable,
    totalVat,
    totalAmountDue: totalTaxable + totalVat,
    lineResults,
  };
}
