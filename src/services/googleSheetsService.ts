import type { Transaction, InventoryItem, InventoryLog, CloudDocument, CalorieMealLog, CalorieActivityLog } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Extracts and cleans the Google Spreadsheet ID from any format:
 * - Full URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
 * - Short URL or /d/ID path
 * - Raw ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Match standard Google Sheets URL: .../spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Match shorthand /d/([a-zA-Z0-9-_]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/i);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // If user pasted something like: docs.google.com/spreadsheets/d/... without http
  const looseMatch = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (looseMatch && looseMatch[1]) {
    return looseMatch[1];
  }

  // Clean parameters or query strings
  const clean = trimmed.split('?')[0].split('#')[0].replace(/^https?:\/\//, '');

  // Look for any 20+ character alphanumeric sequence standard for Google Doc IDs
  const rawIdMatch = clean.match(/^[a-zA-Z0-9-_]{15,}$/);
  if (rawIdMatch) {
    return clean;
  }

  // Fallback: search for any candidate ID inside the string
  const anyId = trimmed.match(/([a-zA-Z0-9-_]{20,})/);
  if (anyId) {
    return anyId[1];
  }

  return trimmed;
}

/**
 * Parses Google API errors, specially detecting if Sheets or Drive API is not enabled
 */
export function parseGoogleApiError(errText: string, status?: number): {
  isApiDisabled: boolean;
  service: 'sheets' | 'drive' | null;
  enableUrl?: string;
  projectId?: string;
  userMessage: string;
} {
  let extractedMessage = errText;
  try {
    const json = JSON.parse(errText);
    if (json?.error?.message) {
      extractedMessage = json.error.message;
    }
  } catch {
    // not JSON
  }

  const isSheetsDisabled = 
    errText.includes('Google Sheets API has not been used') ||
    (errText.includes('sheets.googleapis.com') && (errText.includes('SERVICE_DISABLED') || status === 403));
    
  const isDriveDisabled =
    errText.includes('Google Drive API has not been used') ||
    (errText.includes('drive.googleapis.com') && (errText.includes('SERVICE_DISABLED') || status === 403));

  // Extract project ID / number
  const projectMatch = errText.match(/project[ =/](\d+)/i) || errText.match(/project%3D(\d+)/i);
  const projectId = projectMatch ? projectMatch[1] : '689412959744';

  if (isSheetsDisabled) {
    return {
      isApiDisabled: true,
      service: 'sheets',
      projectId,
      enableUrl: `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=${projectId}`,
      userMessage: `Google Sheets API চালু করা নেই (Project: ${projectId})। দয়া করে লিংকে গিয়ে একবার Enable এ ক্লিক করুন।`,
    };
  }

  if (isDriveDisabled) {
    return {
      isApiDisabled: true,
      service: 'drive',
      projectId,
      enableUrl: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${projectId}`,
      userMessage: `Google Drive API চালু করা নেই (Project: ${projectId})। দয়া করে লিংকে গিয়ে একবার Enable এ ক্লিক করুন।`,
    };
  }

  if (status === 404 || errText.includes('NOT_FOUND') || errText.includes('Requested entity was not found')) {
    return {
      isApiDisabled: false,
      service: null,
      userMessage: 'গুগল স্প্রেডশিটটি পাওয়া যায়নি। অনুগ্রহ করে নিশ্চিত করুন যে শিটের লিংক বা আইডি সঠিক এবং আপনার গুগল অ্যাকাউন্টটির এতে এডিট পারমিশন আছে।',
    };
  }

  if (status === 401 || errText.includes('UNAUTHENTICATED') || errText.includes('Invalid Credentials')) {
    return {
      isApiDisabled: false,
      service: null,
      userMessage: 'গুগল সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় গুগল সাইন ইন করুন।',
    };
  }

  return {
    isApiDisabled: false,
    service: null,
    userMessage: extractedMessage,
  };
}

/**
 * Creates a brand-new structured KhataPotro Spreadsheet in the user's Google Drive
 */
export async function createKhataPotroSpreadsheet(
  accessToken: string,
  customTitle = 'KhataPotro - Cloud Ledger & Real-Time Inventory'
): Promise<SpreadsheetInfo> {
  const payload = {
    properties: {
      title: customTitle,
      locale: 'en_US',
      timeZone: 'Asia/Dhaka',
    },
    sheets: [
      {
        properties: {
          title: 'Ledger_Transactions',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'RealTime_Inventory',
          gridProperties: { rowCount: 500, columnCount: 11, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Inventory_Logs',
          gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Document_Vault',
          gridProperties: { rowCount: 500, columnCount: 10, frozenRowCount: 1 },
        },
      },
    ],
  };

  const res = await fetch(SHEETS_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    const parsed = parseGoogleApiError(errText, res.status);
    if (parsed.isApiDisabled) {
      const customErr: any = new Error(parsed.userMessage);
      customErr.isApiDisabled = true;
      customErr.enableUrl = parsed.enableUrl;
      customErr.projectId = parsed.projectId;
      throw customErr;
    }
    throw new Error(`Failed to create Google Spreadsheet: ${parsed.userMessage}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Apply initial header values and styling
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Ensures that the required sheets exist in the spreadsheet.
 * If the user linked an existing sheet without these tabs, they are automatically added.
 */
export async function ensureRequiredSheetsExist(accessToken: string, spreadsheetId: string) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  try {
    const meta = await getSpreadsheetDetails(accessToken, cleanId);
    const existingTitles = new Set(
      meta.sheets?.map((s: any) => s.properties?.title?.trim()) || []
    );

    const requiredSheets = [
      { title: 'Ledger_Transactions', rowCount: 1000, colCount: 12 },
      { title: 'RealTime_Inventory', rowCount: 500, colCount: 12 },
      { title: 'Inventory_Logs', rowCount: 1000, colCount: 12 },
      { title: 'Document_Vault', rowCount: 500, colCount: 12 },
      { title: 'Daily_Calorie_Log', rowCount: 1000, colCount: 12 },
    ];

    const requestsToAdd: any[] = [];
    for (const sheet of requiredSheets) {
      if (!existingTitles.has(sheet.title)) {
        requestsToAdd.push({
          addSheet: {
            properties: {
              title: sheet.title,
              gridProperties: {
                rowCount: sheet.rowCount,
                columnCount: sheet.colCount,
                frozenRowCount: 1,
              },
            },
          },
        });
      }
    }

    if (requestsToAdd.length > 0) {
      const res = await fetch(`${SHEETS_BASE_URL}/${cleanId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: requestsToAdd }),
      });
      if (!res.ok) {
        console.warn('Auto-create tabs notice:', await res.text());
      }
    }
  } catch (err) {
    console.warn('ensureRequiredSheetsExist warning:', err);
  }
}

/**
 * Writes standard headers to the 4 sheets
 */
export async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  
  // First ensure sheets exist
  await ensureRequiredSheetsExist(accessToken, cleanId);

  const headerData = [
    {
      range: 'Ledger_Transactions!A1:J1',
      values: [
        [
          'Transaction ID',
          'Date',
          'Type (Income/Expense)',
          'Category',
          'Title / Particulars',
          'Amount (BDT)',
          'Payment Method',
          'Receipt Doc Reference',
          'Notes',
          'Synced At',
        ],
      ],
    },
    {
      range: 'RealTime_Inventory!A1:K1',
      values: [
        [
          'SKU Code',
          'Item Name',
          'Category',
          'Unit',
          'Cost Price (৳)',
          'Selling Price (৳)',
          'Current In-Stock',
          'Min Alert Level',
          'Total Stock Value (৳)',
          'Stock Status',
          'Last Updated',
        ],
      ],
    },
    {
      range: 'Inventory_Logs!A1:J1',
      values: [
        [
          'Log ID',
          'Date & Time',
          'SKU Code',
          'Item Name',
          'Movement Type',
          'Quantity',
          'Unit Price (৳)',
          'Total Valuation (৳)',
          'Reason / Reference',
          'Logged At',
        ],
      ],
    },
    {
      range: 'Document_Vault!A1:J1',
      values: [
        [
          'Document ID',
          'Document Title',
          'Doc Category',
          'Original File Name',
          'File Size',
          'Associated Amount (৳)',
          'Drive File ID',
          'Drive View Link',
          'Upload Date',
          'Notes',
        ],
      ],
    },
    {
      range: 'Daily_Calorie_Log!A1:L1',
      values: [
        [
          'Log ID',
          'Date',
          'Time',
          'Log Type (Meal / Activity)',
          'Title / Item Name',
          'Portion / Duration',
          'Calories (Intake + / Burn -)',
          'Protein (g)',
          'Carbs (g)',
          'Fat (g)',
          'Notes',
          'Synced At',
        ],
      ],
    },
  ];

  const res = await fetch(`${SHEETS_BASE_URL}/${cleanId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const parsed = parseGoogleApiError(errText, res.status);
    throw new Error(parsed.userMessage);
  }
}

/**
 * Full Sync of Ledger Transactions to Google Sheet
 */
export async function syncLedgerToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === 'income' ? 'Income (জমা)' : 'Expense (খরচ)',
    t.category,
    t.title,
    t.amount,
    t.paymentMethod,
    t.receiptName || (t.receiptDocId ? `Doc #${t.receiptDocId.slice(-6)}` : '-'),
    t.notes || '',
    new Date().toISOString(),
  ]);

  // First clear old rows starting from row 2
  await fetch(`${SHEETS_BASE_URL}/${cleanId}/values/Ledger_Transactions!A2:J1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (rows.length > 0) {
    const targetRange = `Ledger_Transactions!A2:J${rows.length + 1}`;
    const res = await fetch(
      `${SHEETS_BASE_URL}/${cleanId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: targetRange,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      const parsed = parseGoogleApiError(err, res.status);
      throw new Error(`Failed to sync transactions to sheet: ${parsed.userMessage}`);
    }
  }
}

/**
 * Full Sync of Real-Time Inventory and Logs to Google Sheet
 */
export async function syncInventoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  items: InventoryItem[],
  logs: InventoryLog[]
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const itemRows = items.map((item) => {
    const totalVal = item.quantity * item.costPrice;
    let status = 'In Stock (মজুদ আছে)';
    if (item.quantity <= 0) {
      status = 'Out of Stock (মজুদ নেই)';
    } else if (item.quantity <= item.minStockAlert) {
      status = 'Low Stock Alert (কম স্টক)';
    }

    return [
      item.sku,
      item.name,
      item.category,
      item.unit,
      item.costPrice,
      item.sellingPrice,
      item.quantity,
      item.minStockAlert,
      totalVal,
      status,
      new Date(item.lastUpdated).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
    ];
  });

  // Clear existing inventory data
  await fetch(`${SHEETS_BASE_URL}/${cleanId}/values/RealTime_Inventory!A2:K500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (itemRows.length > 0) {
    const targetRange = `RealTime_Inventory!A2:K${itemRows.length + 1}`;
    const res = await fetch(
      `${SHEETS_BASE_URL}/${cleanId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: targetRange,
          majorDimension: 'ROWS',
          values: itemRows,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      const parsed = parseGoogleApiError(err, res.status);
      throw new Error(`Inventory sync notice: ${parsed.userMessage}`);
    }
  }

  // Sync Inventory Logs
  const logRows = logs.map((l) => [
    l.id,
    new Date(l.date).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
    l.sku,
    l.itemName,
    l.type.toUpperCase(),
    l.quantity,
    l.unitPrice,
    l.totalAmount,
    `${l.reason || ''} ${l.reference ? `(Ref: ${l.reference})` : ''}`.trim(),
    new Date().toISOString(),
  ]);

  await fetch(`${SHEETS_BASE_URL}/${cleanId}/values/Inventory_Logs!A2:J1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (logRows.length > 0) {
    const targetRange = `Inventory_Logs!A2:J${logRows.length + 1}`;
    const res = await fetch(
      `${SHEETS_BASE_URL}/${cleanId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: targetRange,
          majorDimension: 'ROWS',
          values: logRows,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      const parsed = parseGoogleApiError(err, res.status);
      throw new Error(`Inventory logs sync notice: ${parsed.userMessage}`);
    }
  }
}

/**
 * Full Sync of Documents Vault to Google Sheet
 */
export async function syncDocumentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  documents: CloudDocument[]
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const docRows = documents.map((doc) => [
    doc.id,
    doc.title,
    doc.docCategory,
    doc.fileName,
    (doc.fileSize / 1024).toFixed(1) + ' KB',
    doc.amount || 0,
    doc.driveFileId || '-',
    doc.driveViewLink || '-',
    new Date(doc.uploadDate).toLocaleDateString(),
    doc.notes || '',
  ]);

  await fetch(`${SHEETS_BASE_URL}/${cleanId}/values/Document_Vault!A2:J500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (docRows.length > 0) {
    const targetRange = `Document_Vault!A2:J${docRows.length + 1}`;
    const res = await fetch(
      `${SHEETS_BASE_URL}/${cleanId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: targetRange,
          majorDimension: 'ROWS',
          values: docRows,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      const parsed = parseGoogleApiError(err, res.status);
      throw new Error(`Document Vault sync notice: ${parsed.userMessage}`);
    }
  }
}

