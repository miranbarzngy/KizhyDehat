'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface InvoiceData {
  // The invoice data object that will be passed to GlobalInvoiceModal
  [key: string]: any
}

interface GlobalInvoiceModalContextType {
  isOpen: boolean
  invoiceData: InvoiceData | null
  invoiceId: string | null
  title: string
  openModal: (data: InvoiceData, id?: string, title?: string) => void
  closeModal: () => void
}

const GlobalInvoiceModalContext = createContext<GlobalInvoiceModalContextType | undefined>(undefined)

export function GlobalInvoiceModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [title, setTitle] = useState('وردەکارییەکانی پسوڵە')

  const openModal = useCallback((data: InvoiceData, id?: string, customTitle?: string) => {
    setInvoiceData(data)
    setInvoiceId(id || null)
    setTitle(customTitle || 'وردەکارییەکانی پسوڵە')
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Clear data after animation completes
    setTimeout(() => {
      setInvoiceData(null)
      setInvoiceId(null)
    }, 300)
  }, [])

  return (
    <GlobalInvoiceModalContext.Provider value={{ isOpen, invoiceData, invoiceId, title, openModal, closeModal }}>
      {children}
    </GlobalInvoiceModalContext.Provider>
  )
}

export function useGlobalInvoiceModal() {
  const context = useContext(GlobalInvoiceModalContext)
  if (!context) {
    throw new Error('useGlobalInvoiceModal must be used within a GlobalInvoiceModalProvider')
  }
  return context
}
