'use client';

import { useToast } from '@/components/Toast';
import {
  clearGoogleToken,
  getGoogleToken,
  getLastBackupDate,
  isAutoBackupEnabled,
  isGoogleDriveConfigured,
  isNewDay,
  saveGoogleToken,
  setLastBackupDate as saveLastBackupDate,
  setAutoBackupEnabled,
  uploadBackupToDrive
} from '@/lib/googleDrive';
import { getSupabase } from '@/lib/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCheck, FaClock, FaDownload, FaExclamationTriangle, FaGoogleDrive, FaLink, FaSpinner, FaTimes, FaUnlink, FaUpload } from 'react-icons/fa';

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
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Google OAuth - this needs to be called with client ID
  useEffect(() => {
    const initGoogle = async () => {
      // Check if Google Drive is configured
      const isConfigured = isGoogleDriveConfigured();
      if (!isConfigured) {
        setIsInitializing(false);
        return;
      }

      // Get client ID from env
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (clientId) {
        setGoogleClientId(clientId);
        
        // Check if we have a valid token
        const token = getGoogleToken();
        if (token) {
          setAccessToken(token);
          setIsGoogleConnected(true);
        }
      }
      setIsInitializing(false);
    };

    initGoogle();

    // Load saved states
    const savedLastBackup = getLastBackupDate();
    if (savedLastBackup) {
      setLastBackupDate(savedLastBackup);
    }
    
    const savedAutoBackup = isAutoBackupEnabled();
    setAutoBackupEnabledState(savedAutoBackup);
  }, []);

  // Handle Google sign in
  const handleGoogleSignIn = useCallback(async () => {
    if (!googleClientId) {
      showError('Google Client ID not configured');
      return;
    }

    try {
      // Open Google OAuth popup with token response
      const scope = 'https://www.googleapis.com/auth/drive.file';
      const redirectUri = window.location.origin; // Use current origin for redirect
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', googleClientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('state', 'google_drive_auth');
      
      // Open popup centered on screen
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl.toString(),
        'Connect Google Drive',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        showError('Please allow popups to connect to Google Drive');
        return;
      }

      // Listen for the token - check popup URL periodically
      const checkToken = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkToken);
            return;
          }
          
          // Get the URL from popup
          const popupUrl = popup.location.href;
          
          // Check if we've been redirected back with token
          if (popupUrl.includes('access_token=')) {
            const urlParams = new URL(popupUrl).hash.substring(1).split('&');
            const tokenParam = urlParams.find(p => p.startsWith('access_token='));
            const expiresInParam = urlParams.find(p => p.startsWith('expires_in='));
            
            if (tokenParam) {
              const token = tokenParam.split('=')[1];
              const expiresIn = expiresInParam ? parseInt(expiresInParam.split('=')[1]) : 3600;
              
              // Save token with expiry
              saveGoogleToken(token);
              setAccessToken(token);
              setIsGoogleConnected(true);
              
              popup.close();
              clearInterval(checkToken);
              showSuccess('Successfully connected to Google Drive!');
            }
          }
          
          // Check if redirected with error
          if (popupUrl.includes('error=')) {
            popup.close();
            clearInterval(checkToken);
            showError('Failed to connect to Google Drive');
          }
        } catch (e) {
          // Cross-origin error - popup is on Google domain, this is expected
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkToken);
        if (popup && !popup.closed) {
          popup.close();
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      showError('Failed to connect to Google Drive');
    }
  }, [googleClientId, showSuccess, showError]);

  // Handle Google sign out
  const handleGoogleSignOut = useCallback(() => {
    clearGoogleToken();
    setAccessToken(null);
    setIsGoogleConnected(false);
    showSuccess('Disconnected from Google Drive');
  }, [showSuccess]);

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

  // Upload backup to Google Drive
  const uploadToGoogleDrive = async (backupData: BackupData) => {
    if (!accessToken) {
      showError('Not connected to Google Drive');
      return false;
    }

    const result = await uploadBackupToDrive(backupData, accessToken);
    
    if (result.success) {
      const now = new Date().toISOString();
      saveLastBackupDate(now);
      setLastBackupDate(now);
      showSuccess('Backup uploaded to Google Drive successfully!');
      return true;
    } else {
      showError(`Failed to upload backup: ${result.error}`);
      return false;
    }
  };

  // Handle manual backup - download JSON file
  const handleBackup = async (uploadToDrive: boolean = false) => {
    setLoading(true);
    setProgress(0);
    setProgressMessage('Starting backup...');

    try {
      const backupData = await fetchAllData();
      
      // If Google Drive upload requested
      if (uploadToDrive && accessToken) {
        await uploadToGoogleDrive(backupData);
      } else {
        // Download as JSON file
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
        saveLastBackupDate(now);
        setLastBackupDate(now);

        showSuccess('Backup completed successfully!');
      }
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
      // Check if Google is connected first
      if (!isGoogleConnected || !accessToken) {
        showError('Please connect to Google Drive first');
        return;
      }
      setAutoBackupEnabled(true);
      setAutoBackupEnabledState(true);
      showSuccess('Daily auto-backup enabled!');
    } else {
      setAutoBackupEnabled(false);
      setAutoBackupEnabledState(false);
      showSuccess('Daily auto-backup disabled');
    }
  };

  // Check for auto-backup on mount (for admin login)
  useEffect(() => {
    const checkAutoBackup = async () => {
      if (autoBackupEnabled && isGoogleConnected && accessToken) {
        const lastBackup = getLastBackupDate();
        if (isNewDay(lastBackup)) {
          console.log('New day detected, running auto-backup...');
          await handleBackup(true);
        }
      }
    };

    // Only run after initialization
    if (!isInitializing) {
      checkAutoBackup();
    }
  }, [isInitializing, autoBackupEnabled, isGoogleConnected, accessToken]);

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

  // Loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-12">
        <FaSpinner className="animate-spin text-3xl" style={{ color: 'var(--theme-accent)' }} />
      </div>
    );
  }

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
          
          <div className="space-y-2">
            <button
              onClick={() => handleBackup(false)}
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
            
            {isGoogleConnected && (
              <button
                onClick={() => handleBackup(true)}
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{
                  backgroundColor: '#1DB954',
                  color: 'white',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaGoogleDrive />}
                داگرتنی  فایلی پشتگیری بۆ Google Drive
              </button>
            )}
          </div>
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
            disabled={!isGoogleConnected}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              autoBackupEnabled ? 'bg-green-500' : 'bg-gray-300'
            } ${!isGoogleConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        
        {/* Google Connection Status */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--theme-card-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGoogleConnected ? (
                <>
                  <FaCheck className="text-green-500" />
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    بەستراوە بە Google Drive
                  </span>
                </>
              ) : (
                <>
                  <FaTimes className="text-red-500" />
                  <span style={{ fontFamily: 'var(--font-uni-salar)' }}>
                    نەبەستراوە
                  </span>
                </>
              )}
            </div>
            
            {isGoogleConnected ? (
              <button
                onClick={handleGoogleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: 'var(--theme-muted)',
                  color: 'var(--theme-foreground)',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <FaUnlink />
                پەیوەندی ببڕە
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={!googleClientId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#1DB954',
                  color: 'white',
                  fontFamily: 'var(--font-uni-salar)'
                }}
              >
                <FaLink />
                پەیوەندی بکە
              </button>
            )}
          </div>
          
          {!googleClientId && (
            <p 
              className="mt-2 text-sm"
              style={{ color: 'var(--theme-secondary)', fontFamily: 'var(--font-uni-salar)' }}
            >
              تێبینی: پێویستە NEXT_PUBLIC_GOOGLE_CLIENT_ID لە .env.local دابنێیت بۆ چالاککردنی ئەم تایبەتمەندییە.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