/**
 * Full Sync of Daily Calorie Logs (Meals & Activities) to Google Sheet
 */
export async function syncCaloriesToSheet(
  accessToken: string,
  spreadsheetId: string,
  meals: CalorieMealLog[] = [],
  activities: CalorieActivityLog[] = []
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const rows: any[][] = [];

  meals.forEach((m) => {
    rows.push([
      m.id,
      m.date,
      m.time,
      `খাবার (${m.mealType.toUpperCase()})`,
      m.foodName,
      `${m.portion}x (${m.servingUnit || 'পরিমাণ'})`,
      `+${m.calories}`,
      m.protein || 0,
      m.carbs || 0,
      m.fat || 0,
      m.notes || '',
      new Date().toISOString(),
    ]);
  });

  activities.forEach((a) => {
    rows.push([
      a.id,
      a.date,
      a.time,
      'ব্যায়াম / পরিশ্রম (ACTIVITY)',
      a.activityName,
      `${a.durationMinutes} মিনিট (${a.intensity})`,
      `-${a.caloriesBurned}`,
      0,
      0,
      0,
      a.notes || '',
      new Date().toISOString(),
    ]);
  });

  // Sort rows chronologically descending
  rows.sort((a, b) => (b[1] + ' ' + b[2]).localeCompare(a[1] + ' ' + a[2]));

  await fetch(`${SHEETS_BASE_URL}/${cleanId}/values/Daily_Calorie_Log!A2:L1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (rows.length > 0) {
    const targetRange = `Daily_Calorie_Log!A2:L${rows.length + 1}`;
    const res = await fetch(
      `${SHEETS_BASE_URL}/${cleanId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: targetRange,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      const parsed = parseGoogleApiError(err, res.status);
      throw new Error(`Calorie Log sync notice: ${parsed.userMessage}`);
    }
  }
}

