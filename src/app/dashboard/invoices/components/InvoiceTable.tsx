'use client'

import { formatCurrency } from '@/lib/numberUtils'
import { motion } from 'framer-motion'
import { Invoice } from './invoiceUtils'

interface InvoiceTableProps {
  filteredInvoices: Invoice[]
  onView: (invoice: Invoice) => void
  onRefund: (invoice: Invoice) => void
}

export default function InvoiceTable({
  filteredInvoices,
  onView,
  onRefund
}: InvoiceTableProps) {
  return (
    <div className="bg-white/80 dark:bg-[#2a2d3e]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-xl rounded-3xl overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#2a2d3e]/60">
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                ژمارەی پسوڵە
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کڕیار
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                بەروار
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کۆی گشتی
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                دۆخ
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                شێوازی پارەدان
              </th>
              <th className="px-2 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-900 dark:text-gray-200 text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                کردار
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-2 md:px-6 py-3 md:py-4 text-gray-900 dark:text-gray-200 font-bold text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  #{invoice.invoice_number}
                </td>
                <td className="px-2 md:px-6 py-3 md:py-4 text-gray-900 dark:text-gray-200 text-center text-xs md:text-sm" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                  {invoice.customer_name || invoice.customers?.name || 'نەناسراو'}
                </td>
                <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 dark:text-gray-400 text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {new Date(invoice.date).toLocaleDateString('ku')}
                </td>
                <td className="px-2 md:px-6 py-3 md:py-4 text-gray-900 dark:text-gray-200 font-bold text-center text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {formatCurrency(invoice.total)} IQD
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${
                    invoice.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                    invoice.status === 'refunded' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
                    invoice.status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                    'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                  }`} style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    {invoice.status === 'completed' ? 'تەواوکراو' :
                      invoice.status === 'refunded' ? '↩گەڕێندراوە' :
                      invoice.status === 'cancelled' ? 'هەڵوەشێنراوە' :
                      ' چاوەڕوانکراو'}
                  </span>
                </td>
                <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${
                    invoice.status === 'cancelled' || invoice.status === 'refunded' ? 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300' :
                    invoice.payment_method === 'cash' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                    invoice.payment_method === 'fib' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                    'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                  }`}>
                    {invoice.status === 'cancelled' || invoice.status === 'refunded' ? 'null' :
                      invoice.payment_method === 'cash' ? 'کاش' :
                      invoice.payment_method === 'fib' ? 'ئۆنلاین' :
                      'قەرز'}
                  </span>
                </td>
                <td className="px-2 md:px-6 py-4">
                  <div className="flex flex-row-reverse gap-2 items-start justify-center">
                    {/* بینین - Blue */}
                    <div className="flex flex-col items-center gap-1">
                      <motion.button
                        onClick={() => onView(invoice)}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="بینین"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.button>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-uni-salar)' }}>بینین</span>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <svg className="text-4xl mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    </svg>
                    <p className="text-lg" style={{ fontFamily: 'var(--font-uni-salar)' }}>
                      هیچ پسوڵەیەک نیە
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
