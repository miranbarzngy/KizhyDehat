'use client'

import { Unit } from '../types'
import { motion } from 'framer-motion'
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa'

interface UnitGridProps {
  units: Unit[]
  onAddUnit: () => void
  onEditUnit: (unit: Unit) => void
  onDeleteUnit: (unit: Unit) => void
}

export default function UnitGrid({ units, onAddUnit, onEditUnit, onDeleteUnit }: UnitGridProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {/* Add Unit Card */}
      <button
        onClick={onAddUnit}
        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-300/50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col items-center justify-center min-h-[180px]"
      >
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
          <FaPlus className="text-purple-600 text-xl" />
        </div>
        <h3 
          className="font-bold text-purple-700" 
          style={{ fontFamily: 'var(--font-uni-salar)' }}
        >
          زیادکردنی یەکە
        </h3>
      </button>

      {units.map(unit => (
        <motion.div 
          key={unit.id}
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg relative group"
        >
          <div className="text-4xl mb-2">⚖️</div>
          <h3 
            className="font-bold mb-1" 
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            {unit.name}
          </h3>
          {unit.symbol && (
            <p className="text-sm text-gray-500">{unit.symbol}</p>
          )}
          
          {/* Action Buttons - Always Visible & Touch Friendly */}
          <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-200/50">
            <button
              onClick={() => onEditUnit(unit)}
              className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
              title="دەستکاری"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDeleteUnit(unit)}
              className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
              title="سڕینەوە"
            >
              <FaTrash />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
