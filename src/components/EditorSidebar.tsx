import React, { useState } from 'react';
import {
  BookmarkPlus,
  Building2,
  CalendarClock,
  Check,
  Copy,
  Download,
  Eraser,
  FilePlus2,
  FileText,
  ImagePlus,
  ListOrdered,
  Plus,
  QrCode,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ComputedTotals,
  InvoiceData,
  LineItem,
  formatTodayDisplay,
} from '../types/invoice';
import { ZatcaTlvField } from '../utils/zatcaQr';

type EditorSection = 'all' | 'seller' | 'buyer' | 'items' | 'qr';

interface EditorSidebarProps {
  invoice: InvoiceData;
  totals: ComputedTotals;
  qrPayload: string;
  qrDataUrl: string;
  tlvFields: ZatcaTlvField[];
  onChange: (updater: (prev: InvoiceData) => InvoiceData) => void;
  onNewInvoice: (keepSeller: boolean) => void;
  onSaveInvoice: () => void;
  justSaved: boolean;
  onDownloadQrPng: () => void;
  onDownloadQrSvg: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  invoice,
  totals,
  qrPayload,
  qrDataUrl,
  tlvFields,
  onChange,
  onNewInvoice,
  onSaveInvoice,
  justSaved,
  onDownloadQrPng,
  onDownloadQrSvg,
}) => {
  const [activeSection, setActiveSection] = useState<EditorSection>('all');
  const [copiedPayload, setCopiedPayload] = useState(false);

  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    onChange((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addLineItem = () => {
    onChange((prev) => {
      const nextSr =
        prev.items.length > 0 ? Math.max(...prev.items.map((i) => i.srNo)) + 1 : 1;
      const newItem: LineItem = {
        id: `item-${Date.now()}`,
        srNo: nextSr,
        name: '',
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 15.0,
        manualVatAmount: 0,
        manualAmount: 0,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const removeLineItem = (id: string) => {
    onChange((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, srNo: idx + 1 })),
    }));
  };

  const handleUseNowTimestamp = () => {
    const now = new Date();
    onChange((prev) => ({
      ...prev,
      invoiceDateDisplay: formatTodayDisplay(),
      zatcaTimestampIso: now.toISOString(),
    }));
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'customLogoDataUrl' | 'signatureImageDataUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField(target, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 1800);
    } catch {
      // Clipboard blocked in some contexts
    }
  };

  const sections: Array<{ id: EditorSection; label: string; icon?: React.ReactNode }> = [
    { id: 'all', label: 'All Fields' },
    { id: 'buyer', label: 'Buyer', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'items', label: 'Items', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'seller', label: 'Seller', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'qr', label: 'QR', icon: <QrCode className="w-3.5 h-3.5" /> },
  ];

  const inputClass =
    'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

  const showBuyer = activeSection === 'all' || activeSection === 'buyer';
  const showItems = activeSection === 'all' || activeSection === 'items';
  const showSeller = activeSection === 'all' || activeSection === 'seller';
  const showQr = activeSection === 'all' || activeSection === 'qr';

  return (
    <aside className="no-print w-full lg:w-[440px] xl:w-[470px] shrink-0 bg-white border-r border-slate-200 flex flex-col lg:h-[calc(100vh-57px)] overflow-hidden">
      {/* Quick Entry Action Bar */}
      <div className="px-4 pt-3 pb-2.5 border-b border-slate-200 bg-slate-50/80 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNewInvoice(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSaveInvoice}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Invoice</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNewInvoice(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Clear every field to start from scratch"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Section Filter */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/70 rounded-lg">
          {sections.map((sec) => {
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center justify-center gap-1 px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Data Entry Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 1. Buyer & Invoice Metadata */}
        {showBuyer && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Invoice Info & Buyer (Bill To)
              </h2>
              <button
                type="button"
                onClick={handleUseNowTimestamp}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer whitespace-nowrap"
              >
                <CalendarClock className="w-3 h-3" />
                <span>Set Today</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Invoice No. / رقم فاتورة</label>
                <input
                  type="text"
                  value={invoice.invoiceNo.replace(/\n/g, ' ')}
                  onChange={(e) => updateField('invoiceNo', e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className={`${inputClass} font-mono-studio text-xs`}
                />
              </div>
              <div>
                <label className={labelClass}>Invoice Date / تاريخ</label>
                <input
                  type="text"
                  value={invoice.invoiceDateDisplay}
                  onChange={(e) => updateField('invoiceDateDisplay', e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>ZATCA QR Timestamp (ISO 8601)</label>
              <input
                type="text"
                value={invoice.zatcaTimestampIso}
                onChange={(e) => updateField('zatcaTimestampIso', e.target.value)}
                placeholder="2026-11-23T10:30:00Z"
                className={`${inputClass} font-mono-studio text-xs`}
              />
            </div>

            <div>
              <label className={labelClass}>Buyer Company Name (Arabic)</label>
              <input
                type="text"
                dir="rtl"
                value={invoice.buyerNameArabic}
                onChange={(e) => updateField('buyerNameArabic', e.target.value)}
                placeholder="مثال: شركة النجوم للاتصالات"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Buyer Company Name (English)</label>
              <textarea
                rows={2}
                value={invoice.buyerNameEnglish}
                onChange={(e) => updateField('buyerNameEnglish', e.target.value)}
                placeholder="Customer company name"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Buyer VAT Number</label>
                <input
                  type="text"
                  value={invoice.buyerVat}
                  onChange={(e) => updateField('buyerVat', e.target.value)}
                  placeholder="15-digit VAT number"
                  className={`${inputClass} font-mono-studio text-xs`}
                />
              </div>
              <div>
                <label className={labelClass}>Top Header VAT</label>
                <input
                  type="text"
                  value={invoice.headerVatNumber}
                  onChange={(e) => updateField('headerVatNumber', e.target.value)}
                  placeholder="Header VAT number"
                  className={`${inputClass} font-mono-studio text-xs`}
                />
              </div>
            </div>
          </section>
        )}

        {/* 2. Line Items */}
        {showItems && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Products & Services
              </h2>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Calculation Mode Switch */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700">Math Mode</span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-md">
                <button
                  type="button"
                  onClick={() => updateField('calculationMode', 'auto')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    invoice.calculationMode === 'auto'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Auto-Calculate VAT
                </button>
                <button
                  type="button"
                  onClick={() => updateField('calculationMode', 'manual-replica')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    invoice.calculationMode === 'manual-replica'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual Override
                </button>
              </div>
            </div>

            {invoice.items.length === 0 ? (
              <div className="py-6 px-4 text-center border border-dashed border-slate-300 rounded-lg">
                <p className="text-sm text-slate-600">No products added yet.</p>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {invoice.items.map((item) => (
                  <div key={item.id} className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 tabular-nums">
                        Item #{item.srNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className={labelClass}>Product / Service Name (AR or EN)</label>
                      <input
                        type="text"
                        dir="auto"
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, { name: e.target.value })}
                        placeholder="Enter product description..."
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className={labelClass}>Qty</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Discount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discount}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              discount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Tax %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              taxRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>

                    {invoice.calculationMode === 'manual-replica' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className={labelClass}>Override VAT Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.manualVatAmount ?? 0}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                manualVatAmount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Override Row Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.manualAmount ?? 0}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                manualAmount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Seller Details & Logo */}
        {showSeller && (
          <section className="space-y-3.5">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Seller Details & Company Logo
              </h2>
            </div>

            <div>
              <label className={labelClass}>Seller Name (Arabic / QR Tag 1)</label>
              <input
                type="text"
                dir="rtl"
                value={invoice.sellerNameArabic}
                onChange={(e) => updateField('sellerNameArabic', e.target.value)}
                placeholder="اسم المؤسسة أو الشركة"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Seller VAT No. (QR Tag 2)</label>
                <input
                  type="text"
                  value={invoice.sellerVat}
                  onChange={(e) => updateField('sellerVat', e.target.value)}
                  placeholder="310660947300023"
                  className={`${inputClass} font-mono-studio text-xs`}
                />
              </div>
              <div>
                <label className={labelClass}>CR No.</label>
                <input
                  type="text"
                  value={invoice.sellerCrNo}
                  onChange={(e) => updateField('sellerCrNo', e.target.value)}
                  placeholder="4030411804"
                  className={`${inputClass} font-mono-studio text-xs`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={invoice.sellerPhone}
                  onChange={(e) => updateField('sellerPhone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={invoice.sellerEmail}
                  onChange={(e) => updateField('sellerEmail', e.target.value)}
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <input
                  type="text"
                  value={invoice.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Seller Address</label>
              <textarea
                rows={2}
                value={invoice.sellerAddress}
                onChange={(e) => updateField('sellerAddress', e.target.value)}
                placeholder="Street, City, Region, Postal Code"
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'customLogoDataUrl')}
                />
              </label>
              {invoice.customLogoDataUrl && (
                <button
                  type="button"
                  onClick={() => updateField('customLogoDataUrl', undefined)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Restore BIM auto</span>
                </button>
              )}

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Upload Signature</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'signatureImageDataUrl')}
                />
              </label>
              {invoice.signatureImageDataUrl && (
                <button
                  type="button"
                  onClick={() => updateField('signatureImageDataUrl', undefined)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Sig</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* 4. Totals & Auto-Generated ZATCA QR */}
        {showQr && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Totals & Auto-Generated QR
              </h2>
              <span className="text-xs text-slate-500">
                {invoice.calculationMode === 'auto' ? 'Auto-Computed' : 'Manual Override'}
              </span>
            </div>

            {invoice.calculationMode === 'manual-replica' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Total (Excluding VAT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.manualTotalExcludingVat}
                    onChange={(e) =>
                      updateField(
                        'manualTotalExcludingVat',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.manualDiscountTotal}
                    onChange={(e) =>
                      updateField('manualDiscountTotal', parseFloat(e.target.value) || 0)
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Total Taxable Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.manualTotalTaxable}
                    onChange={(e) =>
                      updateField('manualTotalTaxable', parseFloat(e.target.value) || 0)
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Total VAT (QR Tag 5)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.manualTotalVat}
                    onChange={(e) =>
                      updateField('manualTotalVat', parseFloat(e.target.value) || 0)
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Total Amount Due (QR Tag 4)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.manualTotalAmountDue}
                    onChange={(e) =>
                      updateField('manualTotalAmountDue', parseFloat(e.target.value) || 0)
                    }
                    className={`${inputClass} font-semibold tabular-nums`}
                  />
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-slate-600">Total Taxable</span>
                  <span className="font-medium tabular-nums">
                    {totals.totalTaxable.toFixed(2)} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-slate-600">Total VAT</span>
                  <span className="font-medium tabular-nums">
                    {totals.totalVat.toFixed(2)} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-slate-50 font-semibold text-slate-900">
                  <span>Total Amount Due</span>
                  <span className="tabular-nums">
                    {totals.totalAmountDue.toFixed(2)} {invoice.currency}
                  </span>
                </div>
              </div>
            )}

            {/* ZATCA QR Card */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">QR Encoding</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => updateField('qrMode', 'zatca-tlv')}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                      invoice.qrMode === 'zatca-tlv'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ZATCA TLV
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('qrMode', 'plain-summary')}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                      invoice.qrMode === 'plain-summary'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-20 h-20 border border-slate-200 rounded-md p-1 bg-white shrink-0 flex items-center justify-center">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Generated QR Preview"
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={onDownloadQrPng}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDownloadQrSvg}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>SVG</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPayload}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Data</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono-studio text-[10px] text-slate-600 break-all max-h-14 overflow-y-auto">
                    {qrPayload}
                  </div>
                </div>
              </div>

              {invoice.qrMode === 'zatca-tlv' && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                    ZATCA Phase 1 TLV Tags (Live)
                  </div>
                  <table className="w-full text-[11px]">
                    <tbody className="divide-y divide-slate-200">
                      {tlvFields.map((f) => (
                        <tr key={f.tag}>
                          <td className="px-2.5 py-1.5 font-mono-studio text-slate-500 w-9">
                            T{f.tag}
                          </td>
                          <td className="px-2 py-1.5 text-slate-700 font-medium whitespace-nowrap">
                            {f.label}
                          </td>
                          <td
                            className="px-2.5 py-1.5 text-right text-slate-900 truncate max-w-[140px]"
                            dir="auto"
                            title={f.value}
                          >
                            {f.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};
