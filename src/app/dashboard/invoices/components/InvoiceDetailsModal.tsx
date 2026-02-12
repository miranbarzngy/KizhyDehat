'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { FaFileInvoice, FaEye, FaPrint } from 'react-icons/fa'
import { Invoice, SaleData } from './invoiceUtils'
import InvoicePreview from './InvoicePreview'
import html2canvas from 'html2canvas'
import { formatCurrency } from '@/lib/numberUtils'
import { useRef } from 'react'

interface InvoiceDetailsModalProps {
  showInvoiceModal: boolean
  setShowInvoiceModal: (show: boolean) => void
  selectedInvoice: Invoice | null
  invoiceDetails: SaleData | null
  onDownload: () => void
}

export default function InvoiceDetailsModal({
  showInvoiceModal,
  setShowInvoiceModal,
  selectedInvoice,
  invoiceDetails,
  onDownload
}: InvoiceDetailsModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      {showInvoiceModal && invoiceDetails && selectedInvoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInvoiceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FaFileInvoice className="text-blue-500 text-2xl" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    وردەکارییەکانی فاکتور #{selectedInvoice.invoice_number}
                  </h3>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {new Date(selectedInvoice.date).toLocaleDateString('ku')} - {invoiceDetails.customers?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEye className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto overflow-x-hidden max-h-[90vh] md:max-h-[80vh]" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Invoice Wrapper */}
              <div style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '10px'
              }}>
                {/* Invoice Component - Responsive Scaling with Scroll */}
                <div
                  className="invoice-preview-container"
                  style={{
                    width: 'auto',
                    aspectRatio: 'auto',
                    transformOrigin: 'top center',
                    minHeight: 'fit-content'
                  }}
                >
                  <style jsx>{`
                    .invoice-preview-container {
                      zoom: 0.25;
                    }
                    @media (min-width: 480px) {
                      .invoice-preview-container {
                        zoom: 0.3;
                      }
                    }
                    @media (min-width: 640px) {
                      .invoice-preview-container {
                        zoom: 0.4;
                      }
                    }
                    @media (min-width: 768px) {
                      .invoice-preview-container {
                        zoom: 0.5;
                      }
                    }
                    @media (min-width: 1024px) {
                      .invoice-preview-container {
                        zoom: 0.6;
                      }
                    }
                    @media (min-width: 1280px) {
                      .invoice-preview-container {
                        zoom: 0.7;
                      }
                    }
                    @media (min-width: 1536px) {
                      .invoice-preview-container {
                        zoom: 0.8;
                      }
                    }
                    @media (min-width: 1920px) {
                      .invoice-preview-container {
                        zoom: 1;
                      }
                    }
                  `}</style>
                  <InvoicePreview saleData={invoiceDetails} invoice={selectedInvoice} invoiceRef={invoiceRef} />
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg p-4 print:hidden" style={{ flexShrink: 0 }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Total Amount Display */}
                <div className="text-center sm:text-right">
                  <div className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    کۆی گشتی
                  </div>
                  <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    {formatCurrency(selectedInvoice.total)} IQD
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <motion.button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>چاپکردن</span>
                  </motion.button>

                  <motion.button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>داگرتن</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setShowInvoiceModal(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 print:hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: 'var(--font-uni-salar)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>داخستن</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
