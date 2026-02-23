// Google Drive API utility functions for backup functionality

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

// Check if Google Client ID is configured
export function isGoogleDriveConfigured(): boolean {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return !!clientId && clientId !== 'your-google-client-id.apps.googleusercontent.com';
}

// Get the POS_Backups folder ID, create if doesn't exist
async function getOrCreateBackupsFolder(accessToken: string): Promise<string | null> {
  try {
    // First, try to find existing folder
    const searchResponse = await fetch(
      `${GOOGLE_DRIVE_API}/files?q=name='POS_Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Failed to search for folder:', await searchResponse.text());
      return null;
    }

    const searchData = await searchResponse.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create the folder if it doesn't exist
    const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'POS_Backups',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      console.error('Failed to create folder:', await createResponse.text());
      return null;
    }

    const createData = await createResponse.json();
    return createData.id;
  } catch (error) {
    console.error('Error getting/creating backups folder:', error);
    return null;
  }
}

// Upload backup JSON to Google Drive
export async function uploadBackupToDrive(
  jsonData: object,
  accessToken: string
): Promise<{ success: boolean; error?: string; fileId?: string }> {
  try {
    // Get or create the backups folder
    const folderId = await getOrCreateBackupsFolder(accessToken);
    if (!folderId) {
      return { success: false, error: 'Failed to get or create backups folder' };
    }

    // Create the file metadata
    const date = new Date().toISOString().split('T')[0];
    const fileName = `pos-auto-backup-${date}.json`;
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Create multipart request body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const metadataString = JSON.stringify(metadata);
    
    // Create the multipart request
    const requestBody = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataString +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonString +
      closeDelimiter;

    // Use multipart upload endpoint
    const uploadResponse = await fetch(
      `${GOOGLE_UPLOAD_API}/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: new Blob([requestBody], { type: 'multipart/related' }),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload backup:', errorText);
      return { success: false, error: `Upload failed: ${errorText}` };
    }

    const uploadData = await uploadResponse.json();
    
    return { 
      success: true, 
      fileId: uploadData.id 
    };
  } catch (error) {
    console.error('Error uploading backup to Google Drive:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Check if it's a new day since last backup
export function isNewDay(lastBackupDate: string | null): boolean {
  if (!lastBackupDate) return true;
  
  const lastDate = new Date(lastBackupDate);
  const today = new Date();
  
  return (
    lastDate.getFullYear() !== today.getFullYear() ||
    lastDate.getMonth() !== today.getMonth() ||
    lastDate.getDate() !== today.getDate()
  );
}

// Save access token to localStorage
export function saveGoogleToken(accessToken: string): void {
  localStorage.setItem('googleDriveToken', accessToken);
  localStorage.setItem('googleDriveTokenExpiry', Date.now().toString());
}

// Get access token from localStorage
export function getGoogleToken(): string | null {
  const token = localStorage.getItem('googleDriveToken');
  const expiry = localStorage.getItem('googleDriveTokenExpiry');
  
  if (!token || !expiry) return null;
  
  // Check if token is expired (assuming 1 hour expiry for safety)
  const expiryTime = parseInt(expiry);
  const oneHour = 60 * 60 * 1000;
  
  if (Date.now() - expiryTime > oneHour) {
    // Token might be expired, clear it
    localStorage.removeItem('googleDriveToken');
    localStorage.removeItem('googleDriveTokenExpiry');
    return null;
  }
  
  return token;
}

// Clear Google token from localStorage
export function clearGoogleToken(): void {
  localStorage.removeItem('googleDriveToken');
  localStorage.removeItem('googleDriveTokenExpiry');
}

// Check if auto-backup is enabled
export function isAutoBackupEnabled(): boolean {
  return localStorage.getItem('autoBackupEnabled') === 'true';
}

// Enable/disable auto-backup
export function setAutoBackupEnabled(enabled: boolean): void {
  localStorage.setItem('autoBackupEnabled', enabled.toString());
}

// Get last backup date from localStorage
export function getLastBackupDate(): string | null {
  return localStorage.getItem('lastBackupDate');
}

// Save last backup date to localStorage
export function setLastBackupDate(date: string): void {
  localStorage.setItem('lastBackupDate', date);
}
