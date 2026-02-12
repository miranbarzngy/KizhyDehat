'use client'

import AddItemModal from '@/components/inventory/AddItemModal'
import ArchiveGrid from '@/components/inventory/ui/ArchiveGrid'
import CategoryGrid from '@/components/inventory/ui/CategoryGrid'
import ProductGrid from '@/components/inventory/ui/ProductGrid'
import UnitGrid from '@/components/inventory/ui/UnitGrid'
import { useSyncPause } from '@/contexts/SyncPauseContext'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { FaArchive, FaBox, FaCalculator, FaSearch, FaTags, FaTrash } from 'react-icons/fa'
import { useInventoryData } from '@/components/inventory/useInventoryData'

export default function InventoryPage() {
  const { pauseSync } = useSyncPause()
  const {
    activeTab, products, categories, units, suppliers, archivedItems, searchTerm, selectedCategory,
    currentStep, showStockEntry, editingItem, formData, showDeleteConfirm, itemToDelete,
    deleteStatus, deleteMessage, soldProductIds, showCategoryModal, showUnitModal,
    newCategoryName, newUnitName, newUnitSymbol, editingCategory, editingUnit,
    setActiveTab, setSearchTerm, setSelectedCategory, setCurrentStep, setShowStockEntry,
    setFormData, setShowDeleteConfirm, setItemToDelete, setShowCategoryModal, setShowUnitModal,
    setNewCategoryName, setNewUnitName, setNewUnitSymbol, setEditingCategory, setEditingUnit,
    fetchAll, fetchProducts, fetchArchivedItems, fetchCategories, fetchUnits, fetchSuppliers,
    openAddItem, openEditItem, confirmDelete, executeDelete, archiveItem, restoreItem,
    handleAddCategory, handleEditCategory, handleDeleteCategory, saveCategory,
    handleAddUnit, handleEditUnit, handleDeleteUnit, saveUnit, filteredProducts
  } = useInventoryData()

  useEffect(() => { fetchAll() }, [fetchAll])

  const tabs = [
    { id: 'inventory', label: 'کاڵاکان', icon: FaBox, color: 'blue' },
    { id: 'categories', label: 'پۆلەکان', icon: FaTags, color: 'green' },
    { id: 'units', label: 'یەکەکان', icon: FaCalculator, color: 'purple' },
    { id: 'archive', label: 'ئەرشیڤ', icon: FaArchive, color: 'orange' }
  ]

  return (
    <div className="p-6 pl-0 md:pl-6">
      <div className="w-full max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-4xl font-bold mb-8"
          style={{ 
            color: 'var(--theme-foreground)',
            fontFamily: 'var(--font-uni-salar)' 
          }}
        >
          بەڕێوەبردنی کاڵاکان
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 mb-8 backdrop-blur-xl border shadow-sm rounded-2xl p-2 transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
        >
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); if (tab.id === 'archive') fetchArchivedItems() }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2`}
              style={{ 
                fontFamily: 'var(--font-uni-salar)',
                background: activeTab === tab.id ? 'var(--theme-accent)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--theme-secondary)'
              }}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {activeTab === 'inventory' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col md:flex-row gap-4 mb-6"
            >
              <div className="flex-1 relative">
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-secondary)' }} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="گەڕان..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all"
                  style={{ 
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)'
                  }} 
                />
              </div>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-xl border shadow-sm focus:ring-2 outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <option value="">هەموو پۆلەکان</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </motion.div>
            <ProductGrid 
              products={filteredProducts} 
              soldProductIds={soldProductIds} 
              openEditItem={openEditItem} 
              confirmDelete={confirmDelete} 
              archiveItem={archiveItem} 
              onAddProduct={openAddItem} 
            />
          </>
        )}

        {activeTab === 'categories' && (
          <CategoryGrid 
            categories={categories} 
            products={products} 
            onAddCategory={handleAddCategory} 
            onEditCategory={handleEditCategory} 
            onDeleteCategory={handleDeleteCategory} 
          />
        )}

        {activeTab === 'units' && (
          <UnitGrid 
            units={units} 
            onAddUnit={handleAddUnit} 
            onEditUnit={handleEditUnit} 
            onDeleteUnit={handleDeleteUnit} 
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveGrid 
            archivedItems={archivedItems} 
            searchTerm={searchTerm} 
            restoreItem={restoreItem} 
            confirmDelete={confirmDelete} 
          />
        )}

        <AddItemModal 
          showStockEntry={showStockEntry} 
          setShowStockEntry={setShowStockEntry} 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep} 
          editingItem={editingItem} 
          formData={formData} 
          setFormData={setFormData} 
          suppliers={suppliers} 
          units={units} 
          onSuccess={fetchProducts} 
        />

        {/* Delete Modal */}
        {showDeleteConfirm && itemToDelete && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <FaTrash className="text-3xl" style={{ color: '#ef4444' }} />
                </div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ 
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  سڕینەوە
                </h3>
                <p 
                  className="mb-6"
                  style={{ 
                    color: 'var(--theme-secondary)',
                    fontFamily: 'var(--font-uni-salar)' 
                  }}
                >
                  دڵنیایت لە سڕینەوەی <span className="font-bold" style={{ color: 'var(--theme-foreground)' }}>{itemToDelete.name}</span>؟
                </p>
                {deleteStatus === 'idle' && (
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)} 
                      className="px-6 py-3 rounded-xl font-bold transition-all"
                      style={{ 
                        backgroundColor: 'var(--theme-muted)',
                        color: 'var(--theme-foreground)',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      پاشگەزبوونەوە
                    </button>
                    <button 
                      onClick={() => { pauseSync('inventory-delete'); executeDelete() }} 
                      className="px-6 py-3 rounded-xl font-bold transition-all"
                      style={{ 
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontFamily: 'var(--font-uni-salar)'
                      }}
                    >
                      سڕینەوە
                    </button>
                  </div>
                )}
                {deleteStatus === 'deleting' && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-4 rounded-full mx-auto mb-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
                    <p style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}>...</p>
                  </div>
                )}
                {deleteStatus === 'success' && (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-bold" style={{ color: '#22c55e', fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p>
                  </div>
                )}
                {deleteStatus === 'error' && (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">❌</div>
                    <p className="font-bold" style={{ color: '#ef4444', fontFamily: 'var(--font-uni-salar)' }}>{deleteMessage}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ 
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)' 
                }}
              >
                {editingCategory ? 'دەستکاری' : 'زیادکردن'}
              </h3>
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                placeholder="ناوی پۆل"
                className="w-full px-4 py-3 rounded-xl border mb-4 focus:ring-2 outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              />
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setShowCategoryModal(false)} 
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  پاشگەزبوونەوە
                </button>
                <button 
                  onClick={saveCategory} 
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ 
                    backgroundColor: '#22c55e',
                    color: '#ffffff',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {editingCategory ? 'نوێکردنەوە' : 'زیادکردن'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Unit Modal */}
        {showUnitModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
              style={{ 
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ 
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)' 
                }}
              >
                {editingUnit ? 'دەستکاری' : 'زیادکردن'}
              </h3>
              <input 
                type="text" 
                value={newUnitName} 
                onChange={e => setNewUnitName(e.target.value)} 
                placeholder="ناوی یەکە"
                className="w-full px-4 py-3 rounded-xl border mb-4 focus:ring-2 outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              />
              <input 
                type="text" 
                value={newUnitSymbol} 
                onChange={e => setNewUnitSymbol(e.target.value)} 
                placeholder="هێڵکاری"
                className="w-full px-4 py-3 rounded-xl border mb-4 focus:ring-2 outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--theme-muted)',
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              />
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setShowUnitModal(false)} 
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ 
                    backgroundColor: 'var(--theme-muted)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  پاشگەزبوونەوە
                </button>
                <button 
                  onClick={saveUnit} 
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ 
                    backgroundColor: 'var(--theme-accent)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {editingUnit ? 'نوێکردنەوە' : 'زیادکردن'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
