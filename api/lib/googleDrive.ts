import { google } from 'googleapis';

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

let driveClient: any = null;

function getDriveClient() {
  if (driveClient) {
    return driveClient;
  }

  if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_KEY) {
    // Use service account authentication
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    driveClient = google.drive({ version: 'v3', auth });
  } else {
    throw new Error('Google Drive credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  return driveClient;
}

export async function createEmployeeFolder(employeeId: string, employeeName: string): Promise<string> {
  try {
    const drive = getDriveClient();
    const rootFolderId = GOOGLE_DRIVE_FOLDER_ID || 'root';

    // Check if folder already exists
    const existingFolders = await drive.files.list({
      q: `name='${employeeName} (${employeeId})' and parents in '${rootFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (existingFolders.data.files && existingFolders.data.files.length > 0) {
      return existingFolders.data.files[0].id!;
    }

    // Create new folder
    const folderResponse = await drive.files.create({
      requestBody: {
        name: `${employeeName} (${employeeId})`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: rootFolderId !== 'root' ? [rootFolderId] : undefined,
      },
      fields: 'id',
    });

    return folderResponse.data.id || '';
  } catch (error) {
    console.error('Error creating employee folder:', error);
    throw error;
  }
}

export async function uploadDocument(
  employeeFolderId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    const drive = getDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [employeeFolderId],
    };

    const media = {
      mimeType,
      body: fileBuffer,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    // Make file viewable by domain admins
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'domain',
        domain: 'creode.co.uk',
      },
    });

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function deleteDocument(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export async function getDocumentDownloadLink(fileId: string): Promise<string> {
  try {
    const drive = getDriveClient();
    const file = await drive.files.get({
      fileId,
      fields: 'webContentLink, webViewLink',
    });

    return file.data.webContentLink || file.data.webViewLink || '';
  } catch (error) {
    console.error('Error getting document download link:', error);
    throw error;
  }
}

export function getRootFolderId(): string {
  return GOOGLE_DRIVE_FOLDER_ID || 'root';
}