/**
 * Convenience orchestrator for complete two-way synchronization
 */
export async function syncAllToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  items: InventoryItem[],
  logs: InventoryLog[],
  documents: CloudDocument[],
  calorieMeals: CalorieMealLog[] = [],
  calorieActivities: CalorieActivityLog[] = []
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('কোনো সঠিক গুগল স্প্রেডশিট আইডি বা লিংক পাওয়া যায়নি');
  }

  // Ensure tabs and headers exist
  try {
    await initializeSheetHeaders(accessToken, cleanId);
  } catch (err: any) {
    if (err?.isApiDisabled) {
      throw err;
    }
    console.warn('Headers initialization notice:', err);
  }

  await syncLedgerToSheet(accessToken, cleanId, transactions);
  await syncInventoryToSheet(accessToken, cleanId, items, logs);
  await syncDocumentsToSheet(accessToken, cleanId, documents);
  await syncCaloriesToSheet(accessToken, cleanId, calorieMeals, calorieActivities);
}

/**
 * Fetch spreadsheet metadata to verify connection
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`${SHEETS_BASE_URL}/${cleanId}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    const parsed = parseGoogleApiError(errText, res.status);
    if (parsed.isApiDisabled) {
      const customErr: any = new Error(parsed.userMessage);
      customErr.isApiDisabled = true;
      customErr.enableUrl = parsed.enableUrl;
      customErr.projectId = parsed.projectId;
      throw customErr;
    }
    throw new Error(`Could not access spreadsheet (${res.status}): ${parsed.userMessage}`);
  }
  return res.json();
}
