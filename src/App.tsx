import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileDown,
  FolderOpen,
  Loader2,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EditorSidebar } from './components/EditorSidebar';
import { InvoiceSheet } from './components/InvoiceSheet';
import {
  AUTO_CALCULATED_INVOICE,
  EXACT_REPLICA_INVOICE,
  InvoiceData,
  RAW_PDF_TEXT_REPLICA,
  SavedInvoiceRecord,
  computeInvoiceTotals,
  createBlankInvoice,
} from './types/invoice';
import {
  buildQrPayload,
  buildZatcaTlvFields,
  generateQrPngDataUrl,
  generateQrSvgString,
} from './utils/zatcaQr';
import { exportInvoiceElementToPdf } from './utils/exportPdf';

const STORAGE_KEY = 'zatca-invoice-studio-v1';
const SAVED_LIST_KEY = 'zatca-saved-invoices-v1';

export default function App() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as InvoiceData;
      }
    } catch {
      // Ignore storage read errors
    }
    return EXACT_REPLICA_INVOICE;
  });

  const [savedInvoices, setSavedInvoices] = useState<SavedInvoiceRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_LIST_KEY);
      if (raw) {
        return JSON.parse(raw) as SavedInvoiceRecord[];
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [fitScale, setFitScale] = useState<number>(0.88);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [activePreset, setActivePreset] = useState<'replica' | 'auto' | 'raw' | 'custom'>('replica');
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Persist current draft locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
    } catch {
      // Ignore storage quota errors
    }
  }, [invoice]);

  // Persist saved invoices list
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_LIST_KEY, JSON.stringify(savedInvoices));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedInvoices]);

  // Responsive A4 fit scale
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth - 48;
      if (availableWidth > 0) {
        const computed = Math.min(1, Math.max(0.45, availableWidth / 794));
        setFitScale(Number(computed.toFixed(3)));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totals = useMemo(() => computeInvoiceTotals(invoice), [invoice]);
  const qrPayload = useMemo(() => buildQrPayload(invoice, totals), [invoice, totals]);
  const tlvFields = useMemo(() => buildZatcaTlvFields(invoice, totals), [invoice, totals]);

  // Regenerate crisp QR code whenever payload changes
  useEffect(() => {
    let cancelled = false;
    generateQrPngDataUrl(qrPayload)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const effectiveScale = zoomMode === 'fit' ? fitScale : zoomMode;

  const applyPreset = (preset: 'replica' | 'auto' | 'raw') => {
    setActivePreset(preset);
    if (preset === 'replica') {
      setInvoice(EXACT_REPLICA_INVOICE);
    } else if (preset === 'auto') {
      setInvoice(AUTO_CALCULATED_INVOICE);
    } else {
      setInvoice(RAW_PDF_TEXT_REPLICA);
    }
  };

  const handleNewInvoice = (keepSeller: boolean) => {
    setActivePreset('custom');
    setInvoice((prev) => createBlankInvoice(keepSeller ? prev : undefined));
  };

  const handleSaveInvoice = () => {
    const record: SavedInvoiceRecord = {
      id: `inv-${Date.now()}`,
      savedAt: new Date().toLocaleString(),
      totalAmount: totals.totalAmountDue,
      data: invoice,
    };
    setSavedInvoices((prev) => [record, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const handleLoadSaved = (record: SavedInvoiceRecord) => {
    setInvoice(record.data);
    setActivePreset('custom');
    setShowSavedDrawer(false);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedInvoices((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownloadPdf = async () => {
    const node = exportRef.current;
    if (!node || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const safeName =
        invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'tax-invoice';
      await exportInvoiceElementToPdf(node, `invoice-${safeName}.pdf`);
    } catch {
      setExportError('PDF export failed in this browser. Try using the Print button or Export JSON.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadQrPng = async () => {
    const dataUrl = await generateQrPngDataUrl(qrPayload);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `zatca-qr-${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '') || 'invoice'}.png`;
    link.click();
  };

  const handleDownloadQrSvg = async () => {
    const svgText = await generateQrSvgString(qrPayload);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zatca-qr-${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '') || 'invoice'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '') || 'data'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === 'string') {
          const parsed = JSON.parse(reader.result) as InvoiceData;
          if (parsed && Array.isArray(parsed.items)) {
            setInvoice(parsed);
            setActivePreset('custom');
          }
        }
      } catch {
        // Ignore malformed JSON
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Bar (3-zone contract) */}
      <header className="no-print h-[57px] bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          ZATCA Invoice Studio
        </span>

        {/* Zone 2: Preset navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => applyPreset('replica')}
            className={`whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors ${
              activePreset === 'replica'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'hover:text-slate-900'
            }`}
          >
            Exact Replica
          </button>
          <button
            type="button"
            onClick={() => applyPreset('auto')}
            className={`whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors ${
              activePreset === 'auto'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'hover:text-slate-900'
            }`}
          >
            Auto-Calculate VAT
          </button>
          <button
            type="button"
            onClick={() => applyPreset('raw')}
            className={`whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors ${
              activePreset === 'raw'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'hover:text-slate-900'
            }`}
          >
            Raw PDF Text
          </button>
          <button
            type="button"
            onClick={() => setShowSavedDrawer(true)}
            className="whitespace-nowrap shrink-0 cursor-pointer hover:text-slate-900 transition-colors tabular-nums"
          >
            Saved Invoices ({savedInvoices.length})
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {exportError && (
        <div className="no-print bg-red-50 border-b border-red-200 px-5 py-2 flex items-center justify-between text-xs text-red-800">
          <span>{exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile View Toggle */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full">
          <button
            type="button"
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mobileView === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Enter Data
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mobileView === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            A4 Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Data Entry Form */}
        <div className={mobileView === 'editor' ? 'block lg:block' : 'hidden lg:block'}>
          <EditorSidebar
            invoice={invoice}
            totals={totals}
            qrPayload={qrPayload}
            qrDataUrl={qrDataUrl}
            tlvFields={tlvFields}
            onChange={(updater) => {
              setActivePreset('custom');
              setInvoice(updater);
            }}
            onNewInvoice={handleNewInvoice}
            onSaveInvoice={handleSaveInvoice}
            justSaved={justSaved}
            onDownloadQrPng={handleDownloadQrPng}
            onDownloadQrSvg={handleDownloadQrSvg}
          />
        </div>

        {/* Right A4 Document Viewport */}
        <main
          className={`flex-1 flex flex-col min-w-0 bg-slate-200/70 ${
            mobileView === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Workspace Toolbar */}
          <div className="no-print bg-white/90 backdrop-blur-xs border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Live A4 Preview</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Total: {totals.totalAmountDue.toFixed(2)} {invoice.currency}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {invoice.qrMode === 'zatca-tlv' ? 'ZATCA TLV QR' : 'Plain Text QR'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setZoomMode((z) => {
                      const curr = z === 'fit' ? fitScale : z;
                      return Math.max(0.5, Number((curr - 0.1).toFixed(2)));
                    })
                  }
                  className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2 py-0.5 text-xs font-medium rounded cursor-pointer whitespace-nowrap tabular-nums ${
                    zoomMode === 'fit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fit ({Math.round(effectiveScale * 100)}%)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode(1)}
                  className={`px-2 py-0.5 text-xs font-medium rounded cursor-pointer whitespace-nowrap tabular-nums ${
                    zoomMode === 1
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoomMode((z) => {
                      const curr = z === 'fit' ? fitScale : z;
                      return Math.min(1.3, Number((curr + 0.1).toFixed(2)));
                    })
                  }
                  className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSavedDrawer(true)}
                className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Saved ({savedInvoices.length})</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>

              <button
                type="button"
                onClick={() => applyPreset('replica')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Reset to exact reference invoice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sample</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Open browser print dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Scrollable Paper Stage */}
          <div
            ref={viewportRef}
            className="print-only-root flex-1 overflow-auto p-6 flex justify-center items-start lg:h-[calc(100vh-105px)]"
          >
            <div
              className="invoice-zoom-wrapper origin-top transition-transform duration-150"
              style={{
                width: `${794 * effectiveScale}px`,
                height: `${1123 * effectiveScale}px`,
              }}
            >
              <div
                style={{
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <InvoiceSheet
                  invoice={invoice}
                  totals={totals}
                  qrDataUrl={qrDataUrl}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Saved Invoices Drawer */}
      {showSavedDrawer && (
        <div className="no-print fixed inset-0 z-50 flex justify-end bg-slate-900/30">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Saved Invoices</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Load or manage invoices you have saved locally.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close saved invoices"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {savedInvoices.length === 0 ? (
                <div className="py-12 px-4 text-center border border-dashed border-slate-300 rounded-lg">
                  <p className="text-sm text-slate-600">No saved invoices yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your data in the form and click Save Invoice to keep a copy here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {savedInvoices.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(rec)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {rec.data.invoiceNo.replace(/\s+/g, ' ') || 'Untitled Invoice'}
                        </div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">
                          {rec.data.buyerNameEnglish || rec.data.buyerNameArabic || 'No Buyer'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 tabular-nums">
                          <span>
                            {rec.totalAmount.toFixed(2)} {rec.data.currency}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{rec.data.invoiceDateDisplay}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                        title="Delete saved invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offscreen unscaled A4 container for direct PDF export across all viewports */}
      <div
        aria-hidden="true"
        className="no-print fixed left-[-10000px] top-0 w-[794px] h-[1123px] pointer-events-none overflow-hidden bg-white"
      >
        <div ref={exportRef} className="w-[794px] h-[1123px]">
          <InvoiceSheet
            invoice={invoice}
            totals={totals}
            qrDataUrl={qrDataUrl}
            forExport
          />
        </div>
      </div>
    </div>
  );
}
