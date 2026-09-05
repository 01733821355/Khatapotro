export interface UploadDriveResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: number;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * Finds or creates a "KhataPotro Documents" folder in Google Drive
 */
export async function getOrCreateKhataPotroFolder(accessToken: string): Promise<string> {
  // Search for existing folder
  const query = encodeURIComponent("name = 'KhataPotro Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const searchRes = await fetch(`${DRIVE_API_URL}?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'KhataPotro Documents',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Document management & receipts storage for KhataPotro',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Could not create KhataPotro folder in Google Drive');
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a document (Blob/File) to Google Drive into the KhataPotro folder
 */
export async function uploadDocumentToDrive(
  accessToken: string,
  file: File | Blob,
  fileName: string,
  docCategory: string,
  amount?: number
): Promise<UploadDriveResult> {
  let parentFolderId: string | undefined;
  try {
    parentFolderId = await getOrCreateKhataPotroFolder(accessToken);
  } catch (err) {
    console.warn('Folder creation bypassed, uploading to root:', err);
  }

  const metadata = {
    name: fileName,
    parents: parentFolderId ? [parentFolderId] : undefined,
    description: `KhataPotro Document: ${docCategory}${amount ? ` | Amount: ৳${amount}` : ''}`,
    properties: {
      category: docCategory,
      app: 'KhataPotro',
    },
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read file as binary array buffer
  const fileArrayBuffer = await file.arrayBuffer();
  const fileUint8 = new Uint8Array(fileArrayBuffer);

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const mediaHeader = `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  // Combine metadata and binary body
  const enc = new TextEncoder();
  const metaHeaderBytes = enc.encode(metadataPart);
  const mediaHeaderBytes = enc.encode(mediaHeader);
  const closeDelimiterBytes = enc.encode(closeDelimiter);

  const totalLength =
    metaHeaderBytes.byteLength +
    mediaHeaderBytes.byteLength +
    fileUint8.byteLength +
    closeDelimiterBytes.byteLength;

  const combinedBody = new Uint8Array(totalLength);
  let offset = 0;

  combinedBody.set(metaHeaderBytes, offset);
  offset += metaHeaderBytes.byteLength;

  combinedBody.set(mediaHeaderBytes, offset);
  offset += mediaHeaderBytes.byteLength;

  combinedBody.set(fileUint8, offset);
  offset += fileUint8.byteLength;

  combinedBody.set(closeDelimiterBytes, offset);

  const res = await fetch(`${DRIVE_UPLOAD_URL}&fields=id,name,webViewLink,webContentLink,size`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combinedBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Drive file upload failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
    size: Number(data.size || file.size),
  };
}
