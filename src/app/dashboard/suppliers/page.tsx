        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {suppliers.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)).map((supplier) => (
              <div key={supplier.id} className="relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255, 255, 255, 0.3)' }}>
                    {supplier.supplier_image ? (
                      <img src={supplier.supplier_image} alt={supplier.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target.nextElementSibling as HTMLElement).style.display = 'flex' }} />
                    ) : null}
                    <span style={{ display: supplier.supplier_image ? 'none' : 'flex' }} className="text-2xl">🏢</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-uni-salar)', color: 'var(--theme-primary)' }}>{supplier.name}</h3>
                  {supplier.company && <p className="text-sm opacity-75 mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>{supplier.company}</p>}
                  <p className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>📞 {supplier.phone}</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>
                    {supplier.balance.toFixed(2)} د.ع
                  </div>
                  <div className="text-sm opacity-75" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆی گشتی قەرز</div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => openEditModal(supplier)} className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center space-x-1">
                      <FaEdit size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دەستکاری</span>
                    </button>
                    <button onClick={() => confirmDelete(supplier)} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center space-x-1">
                      <FaTrash size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>سڕینەوە</span>
                    </button>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => openHistoryModal(supplier)} className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center space-x-1">
                      <FaHistory size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>مێژوو</span>
                    </button>
                    {supplier.balance > 0 && (
                      <button onClick={() => openPaymentModal(supplier)} className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center space-x-1">
                        <FaMoneyBillWave size={14} /><span style={{ fontFamily: 'var(--font-uni-salar)', fontSize: '0.8em' }}>دانەوە</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr style={{ background: 'var(--theme-muted)' }}>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>وێنە</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>ناو</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کۆمپانیا</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>مۆبایل</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>قەرز</th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)', fontSize: '0.85em' }}>کردار</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)).map((supplier) => (
                  <tr key={supplier.id} style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                        {supplier.supplier_image ? <img src={supplier.supplier_image} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center w-full h-full text-lg">🏢</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>{supplier.name}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>{supplier.company || '-'}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>{supplier.phone}</td>
                    <td className="px-3 py-3 font-semibold" style={{ color: supplier.balance > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-uni-salar)' }}>{supplier.balance.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <div className="flex space-x-2">
                        <button onClick={() => openEditModal(supplier)} className="px-2 py-1 bg-blue-100 text-blue-600 rounded"><FaEdit size={12} /></button>
                        <button onClick={() => confirmDelete(supplier)} className="px-2 py-1 bg-red-100 text-red-600 rounded"><FaTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>هیچ دابینکەر نەدۆزرایەوە</h3>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>زیادکردنی دابینکەر</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو *</label>
                  <input type="text" value={newSupplier.name} onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="ناوی دابینکەر" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</label>
                  <input type="text" value={newSupplier.company} onChange={(e) => setNewSupplier(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="ناوی کۆمپانیا" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل *</label>
                  <input type="text" value={newSupplier.phone} onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="0750-123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                  <input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} placeholder="ناونیشان" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>وێنە</label>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleFileSelect(e, false)}
                    className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    <FaImage /> هەڵبژاردنی وێنە
                  </button>
                  {imagePreview && (
                    <div className="mt-4 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto"
                        style={{ background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.3)' }} />
                      <button onClick={() => clearImage(false)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button onClick={closeAddModal} className="px-6 py-3 rounded-lg" style={{ backgroundColor: '#6b7280', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                  پاشگەزبوونەوە
                </button>
                <button onClick={addSupplier} disabled={isUploading}
                  className="px-6 py-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff', fontFamily: 'var(--font-uni-salar)' }}>
                  {isUploading ? <><FaSpinner className="animate-spin" /> بارکردن...</> : 'زیادکردن'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSupplier && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-uni-salar)' }}>دەستکاریکردن</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناو *</label>
                  <input type="text" value={editForm.name} onChange={(e) => updateEditForm('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>کۆمپانیا</label>
                  <input type="text" value={editForm.company} onChange={(e) => updateEditForm('company', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>مۆبایل *</label>
                  <input type="text" value={editForm.phone} onChange={(e) => updateEditForm('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border" style={{ fontFamily: 'var(--font-uni-salar)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-uni-salar)' }}>ناونیشان</label>
                  <input type="text" value={editForm.address} onChange={(e) => updateEditForm('address', e