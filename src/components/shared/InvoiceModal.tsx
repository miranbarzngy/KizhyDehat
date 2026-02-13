'use client'

import GlobalInvoiceModal, { buildInvoiceData } from '@/components/GlobalInvoiceModal'

interface InvoiceModalProps {
  showModal: boolean
  setShowModal: (show: boolean) => void
  selectedInvoice: any | null
  invoiceDetails: any | null
}

export default function InvoiceModal({
  showModal,
  setShowModal,
  selectedInvoice,
  invoiceDetails
}: InvoiceModalProps) {
  // Build invoice data from selectedInvoice and invoiceDetails
  const invoiceData = selectedInvoice && invoiceDetails 
    ? buildInvoiceData(invoiceDetails, selectedInvoice, null)
    : null

  return (
    <GlobalInvoiceModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      invoiceData={invoiceData}
      invoiceId={selectedInvoice?.id}
      title={`فاکتور #${selectedInvoice?.invoice_number || selectedInvoice?.id?.slice(0, 8).toUpperCase() || '---'}`}
    />
  )
}
