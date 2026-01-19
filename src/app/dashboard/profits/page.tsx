'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfitItem {
  id: string
  item_name: string
  quantity: number
  price: number
  cost_price: number
  profit: number
  date: string
}

export default function ProfitsPage() {
  const [profits, setProfits] = useState<ProfitItem[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchProfits()
  }, [dateFrom, dateTo])

  const fetchProfits = async () => {
    // Demo mode: show sample profit data when Supabase is not configured
    if (!supabase) {
      const demoProfits: ProfitItem[] = [
        {
          id: '1',
          item_name: 'برنج',
          quantity: 5,
          price: 18.00,
          cost_price: 15.50,
          profit: 12.50,
          date: '2024-01-15'
        },
        {
          id: '2',
          item_name: 'شەکر',
          quantity: 3,
          price: 14.50,
          cost_price: 12.00,
          profit: 7.50,
          date: '2024-01-15'
        },
        {
          id: '3',
          item_name: 'چای',
          quantity: 10,
          price: 10.00,
          cost_price: 8.50,
          profit: 15.00,
          date: '2024-01-14'
        },
        {
          id: '4',
          item_name: 'گۆشت',
          quantity: 2,
          price: 35.00,
          cost_price: 28.00,
          profit: 14.00,
          date: '2024-01-14'
        }
      ]

      // Filter by date range if specified
      let filteredProfits = demoProfits
      if (dateFrom) {
        filteredProfits = filteredProfits.filter(item => item.date >= dateFrom)
      }
      if (dateTo) {
        filteredProfits = filteredProfits.filter(item => item.date <= dateTo)
      }

      setProfits(filteredProfits)
      setTotalProfit(filteredProfits.reduce((sum, item) => sum + item.profit, 0))
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          price,
          cost_price,
          sales!inner(date),
          inventory!inner(item_name)
        `)

      if (dateFrom) {
        query = query.gte('sales.date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('sales.date', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      const profitData: ProfitItem[] = (data || []).map((item: any) => ({
        id: item.id,
        item_name: item.inventory[0].item_name,
        quantity: item.quantity,
        price: item.price,
        cost_price: item.cost_price,
        profit: (item.price - item.cost_price) * item.quantity,
        date: item.sales[0].date
      }))

      setProfits(profitData)
      setTotalProfit(profitData.reduce((sum, item) => sum + item.profit, 0))
    } catch (error) {
      console.error('Error fetching profits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center">چاوەڕوانبە...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ڕاپۆرتی قازانج</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">لە بەروار</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">بۆ بەروار</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              پاککردنەوە
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-green-600">
          کۆی قازانج: {totalProfit.toFixed(2)} د.ع
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">وردەکارییەکان</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-right">ناوی کاڵا</th>
                <th className="px-4 py-2 text-right">کۆگا</th>
                <th className="px-4 py-2 text-right">نرخی فرۆشتن</th>
                <th className="px-4 py-2 text-right">نرخی کڕین</th>
                <th className="px-4 py-2 text-right">قازانج</th>
                <th className="px-4 py-2 text-right">بەروار</th>
              </tr>
            </thead>
            <tbody>
              {profits.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.item_name}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.price.toFixed(2)} د.ع</td>
                  <td className="px-4 py-2">{item.cost_price.toFixed(2)} د.ع</td>
                  <td className={`px-4 py-2 font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit.toFixed(2)} د.ع
                  </td>
                  <td className="px-4 py-2">{item.date}</td>
                </tr>
              ))}
              {profits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    هیچ فرۆشتنێک نیە
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
