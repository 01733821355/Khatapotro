import type { Transaction, InventoryItem, InventoryLog, CloudDocument } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

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
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Apply initial header values and styling
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Writes standard headers to the 4 sheets
 */
export async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
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
  ];

  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
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
}

/**
 * Full Sync of Ledger Transactions to Google Sheet
 */
export async function syncLedgerToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
) {
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
  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Ledger_Transactions!A2:J1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (rows.length > 0) {
    const res = await fetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Ledger_Transactions!A2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `Ledger_Transactions!A2:J${rows.length + 1}`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to sync transactions to sheet: ${err}`);
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
  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/RealTime_Inventory!A2:K500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (itemRows.length > 0) {
    await fetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/RealTime_Inventory!A2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `RealTime_Inventory!A2:K${itemRows.length + 1}`,
          majorDimension: 'ROWS',
          values: itemRows,
        }),
      }
    );
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

  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Inventory_Logs!A2:J1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (logRows.length > 0) {
    await fetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Inventory_Logs!A2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `Inventory_Logs!A2:J${logRows.length + 1}`,
          majorDimension: 'ROWS',
          values: logRows,
        }),
      }
    );
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

  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Document_Vault!A2:J500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (docRows.length > 0) {
    await fetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Document_Vault!A2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `Document_Vault!A2:J${docRows.length + 1}`,
          majorDimension: 'ROWS',
          values: docRows,
        }),
      }
    );
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
  documents: CloudDocument[]
) {
  // Ensure headers exist
  try {
    await initializeSheetHeaders(accessToken, spreadsheetId);
  } catch (err) {
    console.warn('Headers initialization notice:', err);
  }

  await syncLedgerToSheet(accessToken, spreadsheetId, transactions);
  await syncInventoryToSheet(accessToken, spreadsheetId, items, logs);
  await syncDocumentsToSheet(accessToken, spreadsheetId, documents);
}

/**
 * Fetch spreadsheet metadata to verify connection
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string) {
  const res = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Could not access spreadsheet (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
