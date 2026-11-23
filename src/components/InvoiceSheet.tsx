import React from 'react';
import { ComputedTotals, InvoiceData } from '../types/invoice';
import { BimAutoLogo } from './BimAutoLogo';

interface InvoiceSheetProps {
  invoice: InvoiceData;
  totals: ComputedTotals;
  qrDataUrl: string;
  forExport?: boolean;
}

function formatMoney(value: number, currency: string, forceZeroPad = true): string {
  if (!forceZeroPad && value === 0) {
    return `0 ${currency}`;
  }
  const fixed = value.toFixed(2);
  if (forceZeroPad && value === 0) {
    return `00.00 ${currency}`;
  }
  return `${fixed} ${currency}`;
}

function formatLineNumber(value: number, currency: string, isManualReplica: boolean): string {
  if (isManualReplica && value === 0) {
    return `0 ${currency}`;
  }
  return `${value.toFixed(2).replace(/\.00$/, value === 0 ? '' : '.00')} ${currency}`;
}

export const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  invoice,
  totals,
  qrDataUrl,
  forExport = false,
}) => {
  const isManualReplica = invoice.calculationMode === 'manual-replica';

  return (
    <div
      id={forExport ? undefined : 'invoice-print-area'}
      className={`invoice-a4-sheet font-invoice bg-white text-[#111827] w-[794px] min-h-[1123px] px-[34px] pt-[28px] pb-[44px] box-border flex flex-col ${
        forExport
          ? ''
          : 'shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-200/80'
      }`}
    >
      {/* 1. Top Header Strip */}
      <div className="relative flex items-center justify-between border-b border-[#4a74ad] pb-1.5">
        <div className="text-[13px] text-[#214d86] tabular-nums">
          VAT: {invoice.headerVatNumber}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-[14px] font-semibold text-[#214d86] whitespace-nowrap">
          <span>{invoice.titleEnglish}</span>
          <span dir="rtl">{invoice.titleArabic}</span>
        </div>
        <div className="w-[120px]" aria-hidden="true" />
      </div>

      {/* 2. Seller Header: Logo + Company Details + Auto-Generated QR */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <BimAutoLogo customLogoDataUrl={invoice.customLogoDataUrl} />

          <div className="flex-1 min-w-0 pt-0.5 text-[#111827]">
            <h1
              dir="rtl"
              className="text-[16px] font-bold leading-snug text-left text-[#111827]"
            >
              {invoice.sellerNameArabic}
            </h1>
            <p className="text-[11px] leading-[1.45] mt-0.5 tabular-nums">
              Phone: {invoice.sellerPhone}
            </p>
            <p className="text-[11px] leading-[1.45]">
              Email:{invoice.sellerEmail}
            </p>
            <p className="text-[11px] leading-[1.4] mt-1 max-w-[335px]">
              {invoice.sellerAddress}
            </p>
            <div className="text-[10.5px] leading-[1.45] mt-1.5 flex flex-wrap items-center gap-x-3 tabular-nums">
              <span>
                VAT: <strong className="font-bold">{invoice.sellerVat}</strong>
              </span>
              <span>
                CR No: <strong className="font-bold">{invoice.sellerCrNo}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Auto-Generated ZATCA QR Code */}
        <div className="w-[104px] h-[104px] shrink-0 flex items-center justify-center bg-white">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="ZATCA Tax Invoice QR Code"
              className="w-[104px] h-[104px] object-contain"
              style={{ imageRendering: 'pixelated' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-[104px] h-[104px] border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
              QR
            </div>
          )}
        </div>
      </div>

      {/* 3. Bill To & Invoice Metadata Box */}
      <div className="mt-7 flex items-start justify-between gap-5">
        {/* Left: Bill To */}
        <div className="w-[61%]">
          <div className="flex items-center justify-between border-b border-[#4a74ad] pb-1.5 text-[12px]">
            <span className="text-[#214d86] font-medium pl-5">
              {invoice.billToLabelEn}
            </span>
            <span dir="rtl" className="text-[#111827] font-medium">
              {invoice.buyerNameArabic}
            </span>
            <span dir="rtl" className="text-[#214d86] font-medium pr-7">
              {invoice.billToLabelAr}
            </span>
          </div>

          <div className="pt-2.5 text-[#111827]">
            <div className="text-[13px] font-bold leading-[1.3] whitespace-pre-line">
              {invoice.buyerNameEnglish}
            </div>
            <div className="text-[11px] font-bold mt-0.5 tabular-nums">
              VAT: {invoice.buyerVat}
            </div>
          </div>
        </div>

        {/* Right: Invoice Metadata Gray Box */}
        <div className="w-[37%] bg-[#e8eaed] px-3 py-2.5">
          <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 items-end">
            <div className="text-[10px] text-[#1f2937] pb-0.5 whitespace-nowrap">
              Invoice No. / <span dir="rtl">رقم فاتورة</span>
            </div>
            <div className="text-[9.5px] font-bold text-[#111827] text-right leading-[1.25] whitespace-pre-line tabular-nums">
              {invoice.invoiceNo}
            </div>

            <div className="text-[10px] text-[#1f2937] whitespace-nowrap">
              Invoice Date / <span dir="rtl">تاريخ فاتورة</span>
            </div>
            <div className="text-[10px] font-bold text-[#111827] text-right tabular-nums">
              {invoice.invoiceDateDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Line Items Table */}
      <div className="mt-6">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#e9ebee] text-[#1f2937] text-[10.5px] font-normal">
              <th className="w-[54px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>Sr.no</div>
                <div dir="rtl">مسلسل</div>
              </th>
              <th className="w-[186px] py-2 px-2 font-normal text-center leading-[1.25]">
                <div>Name of Products</div>
                <div dir="rtl">اسم المنتج</div>
              </th>
              <th className="w-[62px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>Quantity</div>
                <div dir="rtl">الكمية</div>
              </th>
              <th className="w-[82px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>Rate</div>
                <div dir="rtl">السعر</div>
              </th>
              <th className="w-[74px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>Discount</div>
                <div dir="rtl">مجموع الخصومات</div>
              </th>
              <th className="w-[68px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>Tax Rate</div>
                <div dir="rtl">نسبة الضريبة</div>
              </th>
              <th className="w-[78px] py-2 px-1 font-normal text-center leading-[1.25]">
                <div>VAT Amount</div>
                <div dir="rtl">مبلغ الضريبة</div>
              </th>
              <th className="w-[84px] py-2 px-2 font-normal text-right leading-[1.25]">
                <div>Amount</div>
                <div dir="rtl">المبلغ</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const computedLine = totals.lineResults[idx];
              const vatVal = isManualReplica
                ? item.manualVatAmount ?? 0
                : computedLine?.vatAmount ?? 0;
              const lineAmountVal = isManualReplica
                ? item.manualAmount ?? item.rate * item.quantity
                : computedLine?.lineTotal ?? item.rate * item.quantity;

              return (
                <tr key={item.id} className="text-[11px] text-[#111827] tabular-nums">
                  <td className="py-2.5 px-1 text-right pr-3 align-top">{item.srNo}</td>
                  <td className="py-2.5 px-2 text-center align-top" dir="auto">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-1 text-center align-top">{item.quantity}</td>
                  <td className="py-2.5 px-1 text-center align-top whitespace-nowrap">
                    {item.rate.toFixed(2)} {invoice.currency}
                  </td>
                  <td className="py-2.5 px-1 text-center align-top whitespace-nowrap">
                    {formatLineNumber(item.discount, invoice.currency, isManualReplica)}
                  </td>
                  <td className="py-2.5 px-1 text-center align-top whitespace-nowrap">
                    {item.taxRate.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-1 text-center align-top whitespace-nowrap">
                    {formatLineNumber(vatVal, invoice.currency, isManualReplica)}
                  </td>
                  <td className="py-2.5 px-2 text-right align-top whitespace-nowrap">
                    {lineAmountVal.toFixed(2)} {invoice.currency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Totals Summary Table (Right-aligned ~68.5% matching PDF) */}
      <div className="mt-1 flex justify-end">
        <div className="w-[68.5%] border-t border-[#7a9ac7] text-[11px] text-[#111827]">
          {/* Row 1: Total (Excluding VAT) */}
          <div className="grid grid-cols-[155px_1fr_92px] items-center py-2.5 px-1.5 border-b border-[#d1d5db] gap-2">
            <div className="text-left leading-tight">
              Total <span className="text-[9px] tracking-tight">(ExcludingVAT&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</span>
            </div>
            <div dir="rtl" className="text-right text-[10.5px] leading-tight">
              إجمالي قيمة الضريبة (غير شامل ضريبة القيمة المضافة)
            </div>
            <div className="text-right font-bold tabular-nums whitespace-nowrap">
              {formatMoney(totals.totalExcludingVat, invoice.currency)}
            </div>
          </div>

          {/* Row 2: Discount */}
          <div className="grid grid-cols-[155px_1fr_92px] items-center py-2.5 px-1.5 border-b border-[#d1d5db] gap-2">
            <div className="text-left">Discount</div>
            <div dir="rtl" className="text-center text-[11px]">
              مجموع الخصومات
            </div>
            <div className="text-right font-bold tabular-nums whitespace-nowrap">
              {formatMoney(totals.discountTotal, invoice.currency)}
            </div>
          </div>

          {/* Row 3: Total Taxable Amount (Excluding Tax) */}
          <div className="grid grid-cols-[155px_1fr_92px] items-center py-2.5 px-1.5 border-b border-[#d1d5db] gap-2">
            <div className="text-left leading-snug">
              Total Taxable Amount (Excluding Tax)
            </div>
            <div dir="rtl" className="text-center text-[11px] leading-[1.35]">
              الإجمالي الخاضع للضريبية
              <br />
              (غير شاملة ضريبة القيمة
              <br />
              المضافة )
            </div>
            <div className="text-right font-bold tabular-nums whitespace-nowrap">
              {formatMoney(totals.totalTaxable, invoice.currency)}
            </div>
          </div>

          {/* Row 4: Total VAT */}
          <div className="grid grid-cols-[155px_1fr_92px] items-center py-2.5 px-1.5 border-b border-[#d1d5db] gap-2">
            <div className="text-left">Total VAT</div>
            <div dir="rtl" className="text-center text-[11px] leading-[1.35]">
              مجموع ضريبة القيمة
              <br />
              المضافة
            </div>
            <div className="text-right font-bold tabular-nums whitespace-nowrap">
              {totals.totalVat.toFixed(2)}
              {isManualReplica ? invoice.currency : ` ${invoice.currency}`}
            </div>
          </div>

          {/* Row 5: Total Amount Due */}
          <div className="grid grid-cols-[155px_1fr_92px] items-center py-2.5 px-1.5 bg-[#edf1f7] border-t border-b border-[#6e92c2] text-[#214d86] gap-2">
            <div className="text-left font-bold text-[11.5px]">Total Amount Due</div>
            <div dir="rtl" className="text-center font-normal text-[12px] leading-[1.3]">
              إجمالي المبلغ
              <br />
              المستحق
            </div>
            <div className="text-right font-bold text-[11.5px] tabular-nums whitespace-nowrap">
              {formatMoney(totals.totalAmountDue, invoice.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Signature Block */}
      <div className="mt-28 pr-10 flex flex-col items-end">
        <div className="text-[13px] font-semibold text-[#214d86] tracking-wide flex items-center gap-1.5">
          <span dir="rtl">{invoice.signatureArabic}</span>
          <span>/</span>
          <span>{invoice.signatureEnglish}</span>
        </div>
        {invoice.signatureImageDataUrl && (
          <img
            src={invoice.signatureImageDataUrl}
            alt="Authorized Signature"
            className="mt-3 max-h-[64px] max-w-[180px] object-contain"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
};
