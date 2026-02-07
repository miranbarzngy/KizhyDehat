'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Employee {
  id: string
  name: string
  salary: number
}

interface PayrollEntry {
  id: string
  employee_id: string
  month: number
  year: number
  status: string
  paid_amount: number
  employee?: {
    name: string
    salary: number
  }
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showGeneratePayroll, setShowGeneratePayroll] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    salary: 0
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchEmployees()
    fetchPayrollEntries()
  }, [])

  const fetchEmployees = async () => {
    // Demo mode: show sample employees data when Supabase is not configured
    if (!supabase) {
      const demoEmployees: Employee[] = [
        { id: '1', name: 'ئەحمەد ساڵح', salary: 800.00 },
        { id: '2', name: 'فاطمە محەمەد', salary: 750.00 },
        { id: '3', name: 'کەریم عەلی', salary: 900.00 },
        { id: '4', name: 'سارا ئیبراهیم', salary: 650.00 }
      ]
      setEmployees(demoEmployees)
      return
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchPayrollEntries = async () => {
    // Demo mode: show sample payroll entries when Supabase is not configured
    if (!supabase) {
      const demoPayrollEntries: PayrollEntry[] = [
        {
          id: '1',
          employee_id: '1',
          month: 1,
          year: 2024,
          status: 'paid',
          paid_amount: 800.00,
          employee: { name: 'ئەحمەد ساڵح', salary: 800.00 }
        },
        {
          id: '2',
          employee_id: '2',
          month: 1,
          year: 2024,
          status: 'paid',
          paid_amount: 750.00,
          employee: { name: 'فاطمە محەمەد', salary: 750.00 }
        },
        {
          id: '3',
          employee_id: '3',
          month: 1,
          year: 2024,
          status: 'pending',
          paid_amount: 0,
          employee: { name: 'کەریم عەلی', salary: 900.00 }
        }
      ]
      setPayrollEntries(demoPayrollEntries)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            name,
            salary
          )
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) throw error
      setPayrollEntries(data || [])
    } catch (error) {
      console.error('Error fetching payroll entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.position || !newEmployee.salary) {
      alert('تکایە هەموو زانیارییەکان پڕبکەرەوە')
      return
    }

    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت کارمەند زیاد بکرێت')
      return
    }

    try {
      const { error } = await supabase
        .from('employees')
        .insert(newEmployee)

      if (error) throw error

      setShowAddEmployee(false)
      setNewEmployee({ name: '', position: '', salary: 0 })
      fetchEmployees()
    } catch (error) {
      console.error('Error adding employee:', error)
      alert('Error adding employee')
    }
  }

  const generatePayroll = async () => {
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت مووچەی مانگانە دروست بکرێت')
      return
    }

    try {
      const payrollData = employees.map(employee => ({
        employee_id: employee.id,
        month: selectedMonth,
        year: selectedYear,
        status: 'pending',
        paid_amount: 0
      }))

      const { error } = await supabase
        .from('payroll')
        .insert(payrollData)

      if (error) throw error

      setShowGeneratePayroll(false)
      fetchPayrollEntries()
    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Error generating payroll')
    }
  }

  const markAsPaid = async (payrollId: string, employeeId: string, amount: number) => {
    if (!supabase) {
      alert('دۆخی دیمۆ: ناتوانرێت مووچە وەک پارەدراو نیشان بدرێت')
      return
    }

    try {
      // Update payroll status
      const { error: payrollError } = await supabase
        .from('payroll')
        .update({
          status: 'paid',
          paid_amount: amount
        })
        .eq('id', payrollId)

      if (payrollError) throw payrollError

      // Add to expenses
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description: `مووچەی ${employees.find(e => e.id === employeeId)?.name}`,
          amount,
          date: new Date().toISOString().split('T')[0],
          category: 'مووچە'
        })

      if (expenseError) throw expenseError

      fetchPayrollEntries()
    } catch (error) {
      console.error('Error marking payroll as paid:', error)
      alert('Error marking payroll as paid')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">بەڕێوەبردنی مووچە</h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={() => setShowAddEmployee(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          زیادکردنی کارمەند
        </button>
        <button
          onClick={() => setShowGeneratePayroll(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          دروستکردنی مووچەی مانگانە
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employees */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">کارمەندان</h2>
          <div className="space-y-3">
            {employees.map((employee) => (
              <div key={employee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <h3 className="font-medium">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.salary.toFixed(2)} د.ع / مانگ</p>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-gray-500 text-center py-4">هیچ کارمەندێک نیە</p>
            )}
          </div>
        </div>

        {/* Payroll Entries */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">تۆمارەکانی مووچە</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {payrollEntries.map((entry) => (
              <div key={entry.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{entry.employee?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {entry.month}/{entry.year} - {entry.status === 'paid' ? 'پارەدراو' : 'چاوەڕوان'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{entry.employee?.salary.toFixed(2)} د.ع</p>
                    {entry.status === 'pending' && (
                      <button
                        onClick={() => markAsPaid(entry.id, entry.employee_id, entry.employee?.salary || 0)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 mt-1"
                      >
                        پارەدان
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {payrollEntries.length === 0 && (
              <p className="text-gray-500 text-center py-4">هیچ تۆمارێکی مووچە نیە</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">زیادکردنی کارمەند</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ناو"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="number"
                step="0.01"
                placeholder="مووچەی مانگانە"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={addEmployee}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                زیادکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGeneratePayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">دروستکردنی مووچەی مانگانە</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">مانگ</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      مانگی {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ساڵ</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowGeneratePayroll(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={generatePayroll}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                دروستکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}