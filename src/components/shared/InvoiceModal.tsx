'use client'

import GlobalInvoiceModal, { buildInvoiceData } from '@/components/GlobalInvoiceModal'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface InvoiceSettings {
  id: string
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_logo: string
  thank_you_note: string
  qr_code_url: string
}

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
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return
      try {
        const { data, error } = await supabase.from('invoice_settings').select('*').limit(1).single()
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching invoice settings:', error)
        }
        setInvoiceSettings(data || null)
      } catch (error) { 
        console.error('Error fetching invoice settings:', error) 
      }
    }
    fetchSettings()
  }, [])

  // Build invoice data from selectedInvoice and invoiceDetails
  const invoiceData = selectedInvoice && invoiceDetails 
    ? buildInvoiceData(invoiceDetails, selectedInvoice, invoiceSettings)
    : null

  return (
    <GlobalInvoiceModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      invoiceData={invoiceData}
      invoiceId={selectedInvoice?.id}
      title={`پسوڵە #${selectedInvoice?.invoice_number || selectedInvoice?.id?.slice(0, 8).toUpperCase() || '---'}`}
    />
  )
}
