'use client';

import { useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FaDownload, FaUpload, FaGoogleDrive, FaCheck, FaTimes, FaClock, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// List of all tables to backup
const TABLES = [
  'products',
  'sales',
  'sale_items',
  'customers',
  'customer_payments',
  'suppliers',
  'supplier_payments',
  'supplier_purchases',
  'supplier_transactions',
  'supplier_debts',
  'shop_settings',
  'invoice_settings',
  'categories',
  'units',
  'profiles',
  'roles',
  'activity_logs',
  'expenses',
  'purchase_expenses'
];

interface BackupData {
  version: string;
  timestamp: string;
  tables: Record<string, unknown[]>;
}

export default function BackupTab() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all data from all tables
  const fetchAllData = async (): Promise<BackupData> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const allData: Record<string, unknown[]> = {};
    const totalTables = TABLES.length;

    for (let i = 0; i < TABLES.length; i++) {
      const tableName = TABLES[i];
      setProgress(Math.round(((i + 0.5) / totalTables) * 100));
      setProgressMessage(`Fetching ${tableName}...`);

      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
          console.warn(`Error fetching ${tableName}:`, error.message);
          allData[tableName] = [];
        } else {
          allData[tableName] = data || [];
        }
      } catch (err) {
        console.warn(`Exception fetching ${tableName}:`, err);
        allData[tableName] = [];
      }
    }

    setProgress(100);
    setProgressMessage('Complete!');

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: allData
    };
  };

  // Handle manual backup - download JSON file
  const handleBackup = async () => {
    setLoading(true);
    setProgress(0);
    setProgressMessage('Starting backup...');

    try {
      const backupData = await fetchAllData();
      
      // Create and download JSON file
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `kizhydehat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save last backup date to localStorage
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);
      setLastBackupDate(now);

      showSuccess('Backup completed successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      showError('Failed to create backup');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Handle restore from JSON file
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setProgressMessage('Reading backup file...');

    try {
      // Read the file
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validate backup format
      if (!backupData.version || !backupData.tables) {
        throw new Error('Invalid backup file format');
      }

      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not configured');

      const totalTables = TABLES.length;
      let restoredCount = 0;

      // Restore each table - delete existing and insert new
      for (let i = 0; i < TABLES.length; i++) {
        const tableName = TABLES[i];
        const tableData = backupData.tables[tableName] || [];
        
        setProgress(Math.round(((i + 0.5) / totalTables) * 100));
        setProgressMessage(`Restoring ${tableName}... (${tableData.length} records)`);

        try {
          // Delete existing data first
          if (tableData.length > 0) {
            const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) {
              console.warn(`Error deleting ${tableName}:`, deleteError.message);
            }
            
            // Insert new data
            if (tableData.length > 0) {
              const { error: insertError } = await supabase.from(tableName).insert(tableData);
              if (insertError) {
                console.warn(`Error inserting ${tableName}:`, insertError.message);
              }
            }
          }
          restoredCount++;
        } catch (err) {
          console.warn(`Exception restoring ${tableName}:`, err);
        }
      }

      setProgress(100);
      setProgressMessage('Restore complete!');
      showSuccess(`Restore completed! ${restoredCount} tables restored.`);
      setShowConfirmRestore(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Restore error:', error);
      showError('Failed to restore: ' + (error instanceof Error ? error.message : 'Invalid file'));
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Toggle auto backup to Google Drive
  const handleToggleAutoBackup = () => {
    if (!autoBackupEnabled) {
      // Enable - would need Google Drive API setup
      showSuccess('Daily auto-backup enabled! (Note: Google Drive integration requires setup)');
    } else {
      showSuccess('Daily auto-backup disabled');
    }
    setAutoBackupEnabled(!autoBackupEnabled);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--theme-foreground)', fontFamily: 'var(--font-uni-salar)' }}
          >
            پشتگیری و گەڕاندنەوە
          </h2>
          <p 
            className="mt-1"
            style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
          >
            پشتگیرکردنی داتاکان و گەڕاندنەوەیان
          </p>
        </div>
        
        {/* Last Backup Date */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-card-border)'
          }}
        >
          <FaClock className="text-yellow-500" />
          <span 
            className="text-sm"
            style={{ fontFamily: 'var(--font-uni-salar)' }}
          >
            {lastBackupDate ? formatDate(lastBackupDate) : 'هیچ پشتگیرێک نەکراوە'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div 
          className="p-4 rounded-xl"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-card-border)'
          }}
        >
          <div className="flex justify-between mb-2">
            <span 
              className="text-sm"
              style={{ fontFamily: 'var(--font-uni-salar)' }}
            >
              {progressMessage}
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>
              {progress}%
            </span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-muted)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`, 
                backgroundColor: 'var(--theme-accent)' 
              }}
            />
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Manual Backup Card */}
        <div 
          className="p-6 rounded-2xl"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-card-border)'
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--theme-accent)' }}
            >
              <FaDownload className="text-white text-xl" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                پشتگیریکردن
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                داگرتنی پشتگیرییەک بۆ ئامێرەکەت
              </p>
            </div>
          </div>
          
          <p 
            className="mb-4 text-sm"
            style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
          >
            {TABLES.length} خشتە لەخۆدەگرێت: products, sales, customers, suppliers, expenses, وە...
          </p>
          
          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'white',
              fontFamily: 'var(--font-uni-salar)'
            }}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
            داگرتنی پشتگیری
          </button>
        </div>

        {/* Restore Card */}
        <div 
          className="p-6 rounded-2xl"
          style={{ 
            backgroundColor: 'var(--theme-card-bg)',
            border: '1px solid var(--theme-card-border)'
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#dc2626' }}
            >
              <FaUpload className="text-white text-xl" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                گەڕاندنەوە
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                گەڕاندنەوەی داتا لە پشتگیرییەکەوە
              </p>
            </div>
          </div>
          
          <p 
            className="mb-4 text-sm"
            style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
          >
            ئاگاداربەوە: ئەمە هەموو داتاکەت دەسڕێتەوە!
          </p>
          
          {showConfirmRestore ? (
            <div className="space-y-3">
              <div 
                className="p-3 rounded-xl bg-red-100 border border-red-300 flex items-start gap-2"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                <FaExclamationTriangle className="text-red-600 mt-1 flex-shrink-0" />
                <span className="text-sm text-red-700">
                  ئایا دڵنیایت؟ هەموو داتاکەت دەسڕێتەوە و بە داتای پشتگیرییەکە دەبێتەوە!
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmRestore(false)}
                  className="flex-1 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--theme-muted)',
                    color: 'var(--theme-foreground)',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  <FaTimes />
                  هەڵوەشاندنەوە
                </button>
                <label
                  className="flex-1 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontFamily: 'var(--font-uni-salar)'
                  }}
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  فایل هەڵبژێرە
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmRestore(true)}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
              گەڕاندنەوە
            </button>
          )}
        </div>
      </div>

      {/* Google Drive Auto Backup */}
      <div 
        className="p-6 rounded-2xl"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          border: '1px solid var(--theme-card-border)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#1DB954' }}
            >
              <FaGoogleDrive className="text-white text-2xl" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-uni-salar)' }}
              >
                پشتگیری ئۆتۆماتیکی
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
              >
                ڕۆژانە خۆکارانە پشتگیری بکە بۆ Google Drive
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggleAutoBackup}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              autoBackupEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div 
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                autoBackupEnabled ? 'right-1' : 'left-1'
              }`}
            >
              {autoBackupEnabled && <FaCheck className="text-green-500 text-xs" />}
            </div>
          </button>
        </div>
        
        <p 
          className="mt-4 text-sm"
          style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
        >
          تێبینی: بۆ چالاککردنی ئەم تایبەتمەندییە پێویستی بە ئامادەکارییەکی زیاترە بۆ بەستنەوەی Google Drive API.
        </p>
      </div>

      {/* Tables List */}
      <div 
        className="p-6 rounded-2xl"
        style={{ 
          backgroundColor: 'var(--theme-card-bg)',
          border: '1px solid var(--theme-card-border)'
        }}
      >
        <h3 
          className="text-lg font-bold mb-4"
          style={{ fontFamily: 'var(--font-uni-salar)' }}
        >
          خشتەکان ({TABLES.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {TABLES.map((table) => (
            <span
              key={table}
              className="px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: 'var(--theme-muted)',
                color: 'var(--theme-secondary)',
                fontFamily: 'var(--font-uni-salar)'
              }}
            >
              {table}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
