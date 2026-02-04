'use client'

import { formatCurrency, toEnglishDigits } from '@/lib/numberUtils'
import { FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

interface InvoiceItem {
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

interface InvoiceData {
  invoiceNumber: number
  customerName: string
  customerPhone?: string
  sellerName?: string
  date: string
  time: string
  paymentMethod: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  shopName: string
  shopPhone?: string
  shopAddress?: string
  shopLogo?: string
  qrCodeUrl?: string
  thankYouNote: string
}

interface InvoiceTemplateProps {
  data: InvoiceData
  isPrint?: boolean
  className?: string
}

export default function InvoiceTemplate({ data, isPrint = false, className = "" }: InvoiceTemplateProps) {
  const containerClasses = isPrint
    ? "w-full max-w-sm mx-auto bg-white"
    : `w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ${className}`

  const getPaymentStatus = () => {
    switch (data.paymentMethod) {
      case 'cash': return 'نەختینە'
      case 'fib': return 'ئۆنلاین (FIB)'
      case 'debt': return 'قەرز'
      default: return 'نەپارەدراو'
    }
  }

  return (
    <div className={containerClasses} style={{ fontFamily: 'var(--font-uni-salar)', direction: 'rtl' }} data-invoice-ref>
      <div className={isPrint ? "p-4" : "p-8"}>
        {/* Header Section */}
        <div className="text-center mb-6">
          {/* Shop Logo - Circular */}
          {data.shopLogo && (
            <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
              <img
                src={data.shopLogo}
                alt={data.shopName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Shop Name */}
          <h1 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>
            {data.shopName}
          </h1>

          {/* Shop Contact Info */}
          <div className="space-y-1 text-sm text-black">
            {data.shopPhone && (
              <div className="flex items-center justify-center gap-2">
                <FaPhone className="text-gray-400" size={12} />
                <span>{data.shopPhone}</span>
              </div>
            )}
            {data.shopAddress && (
              <div className="flex items-center justify-center gap-2">
                <FaMapMarkerAlt className="text-gray-400" size={12} />
                <span>{data.shopAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="text-center mb-4 text-gray-400 text-xl">--------------------------</div>

        {/* Information Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Right Column */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="font-semibold text-black space-y-1">
                  <div>ژمارەی فاکتور</div>
                  <div className="font-mono font-bold text-black text-lg" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    #{toEnglishDigits(data.invoiceNumber.toString())}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-black space-y-1">
                  <div>کڕیار</div>
                  <div className="font-bold text-black text-sm min-w-[150px] break-words">
                    {data.customerName}
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="font-semibold text-black space-y-1">
                  <div>بەروار/کات</div>
                  <div className="font-mono text-black text-sm" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    {data.date}
                  </div>
                  <div className="font-mono text-black text-xs" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    {data.time}
                  </div>
                </div>
              </div>
              {data.customerPhone && (
                <div className="text-center">
                  <div className="font-semibold text-black space-y-1">
                    <div>تەلەفۆن</div>
                    <div className="font-mono text-black text-sm" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                      {data.customerPhone}
                    </div>
                  </div>
                </div>
              )}
              {data.sellerName && (
                <div className="text-center">
                  <div className="font-semibold text-black space-y-1">
                    <div>فرۆشیار</div>
                    <div className="font-bold text-black text-sm min-w-[150px] break-words">
                      {data.sellerName}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method - Full Width */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-center">
              <div className="font-semibold text-black space-y-1">
                <div>شێوازی پارەدان</div>
                <div className="font-bold text-black text-lg">
                  {getPaymentStatus()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="text-center mb-4 text-gray-400 text-xl">--------------------------</div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-right font-bold text-black">
                  ناوی کاڵا
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-black">
                  یەکە
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-black">
                  بڕ
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-black">
                  نرخ
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium max-w-[140px] truncate">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                    {item.unit}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono font-bold" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    {toEnglishDigits(item.quantity.toString())}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono font-bold" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Separator */}
        <div className="text-center mb-4 text-gray-400 text-xl">--------------------------</div>

        {/* Footer Section */}
        <div className="space-y-4">
          {/* Financial Summary */}
          <div className="border-t-2 border-gray-300 pt-3">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="font-semibold text-black">کۆی نرخ:</span>
              <span className="font-mono text-black" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                {formatCurrency(data.subtotal)} IQD
              </span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="font-semibold text-black">داشکاندن:</span>
              <span className="font-mono font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                -{formatCurrency(data.discount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-black">کۆی گشتی:</span>
              <span className="font-mono text-black" style={{ fontFamily: 'Inter, sans-serif', direction: 'ltr' }}>
                {formatCurrency(data.total)} IQD
              </span>
            </div>
          </div>

          {/* Grand Total Highlight */}
          <div className="text-black text-center py-3 px-4 text-xl font-bold">
            کۆی گشتی: {formatCurrency(data.total)} IQD
          </div>

          {/* QR Code */}
          {data.qrCodeUrl && (
            <div className="text-center my-4">
              <img
                src={data.qrCodeUrl}
                alt="QR Code"
                className="w-16 h-16 mx-auto"
              />
            </div>
          )}

          {/* Thank You Note */}
          <div className="text-center text-sm text-black italic border-t border-gray-200 pt-3">
            {data.thankYouNote}
          </div>

          {/* Developer Branding */}
          <div className="text-center text-xs text-black border-t border-gray-200 pt-2">
            گەشەپێدانی سیستم لە لایەن Click Group<br />
            07701466787
          </div>
        </div>
      </div>
    </div>
  )
}